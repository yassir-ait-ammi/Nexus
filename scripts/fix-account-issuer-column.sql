ALTER TABLE account ADD COLUMN IF NOT EXISTS issuer text;
DROP INDEX IF EXISTS account_issuer_accountid_uidx;
