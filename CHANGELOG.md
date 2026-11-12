# Changelog

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
