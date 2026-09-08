-- Better Auth 1.7.2 (the version pinned in apps/api/package.json) writes an
-- "issuer" value into the account table on every credential sign-up at
-- runtime. But `npx auth@latest` — the CLI `make migrate` runs — always
-- fetches the newest published tooling, and current tooling no longer knows
-- about this column (it was a transitional requirement in Better Auth
-- 1.7.0-1.7.2, removed in 1.7.3). Left to itself, `make migrate` never
-- creates the column, and the very first sign-up fails with:
--   column "issuer" of relation "account" does not exist
--
-- Applied idempotently after every `make migrate` (see the Makefile) so a
-- fresh clone works without a manual DB patch. Nullable, no default, no
-- unique index — deliberately looser than the column's original definition,
-- since nothing actually depends on it beyond "exists so the insert
-- succeeds." Full story: docs/decisions/0008-account-issuer-column.md
ALTER TABLE account ADD COLUMN IF NOT EXISTS issuer text;
DROP INDEX IF EXISTS account_issuer_accountid_uidx;
