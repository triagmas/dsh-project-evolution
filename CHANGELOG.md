# Changelog

## 1.1.2 — 2026-11-13

- Balanced the conversation view insets: more room above the title, a left
  gutter matching the right edge, and extra space below the last card.

## 1.1.1 — 2026-11-13

- Fixed the fifth-tab layout touching the right window edge; the view now keeps
  a right inset at narrow widths.
- Kept the automation form in two columns at ~700px panel widths instead of
  collapsing every field into one long column.
- Settings → Project Evolution scrolls back to its project index when the
  settings panel remembers an old scroll position.
- Rendered the numbered overview steps inline instead of leaving the number
  alone on its own line.

## 1.1.0 — 2026-11-13

- Project Evolution now opens as a fifth conversation view tab next to Chat,
  Trajectory, Context, and Fleet, scoped to the current chat's project.
- Settings → Project Evolution is now a global cross-project page: choose any
  project discovered from DSH workspaces or project sessions, then inspect its
  skills, knowledge counts, chats, and storage paths.
- Added `GET /api/project-evolution/projects`. The host derives projects from
  DSH-owned workspace/session metadata, including persisted headers from
  `ctx.sessionQuery`, and still never accepts an arbitrary filesystem path from
  the browser. Project-scoped routes now require a session.
- Global automation settings can be saved without a session.
- Project listing and overview are read-only: selecting a project in Settings
  no longer creates `.dsh` directories; capture and explicit actions still do.
- Closed chats remain discoverable after a Host restart through persisted
  `sessionQuery` headers. Project-scoped routes reject a missing session.
- Updated model-tool and prompt copy to point reviewers at the conversation tab.

## 1.0.1 — 2026-11-12

- Automatic capture now requires a real file change or an explicit user
  correction before creating a skill proposal. Read-only verification remains
  knowledge; manual Analyze can still create a review item.
- Generated skill names strip conversational lead-ins, normalize gerunds, and
  drop articles, so prompts like "You are auditing..." no longer become
  `use-you-are-...`.

## 1.0.0 — 2026-11-12

First public release.

- Project detection from the session working directory and Git root.
- Project-isolated evidence, knowledge, proposals, versions, and runs.
- Deterministic evidence replay with `PASS`, `FAIL`, and `Not tested`.
- Manual review, version diff, rollback, archive, and opt-in global publish.
- Native project skills at `.dsh/skills/<name>/SKILL.md` (flat files preserved).
- Settings section with Overview, Skills, Evolution, Knowledge, and Settings.
- English and Russian UI, light and dark DSH themes.
- Four model tools: status, recall, propose, record. No apply or rollback tool.
- Secret masking, prompt-injection filtering, path confinement, bounded storage.
- No runtime dependencies, network calls, telemetry, or model calls.
