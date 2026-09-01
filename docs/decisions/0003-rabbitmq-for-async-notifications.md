# 0003 — RabbitMQ to decouple notification fan-out from the request path

**Status:** Accepted

## Context

Sending a message and fanning out `@mention` notifications are different concerns with different reliability needs. Doing both inline in the same request handler means a slow or broken notification path can block or fail the message send itself — the thing the user is actually waiting on.

## Decision

`MessageService.create` publishes a `message.created` event to a durable topic exchange (`nexus.events`) and returns without waiting on it. A separate consumer (`MentionNotifierService`), bound to that event via the `notifications.mention` queue, parses `@mentions` and creates notifications independently.

## Consequences

- If the notification consumer is down entirely, messages still send and broadcast over WebSocket fine — see the README's [message sequence diagram](../../README.md#how-a-single-message-actually-travels-through-the-system).
- The trade-off taken on purpose: a handler failure in the consumer nacks the message without requeueing — it's dropped, not retried, and there's no dead-letter queue. Acceptable at this project's scale; explicitly flagged as the first thing to fix before scaling consumers — see [scaling-plan.md](../scaling-plan.md#known-gaps-verified-against-the-current-code-not-hypothetical).
