# 0008 — Patching the `account.issuer` column after every migrate

**Status:** Accepted

## Context

`apps/api/package.json` pins `better-auth@1.7.2`. Versions 1.7.0 through 1.7.2 briefly required an `issuer` column on the `account` table; 1.7.3 removed that requirement entirely. `make migrate` runs `npx auth@latest migrate` — and `npx auth@latest` always fetches whatever CLI is newest on npm, regardless of what's pinned in this repo. Current tooling no longer knows about `issuer`, so on a genuinely fresh database it never creates the column.

The pinned *runtime* library disagrees: `better-auth@1.7.2`'s actual account-creation code still writes a value into `issuer` on every credential sign-up. The result, verified directly: a fresh clone following the README exactly (`make install && make migrate && make dev`) would sign up successfully right up until the first real sign-up attempt, which fails with `column "issuer" of relation "account" does not exist` — a 500 with no useful message in the UI beyond "Could not create account."

This was hard to track down because the migration tooling actively lies about it — both `npx auth@latest migrate` and `generate` report "up to date" / "no migrations needed" even when the column is missing, because they're evaluating against the newer library's schema, not the one actually running.

## Decision

`scripts/fix-account-issuer-column.sql` adds `issuer` back — nullable, no default, no unique index — and `make migrate` runs it immediately after `npx auth@latest migrate` (see the Makefile). It's idempotent (`ADD COLUMN IF NOT EXISTS`, `DROP INDEX IF EXISTS`), so re-running `make migrate` on an already-fixed database is a no-op.

Deliberately not:
- **A `NOT NULL` constraint or unique index** (what the column's original, since-superseded definition had) — nothing depends on either; the goal is only "the column exists so the insert succeeds," not reproducing 1.7.2's original transitional schema exactly.
- **Upgrading `better-auth` past 1.7.2**, which would remove the need for this entirely — not done here since it's a broader dependency change with its own risk, out of scope for what was otherwise just "make sign-up work." Worth revisiting later.

## Consequences

- `make migrate` alone, unmodified, now produces a working schema on a genuinely empty database — verified by dropping `user`/`session`/`account`/`verification` entirely and re-running the documented setup steps from scratch.
- The checked-in `apps/api/better-auth_migrations/*.sql` snapshot still shows `issuer` as `NOT NULL` with a unique index — that file is a historical `generate` artifact, not something `migrate` reads from, so it doesn't affect correctness. It's misleading if read as current truth, though.
- This is inherently fragile to a future `better-auth` version bump: if `apps/api/package.json` is upgraded past 1.7.3, this patch becomes a harmless no-op (the column just sits there unused) rather than something that needs removing — but if it's upgraded partially or the library's internal behavior shifts again, this would need re-verifying the same way it was found here: actually running a sign-up, not trusting the migration CLI's own "up to date" claim.
