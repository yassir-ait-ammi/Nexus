# 0002 — Redis for cross-instance WebSocket delivery and presence

**Status:** Accepted

## Context

A single Node process can't hold every connection at real scale, so the API is built to run as multiple instances behind a load balancer. But two instances don't share memory: a message broadcast by instance A never reaches a socket connected to instance B unless something bridges them. The same problem applies to presence — "is this user online?" tracked in a local in-memory `Map` is only correct for sockets connected to *that* process.

## Decision

Redis fills two distinct roles, both about the one-process-vs-many-instances gap:

1. **`@socket.io/redis-adapter`** — every API instance publishes broadcasts through Redis pub/sub, so a broadcast on any instance reaches sockets on every instance.
2. **Redis sets for presence** (`SADD`/`SREM`/`SCARD` per user, key `presence:<userId>`) — a user is "online" if they have at least one socket registered anywhere, checked against Redis rather than local state.

Not chosen for general-purpose caching — see the README's ["Why Redis specifically (not just 'for caching')"](../../README.md#why-redis-specifically-not-just-for-caching).

## Consequences

- Running a second API instance becomes a deploy/config change, not a rewrite — see [scaling-plan.md](../scaling-plan.md).
- Presence has no TTL or reconciliation today: if an API process crashes without running `handleDisconnect`, its sockets' entries in a user's presence set are never cleaned up. Tracked as a known gap in [scaling-plan.md](../scaling-plan.md#known-gaps-verified-against-the-current-code-not-hypothetical).
