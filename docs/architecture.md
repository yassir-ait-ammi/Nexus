# Architecture

This is the module-level view. For the "why" behind each infrastructure choice, see the [README](../README.md#why-each-piece-of-infrastructure-is-here); for schema detail see [database-design.md](database-design.md); for the real-time event catalog see [websocket-flow.md](websocket-flow.md).

![Nexus architecture diagram](architecture.png)

## Processes

Nexus runs as two deployable units:

- **`apps/web`** — a static React + Vite build. Talks to the API over REST (fetch) and one persistent WebSocket connection (Socket.IO, credentials included so the better-auth session cookie rides along).
- **`apps/api`** — a single NestJS process containing three logically distinct roles that all live in the same process today, but don't have to:
  1. **REST controllers** — CRUD over workspaces, channels, messages, membership, reactions, profile/avatar.
  2. **WebSocket gateway** (`ChatGateway`) — owns all real-time fan-out: presence, typing, and broadcasting the effects of REST writes to connected clients.
  3. **Notification consumer** (`MentionNotifierService`) — a RabbitMQ consumer that reacts to `message.created` events and creates `@mention` notifications asynchronously.

Nothing about the module boundaries assumes these three run in the same process. The reason they currently do is simplicity — the reason they *can* be split later without a rewrite is Redis (see below) and RabbitMQ, which already decouple state and side effects from any single process's memory.

## Module map (`apps/api/src`)

| Module | Owns | Depends on |
|---|---|---|
| `auth/` | better-auth instance (email/password + Google OAuth), session validation used by both REST guards and the WS gateway | Postgres (via its own raw SQL migrations, not TypeORM) |
| `workspace/` | Workspace CRUD, invite-code join flow | `membership/`, `chat/` (to broadcast `member:joined`) |
| `channel/` | Channel CRUD, access control (including DM channels — see [database-design.md](database-design.md)) | `membership/`, `chat/` (controller broadcasts `channel:created` on DM creation — see below) |
| `membership/` | Workspace↔user roles; pure data access, no gateway dependency | — |
| `message/` | Messages + reactions | `chat/` (broadcasts on every write), `common/rabbitmq/` (publishes `message.created`) |
| `notification/` | Mention notifications + the RabbitMQ consumer that creates them | `common/rabbitmq/`, `common/auth-users/`, `chat/` (broadcasts `notification:created`) |
| `chat/` | The WebSocket gateway — rooms, presence, the `broadcast*` methods other modules call | `membership/`, `channel/`, `common/redis/` |
| `profile/` | Avatar upload | `common/cloudinary/`, `common/auth-users/` |
| `common/redis/` | Redis client pair (pub/sub) + presence tracking (`SADD`/`SREM`/`SCARD`) | — |
| `common/rabbitmq/` | Topic exchange `nexus.events`; generic `publish`/`consume` helpers | — |
| `common/cloudinary/` | Cloudinary client | — |
| `common/auth-users/` | Reads/writes better-auth's own `user` table via raw SQL (TypeORM doesn't own that table) | Postgres |

`channel/` and `chat/` depend on each other — a genuine circular module dependency, resolved with `forwardRef()` on both sides rather than hidden. `chat/` needs `channel/` for access checks on `channel:join`; `channel/` needs `chat/` to announce a new DM to its recipient. See [decisions/0007](decisions/0007-channel-created-broadcast.md).

Two directories exist but aren't real: `user/` and `attachment/` are unmodified Nest CLI scaffolding — entities that are never registered with TypeORM (`export class User {}`), services that return placeholder strings. They're dead code, not a hidden feature. Identity lives in better-auth's `user` table via `auth-users/`; there is no file-attachment feature beyond avatar upload.

## The REST → WebSocket bridge

The single most important cross-cutting pattern: **REST controllers don't emit WebSocket events directly** — with one deliberate exception. A write goes REST → service → Postgres, and only after that succeeds does the *same service* (or, for DM creation specifically, the controller — see below) call a `broadcast*` method on the injected `ChatGateway`. Three services do this, plus one controller:

- `MessageService` — every create/update/delete/reaction-toggle broadcasts to the message's channel room.
- `WorkspaceService` — a successful invite-code join broadcasts `member:joined` to the workspace room.
- `MentionNotifierService` (itself a RabbitMQ consumer, not a controller) — broadcasts `notification:created` to the mentioned user's personal room.
- `ChannelController` — the exception: broadcasts `channel:created` to both DM participants' personal rooms after `findOrCreateDirectMessage`. It's on the controller, not `ChannelService`, specifically to avoid `ChannelService` itself needing a `forwardRef` back to `chat/` (see the circular-dependency note above).

Full event-by-event detail is in [websocket-flow.md](websocket-flow.md).

## Process topology

Day-to-day dev (`make dev`) runs one API instance directly on the host, against one Postgres, one Redis, one RabbitMQ. That's not the only topology, and it's no longer hypothetical: `make cluster` runs

```
                Nginx :8080
                     |
        -------------------------
        |            |          |
      api1          api2       api3      (containerized NestJS, port 3000 internal)
        |            |          |
        -------------------------
                     |
      -------------------------------
      |             |                |
   Postgres       Redis          RabbitMQ
```

— three containerized API instances behind an nginx reverse proxy, all sharing the same Postgres/Redis/RabbitMQ. This is what actually exercises the Redis adapter and Redis-backed presence described in [websocket-flow.md](websocket-flow.md) and the README's ["Why Redis"](../README.md#why-redis-specifically-not-just-for-caching) section — at N=1 those code paths run but are never actually tested by a second process needing to hear about the first's broadcasts.

Getting this working correctly needed one non-obvious fix: `nginx/nginx.conf` uses `ip_hash` (sticky sessions), not round-robin. Socket.IO's default transport does an HTTP long-polling handshake *before* upgrading to a WebSocket, and that handshake is a sequence of requests that must all land on the same backend process — plain round-robin would intermittently break new connections by bouncing a client's handshake across instances mid-sequence. Full rationale in [decisions/0006](decisions/0006-nginx-sticky-sessions.md).

Running N instances for real still surfaces problems that don't exist at N=1 (connection pool sizing, RabbitMQ consumer concurrency, presence cleanup on a crashed instance) — tracked honestly in [scaling-plan.md](scaling-plan.md).

## Decisions

Point-in-time rationale for choices that were non-obvious enough to be worth recording is in [decisions/](decisions).
