# 0005 — Cloudinary for avatar storage

**Status:** Accepted

## Context

Avatar images need to live somewhere durable and be reachable regardless of which API instance handled the upload. Storing them on the API server's own disk doesn't survive a redeploy and doesn't work once there's more than one instance — instance B has no access to a file instance A wrote.

## Decision

Avatar uploads go to Cloudinary. `ProfileController` uploads the image and stores only the resulting URL, via `AuthUsersService.updateAvatar`, in better-auth's `user.image` column.

## Consequences

- The API never touches image bytes on disk — no local storage to keep in sync across instances, nothing lost on redeploy.
- Requires real Cloudinary credentials to exercise this feature locally (see the README's [running-it-locally](../../README.md#running-it-locally) section) — everything else in the app works without external accounts.
- There is no general file-attachment feature built on top of this; see the "dead code" note in [database-design.md](../database-design.md#dead-code-for-the-record) — `attachment/` is unused scaffolding, not a hidden capability.
