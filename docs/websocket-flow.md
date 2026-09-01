# WebSocket Flow

Everything here lives in `ChatGateway` (`apps/api/src/chat/chat.gateway.ts`), a single Socket.IO gateway on the default namespace. For the end-to-end path of one message including RabbitMQ, see the README's ["How a single message actually travels through the system"](../README.md#how-a-single-message-actually-travels-through-the-system).

## Redis adapter

On `afterInit`, the gateway awaits `RedisService.ready` (module init order between `RedisModule` and `ChatGateway` isn't guaranteed by Nest) and then calls:

```ts
server.adapter(createAdapter(redisService.pubClient, redisService.subClient));
```

`pubClient` and `subClient` are separate Redis connections (a client in subscribe mode can't run other commands) — `subClient` is `pubClient.duplicate()`. `pubClient` doubles as the general-purpose client used for presence tracking below.

## Connection lifecycle

1. **Auth** — `auth.api.getSession()` runs against the incoming handshake headers, using the same better-auth instance as REST. No valid session → immediate `disconnect(true)`, no rooms joined, no presence marked.
2. `client.data.userId` is set from the session.
3. **Rooms joined automatically on connect:**
   - `workspace:<id>` for every workspace the user is a member of.
   - `user:<userId>` — a personal room, used later for `notification:created`.
   - **Not** joined automatically: any channel room. The client must emit `channel:join` after connecting.
4. **Presence** — `RedisService.markSocketOnline(userId, socketId)` adds this socket to the Redis set `presence:<userId>`. If this was the user's *only* socket (`wasOffline`), the gateway broadcasts `presence:update` (`status: 'online'`) to every workspace room they belong to. A second tab/device connecting does not re-broadcast.

## Disconnection

`markSocketOffline` removes the socket from the presence set. If that was the user's *last* socket (`wentOffline`), `presence:update` (`status: 'offline'`) goes out to their workspace rooms.

## Client → server events

| Event | Payload | Behavior |
|---|---|---|
| `workspace:join` | `{ workspaceId }` | Verifies membership, joins `workspace:<id>` — for adding a room mid-session (e.g. right after creating/joining a workspace) without a reconnect. |
| `channel:join` | `{ channelId }` | Verifies access via `ChannelService.findOne`. Leaves the previously-held channel room (a socket holds **one channel room at a time**), joins the new one. Fails silently on no access. |
| `typing:start` | `{ channelId }` | Broadcasts `typing:update` (`isTyping: true`) to the channel room, sender excluded. |
| `typing:stop` | `{ channelId }` | Same, `isTyping: false`. |
| `presence:query` | `{ workspaceId }` | Returns (as an ack, not a broadcast) the online user IDs among that workspace's members — computed from Redis, so it's correct regardless of which API instance each member is connected to. |

## Server → client events

| Event | Emitted from | Target |
|---|---|---|
| `presence:update` | connect/disconnect handlers | every `workspace:<id>` room the user belongs to |
| `typing:update` | `typing:start`/`typing:stop` handlers | `channel:<id>` room, sender excluded |
| `message:created` | `MessageService.create` | `channel:<id>` room |
| `message:updated` | `MessageService.update` | `channel:<id>` room |
| `message:deleted` | `MessageService.remove` | `channel:<id>` room, payload `{ channelId, messageId }` |
| `message:reactionUpdated` | `MessageService.toggleReaction` | `channel:<id>` room, payload `{ channelId, messageId, reactions }` |
| `member:joined` | `WorkspaceService.joinByInviteCode` | `workspace:<id>` room |
| `notification:created` | `MentionNotifierService` (RabbitMQ consumer) | `user:<id>` personal room |

## The REST → WebSocket bridge

REST controllers never emit socket events themselves. A write commits to Postgres first; only on success does the *same service* call one of `ChatGateway`'s six public `broadcast*` methods:

| Service | Calls | When |
|---|---|---|
| `MessageService` | `broadcastMessageCreated` / `Updated` / `Deleted`, `broadcastReactionUpdated` | after every successful create/update/delete/reaction-toggle |
| `WorkspaceService` | `broadcastMemberJoined` | after a new member joins via invite code (not on repeat joins) |
| `MentionNotifierService` | `broadcastNotification` | after creating a `Notification` row, itself triggered by consuming `message.created` off RabbitMQ |

`MembershipService` and `ChannelService` are pure data access — they never touch `ChatGateway`; broadcasting is triggered one layer up.

## Frontend

`apps/web/src/lib/socket.ts` is a thin singleton wrapper: `connectSocket()` calls `io(SOCKET_URL, { withCredentials: true })` so the better-auth session cookie rides along for the server-side auth check above.
