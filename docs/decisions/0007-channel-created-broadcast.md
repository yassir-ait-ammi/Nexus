# 0007 — `channel:created` broadcast for DM creation

**Status:** Accepted

## Context

Starting a DM (`POST /channel/direct-message` → `ChannelService.findOrCreateDirectMessage`) only ever updated the initiator's own local frontend state. The recipient had no way to learn the DM existed — not a WebSocket event (none was emitted), not a REST refetch trigger (the channel list is only fetched on mount/workspace-switch), and the sidebar didn't even render a "Direct Messages" section for either party. In practice the recipient only discovered a DM if they separately started one back with the same person, which just found the already-existing channel.

This is different from every other write in the app: a new message, a reaction, a membership change all broadcast into a room the affected users are already in (`channel:<id>`, `workspace:<id>`). A newly created DM channel has no such room yet for the recipient — that's exactly what needs to be announced.

## Decision

`ChatGateway.broadcastChannelCreated(channel)` emits `channel:created` to every member's personal `user:<id>` room (the same room `notification:created` already uses), called from `ChannelController.createDirectMessage` after `findOrCreateDirectMessage` returns — on every call, not just genuine creations, since re-announcing an already-known channel to a socket that already has it is a harmless no-op merge on the frontend.

This call had to go in `ChannelController`, not `ChannelService`. `ChatModule` already imports `ChannelModule` (`ChatGateway` needs `ChannelService.findOne` for `channel:join` access checks — see [websocket-flow.md](../websocket-flow.md)), so `ChannelService` injecting `ChatGateway` back would be a circular module dependency. Resolved with `forwardRef()` on both modules' imports, keeping `ChannelService` itself free of any gateway dependency — consistent with [decisions/0004](0004-manual-foreign-keys-over-orm-relations.md)'s general pattern of services being simple and explicit, at the small cost of one non-obvious `forwardRef` wart at the module boundary.

## Consequences

- A DM now appears in the recipient's sidebar in real time, without a page reload or them separately re-initiating it.
- `ChatModule` and `ChannelModule` now have a genuine circular dependency, made explicit (and grep-able) via `forwardRef()` rather than hidden.
- Fixing the realtime signal alone wouldn't have been enough — `ChannelSidebar.tsx` had no "Direct Messages" rendering at all for either party. Both had to be fixed together.
