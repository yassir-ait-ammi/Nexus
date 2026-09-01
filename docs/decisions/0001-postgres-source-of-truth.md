# 0001 — PostgreSQL as the single source of truth

**Status:** Accepted

## Context

Messages, workspaces, channels, membership, reactions, and notifications all need to survive a process restart and be readable by any API instance, not just the one that created them. Keeping any of this in memory means it's gone on redeploy and invisible to every other instance.

## Decision

PostgreSQL is the source of truth for everything that matters. Nothing important — no message, no membership row, no notification — lives only in memory or only on one instance.

## Consequences

- Every write that matters is a DB write on the critical path before anything else happens (a WebSocket broadcast, a RabbitMQ publish) — see [architecture.md](../architecture.md#the-rest--websocket-bridge).
- Redis and RabbitMQ exist to solve problems *downstream* of this — cross-instance delivery and async side effects — not to replace Postgres as the record of what happened.
- The relational domain (users, workspaces, channels, membership, messages) is genuinely relational, which is also why TypeORM was chosen over a document store — see the [tech stack table](../../README.md#tech-stack).
