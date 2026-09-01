# 0006 — nginx sticky sessions (`ip_hash`) in front of the API cluster

**Status:** Accepted

## Context

Once `make cluster` puts nginx in front of 3 API instances, a plain round-robin upstream (nginx's default) intermittently breaks new WebSocket connections. The reason isn't obvious from the architecture diagram: Socket.IO's default transport starts with an HTTP long-polling handshake, and only upgrades to a real WebSocket after that handshake completes. The handshake itself is a *sequence* of separate HTTP requests, and Socket.IO requires all of them to land on the same server process — it isn't a single request-response.

The Redis adapter (ADR [0002](0002-redis-for-websocket-scaling-and-presence.md)) does not solve this. It solves a different problem: broadcasting between sockets that are *already connected*, each to whichever instance they landed on. It has no role in the handshake that gets a socket connected in the first place.

Round-robin load balancing routes each of those handshake requests to a different instance essentially at random, so the handshake sequence breaks on whichever instance didn't see the previous request, and the connection fails — intermittently, which makes it a nasty one to debug blind.

## Decision

`nginx/nginx.conf` uses `ip_hash` on the `nexus_api` upstream instead of the default round-robin, pinning each client IP to the same backend instance for the duration of its connections (both REST and WebSocket).

## Consequences

- New WebSocket connections complete reliably regardless of which of the 3 instances first receives a client's traffic.
- A given client's load is not distributed across all 3 instances — it's fixed to one, for as long as its IP maps there. At 3 instances, this is a coarse form of balancing (good enough here), not a fine-grained one; a larger deployment would more likely reach for Socket.IO's own [sticky-session-aware adapters](https://socket.io/docs/v4/using-multiple-nodes/) or force `transports: ['websocket']` client-side to skip the polling handshake entirely and remove the need for stickiness altogether.
- This is why the earlier claim in [scaling-plan.md](../scaling-plan.md) that "no sticky sessions [are] needed for correctness" was wrong and has been corrected — sticky sessions are required for the handshake, not just a throughput optimization.
