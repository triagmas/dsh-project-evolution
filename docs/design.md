# Navigation and project scope

## Problem

Project Evolution is project-scoped work, but it used to live only under
**Settings → Project Evolution**. That made a project workflow look like a
global preference and hid it from the conversation where the work happens. The
only way to inspect another project was to open one of its sessions and use
that settings page.

## Decision

1. **Project Evolution is a conversation view.** It registers in DSH's
   `conversation.view` list as `project-evolution` at `order: 40`, after the
   built-in Chat (`0`), Trajectory (`10`), Context (`20`), and Fleet (`30`).
   The view receives the active `sessionId`, resolves that session's project,
   and renders Overview, Skills, Evolution, and Knowledge for that project.
2. **Settings is the global index.** The existing `settings.section`
   registration becomes a cross-project page. It lists projects derived from
   DSH workspaces and existing session metadata, lets the user choose one, and
   shows that project's skills, knowledge counts, chats, and storage paths.
   Automation and limits remain global and are saved without a session.
3. **No new path authority.** The browser still never submits a filesystem
   path. `GET /api/project-evolution/projects` is built on
   `workspaceRegistry.list()` plus live sessions and, when mounted, persisted
   session headers from `ctx.sessionQuery`; every follow-up request uses an
   existing session-scoped route.
4. **Inspection is read-only.** The projects list and overview use DSH metadata
   and a non-cached store without `init()`. Selecting a project therefore does
   not create `.dsh` directories in it; capture and explicit actions are the
   only paths that initialize project storage.

## Alternatives rejected

- **Settings-only, with a project picker.** Smallest change, but keeps the
  project workflow in a global preferences surface and does not put the view
  next to Chat.
- **Duplicate tabs in both places.** Two entry points would each need the same
  review state and could disagree after an action. The conversation view owns
  project work; Settings remains an index and global configuration.
- **A second project registry owned by the plugin.** It would create state
  outside DSH, risk stale entries, and require a new security boundary.
  Deriving the list from DSH metadata keeps one source of truth.

## Verification

- Host tests cover project grouping from live and persisted headers,
  representative session selection, the projects route, session-required
  routes, read-only overview and listing, and sessionless global settings.
- The client contract test checks both slot registrations, their order, and
  EN/RU key parity.
- The acceptance scenario asserts the projects API returns both temp project
  roots with their chat counts.
- Browser rendering still needs a live GUI check after installation; without a
  browser harness in this repository, that remains a manual acceptance step.
