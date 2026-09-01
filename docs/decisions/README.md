# Architecture Decision Records

Short records of decisions that weren't obvious enough to skip explaining — each one point-in-time: right when it was written, subject to being revisited.

| ADR | Decision |
|---|---|
| [0001](0001-postgres-source-of-truth.md) | PostgreSQL as the single source of truth |
| [0002](0002-redis-for-websocket-scaling-and-presence.md) | Redis for cross-instance WebSocket delivery and presence |
| [0003](0003-rabbitmq-for-async-notifications.md) | RabbitMQ to decouple notification fan-out from the request path |
| [0004](0004-manual-foreign-keys-over-orm-relations.md) | Manual foreign keys instead of TypeORM relations |
| [0005](0005-cloudinary-for-avatar-storage.md) | Cloudinary for avatar storage |
| [0006](0006-nginx-sticky-sessions.md) | nginx sticky sessions (`ip_hash`) in front of the API cluster |

## Format

Each ADR follows: **Status**, **Context** (the problem, and the naive approach that doesn't survive it), **Decision**, **Consequences** (including the honest trade-offs, not just the upside).
