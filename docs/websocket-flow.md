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
| `channel:created` | `ChannelController.createDirectMessage` | `user:<id>` personal room, once per DM participant |

`channel:created` is the one exception to "REST controllers never emit socket events themselves" below — it's called directly from the controller rather than a service, because `ChannelService` can't depend on `ChatGateway` without a circular module import (see the bridge table's note on `ChannelController`). It exists because DM creation otherwise has no realtime signal at all: unlike a message send, there's no channel room the recipient is already in to broadcast into — the whole point of the event is to tell them a channel they've never joined now exists. See [decisions/0007](decisions/0007-channel-created-broadcast.md).

## The REST → WebSocket bridge

REST controllers never emit socket events themselves — with one exception, noted below. A write commits to Postgres first; only on success does the *same service* (or, for `ChannelController`, the controller itself) call one of `ChatGateway`'s public `broadcast*` methods:

| Service | Calls | When |
|---|---|---|
| `MessageService` | `broadcastMessageCreated` / `Updated` / `Deleted`, `broadcastReactionUpdated` | after every successful create/update/delete/reaction-toggle |
| `WorkspaceService` | `broadcastMemberJoined` | after a new member joins via invite code (not on repeat joins) |
| `MentionNotifierService` | `broadcastNotification` | after creating a `Notification` row, itself triggered by consuming `message.created` off RabbitMQ |
| `ChannelController` | `broadcastChannelCreated` | after `findOrCreateDirectMessage` returns, on every `POST /channel/direct-message` — called from the controller, not `ChannelService` (see below) |

`MembershipService` and `ChannelService` are pure data access — they never touch `ChatGateway` directly. `ChannelController` is the one place a *controller* calls into the gateway rather than a service: `ChatModule` already imports `ChannelModule` (`ChatGateway` needs `ChannelService` for `channel:join` access checks), so having `ChannelService` inject `ChatGateway` back would be a circular module dependency. Resolved with `forwardRef()` between `ChatModule` and `ChannelModule`, with the injection kept in the controller to keep `ChannelService` itself gateway-free. See [decisions/0007](decisions/0007-channel-created-broadcast.md).

## Frontend

`apps/web/src/lib/socket.ts` is a thin singleton wrapper: `connectSocket()` calls `io(SOCKET_URL, { withCredentials: true })` so the better-auth session cookie rides along for the server-side auth check above.

`App.tsx` listens for `channel:created` and merges the channel into its `channels` state (a no-op if already present — e.g. for whoever initiated the DM, who already added it locally). `ChannelSidebar.tsx` renders a "Direct Messages" section from `channels.filter(c => c.section === 'direct-messages')`, resolving the other participant's name/avatar/online-status from the already-loaded workspace member list.
