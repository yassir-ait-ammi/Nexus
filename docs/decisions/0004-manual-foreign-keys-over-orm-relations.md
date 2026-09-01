# 0004 — Manual foreign keys instead of TypeORM relations

**Status:** Accepted

## Context

TypeORM supports declaring relations (`@ManyToOne`, `@OneToMany`, `@JoinColumn`, ...) that let entities eager- or lazy-load related rows through property access. None of that is used anywhere in this codebase — every cross-entity reference (`workspaceId`, `channelId`, `senderId`, `userId`, ...) is a plain string/UUID column, and every join is written explicitly in service code (batched `In(...)` queries folded into JS `Map`s).

## Decision

No TypeORM relation decorators. Every relationship between entities — and between app entities and better-auth's own `user` table, which isn't even a TypeORM entity — is enforced only in application code, resolved explicitly at read time (e.g. `AuthUsersService.findByIds` to hydrate a message's sender).

## Consequences

- What a query fetches is always visible in the service that makes it — no relation triggers a surprise extra query or an unexpectedly large eager-loaded graph.
- No DB-level referential integrity: nothing stops a row from pointing at an ID that no longer exists, and there's no cascading delete for free (except on better-auth's own `session`/`account` tables, which do have real Postgres FKs with `ON DELETE CASCADE`). See [database-design.md](../database-design.md).
- This also means the app's own entities and better-auth's tables can coexist in one Postgres database despite being owned by two different migration mechanisms — there was never a need for TypeORM to know about `user` as a formal relation target.
