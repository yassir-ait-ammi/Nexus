# Scaling Plan

This project's whole premise is that infrastructure gets added when a real limitation is felt, not in advance (see the README's ["build order"](../README.md#the-build-order-and-why-it-matters)). In that spirit, this doc is split honestly: what's already built to survive more than one API instance, and what would actually break first if you tried to run this at real scale today.

## Already handled

| Concern | How |
|---|---|
| Multiple API instances can't share WebSocket state | `@socket.io/redis-adapter`, wired in `ChatGateway.afterInit` — a broadcast on one instance reaches sockets connected to any instance. See [websocket-flow.md](websocket-flow.md). |
| "Is this user online?" must be correct regardless of which instance answers | Presence tracked in Redis sets (`SADD`/`SREM`/`SCARD`), not an in-process `Map`. |
| A slow/failed side effect (mention notifications) shouldn't block or fail the request that triggered it | RabbitMQ: the publish from `MessageService.create` is fire-and-forget, never awaited before responding to the client. |
| Avatar storage must survive a redeploy and work across instances | Cloudinary — the API never writes image bytes to its own disk. |
| Actually running more than one instance | `make cluster` — 3 containerized API instances behind nginx (`ip_hash`), sharing one Postgres/Redis/RabbitMQ. See [architecture.md](architecture.md#process-topology). |

The first four were built before a second instance existed, so that adding one would be a config/deploy change, not a rewrite — the cluster is that change actually made, and it's what surfaced the sticky-session requirement below.

## Known gaps (verified against the current code, not hypothetical)

These are the things that would actually surface first, in roughly the order they'd bite:

- **RabbitMQ consumer drops failures, doesn't retry them.** `RabbitmqService.consume` nacks a message with `requeue: false` on any handler error — it's dead, not retried, and there's no dead-letter queue to inspect it afterward. This is called out directly in the code's own comment (`common/rabbitmq/rabbitmq.service.ts`) as "good enough for this project's scale." At real scale it means a transient failure (a DB blip while creating a notification, for instance) silently loses that mention notification forever.
- **No consumer concurrency control.** `channel.consume` is set up without a `prefetch()` call, so there's no explicit cap on how many messages `MentionNotifierService` processes concurrently. Fine at low volume; worth revisiting before running multiple consumer instances.
- **Message queries are capped, not paginated.** `MessageService`'s channel query uses a fixed `take: 200` — the 200 most recent messages, full stop. There's no cursor/offset pagination for scrolling further back. Works for a demo channel; breaks as the "load more" feature for a channel with real history.
- **No rate limiting anywhere.** No `ThrottlerModule`, no per-route limits. Every REST endpoint and every `@SubscribeMessage` handler (e.g. `typing:start`) can be called as fast as a client wants.
- **No explicit Postgres connection pool sizing.** `TypeOrmModule.forRootAsync` doesn't set `extra.max` or similar — it's running on `pg`'s defaults. At N=1 API instance this is invisible; at N=5 instances each opening a default-sized pool against one Postgres instance, this is usually the first thing to actually fall over.
- **Presence has no TTL or reconciliation.** A socket's ID is added to `presence:<userId>` on connect and removed on `handleDisconnect`. If an API *process* crashes outright (not a client disconnecting normally), `handleDisconnect` never runs on that process, and nothing else ever cleans up that socket ID — the user can appear permanently "online" from a phantom entry. There's no TTL on the Redis set and no background reconciliation job.
- **No DB-level referential integrity.** As covered in [database-design.md](database-design.md), every cross-entity reference is a plain column, not a FK constraint — nothing at the database level stops orphaned rows if application code has a bug.

## What actually running N instances would require

1. ~~A load balancer in front of the API that supports WebSocket upgrades~~ — **done**: `make cluster` runs 3 containerized API instances behind nginx (`nginx/nginx.conf`). Turned out sticky sessions (`ip_hash`) are *required* for correctness here, not just a throughput nice-to-have — Socket.IO's handshake is a sequence of HTTP requests that must land on the same instance, and the Redis adapter doesn't help with that (it only handles broadcasting between sockets that are already connected). Full rationale in [decisions/0006](decisions/0006-nginx-sticky-sessions.md).
2. Deciding a `prefetch()` value for the RabbitMQ consumer and, ideally, a dead-letter queue before scaling consumers horizontally — right now more consumer instances just means more things silently dropping failed messages independently. With the cluster running, this is no longer hypothetical either: all 3 instances now run `MentionNotifierService` against the same `notifications.mention` queue, so RabbitMQ is already round-robining mention-processing work across them — but each still nacks-and-drops on failure independently.
3. Sizing the Postgres pool per instance with the total instance count in mind, or moving to a pooler (e.g. PgBouncer) in front of Postgres. At 3 instances on default pool settings this hasn't bitten yet, but it's the next thing that would.
4. Real pagination on message history before "scroll up for more" is a feature anyone would actually use at scale.
5. A presence reconciliation strategy (TTL + periodic re-affirm from connected sockets, or heartbeat-based expiry) so a crashed instance can't leave a user stuck "online" forever.

None of items 2–5 is urgent at the project's current scale — tracked here so the gap between "designed to scale" and "actually scaled" stays visible instead of implied away by the architecture diagram.
