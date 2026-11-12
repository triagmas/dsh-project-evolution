# Architecture

## Goal

The project should get *smarter from verified experience*, not merely accumulate
Markdown. The design therefore separates four things that are often conflated:

1. **Evidence** — what actually happened in a DSH turn (files, commands, output,
   corrections, completion).
2. **Knowledge** — deduplicated, masked project facts extracted from evidence.
3. **Proposal** — a candidate skill plus checks, a deterministic replay, a diff,
   and its baseline.
4. **Applied skill** — an ordinary native `SKILL.md` file, only after a user
   action, with a version and a way back.

## Host modules

| Module | Responsibility |
| --- | --- |
| `index.js` | DSH host entry; derives `DSH_HOME`, registers routes/tools/prompt/observer, disposes via `ctx.effect` |
| `src/core/project.js` | working directory → Git root → project key; bounded Git snapshot; path confinement |
| `src/core/store.js` | global config, project state, knowledge JSONL, proposals, versions, runs, locks, cleanup |
| `src/core/analyzer.js` | session events → turn signals → knowledge rows and skill content; backtest cases and scoring |
| `src/core/security.js` | secret masking, injection/dangerous-command scans, SKILL.md validation |
| `src/core/skills.js` | native project skill I/O, proposals, apply/reject/rollback, enable/archive/publish |
| `src/core/service.js` | orchestration shared by Web actions and model tools; locking and budgets |
| `src/core/routes.js` | authenticated exact Fetch routes below `/api/project-evolution` |
| `src/core/tools.js` | four model-facing read/record/propose tools |
| `client.js` | `settings.section` Web UI, EN/RU dictionaries, theme-token CSS |

Pure modules (`analyzer`, `security`, `project`, `util`) have no DSH service
dependency and are unit-tested directly.

## Turn flow

```text
agent/turn-stopping
  → session id, working directory
  → resolveProject(cwd) (Git root, stable project key)
  → turnSlice(events, turn)
  → extractTurnSignals
      human user messages only (source.kind === "user")
      file edits from tool args
      real test commands + output classification
      explicit corrections, completion reason
      evidence score, confidence
  → knowledgeFromSignals → mask/dedupe/append
  → maybePropose (file edit or correction, threshold, cooldown, budget)
      → backtest cases from artifacts
      → baseline vs candidate replay
      → proposal (status proposed/blocked)
  → state cursor and counters, all under a file lock
```

The listener is serialized by DSH for a settled turn, but duplicate calls are
also guarded by the persisted `lastTurn` per session. A lock protects the
read-modify-write window.

## Backtest model

`buildBacktestCases(signals)` creates checks for:

- the commands that actually passed;
- the files that were actually changed;
- explicit user corrections;
- verification markers (`## Verification`, failure counts).

`evaluateBacktest(content, cases)` returns `PASS`, `FAIL`, or `NOT_TESTED` with a
score and per-case detail. It is a content replay against observed evidence. It
does **not** invoke a model or execute a command. An update's baseline is the
current file; a new skill's baseline is marked missing.

This is enough to prevent an empty/contradictory skill from being presented as
"verified". It is deliberately not presented as a semantic quality metric.

## Proposal and version lifecycle

```text
proposed ──accept──> accepted ──(new proposal)──> accepted (v2)
   │                     │
   ├──reject──> rejected  └──rollback──> earlier content restored
   └──blocked (format/security failure)
```

Accept checks, in order: optimistic revision, already-applied idempotency,
blocked/rejected state, backtest `FAIL`, validation, security severity, and
baseline hash. It saves the current content as a version, writes the candidate,
saves the new version with the proposal diff, updates the proposal, and records
an `apply` run. A concurrent edit produces `BASELINE_CONFLICT`; a stale UI click
produces `REVISION_CONFLICT` (HTTP 409).

Versions are content-addressed by timestamp/random suffix and pruned to the
newest 20 per skill. Rollback first snapshots the current content, then restores
the selected version, so the rollback itself is reversible.

## Native skill and global skill boundary

Project skills live only under `<project>/.dsh/skills`. Writes go through
`ctx.fs.writeText` when available, with the session's sandbox policy; directory
creation is confined to the project's own skill tree. This makes DSH's native
catalog the source of truth for discovery in a new dialog.

Global skills are read-only in the UI except for an explicit, confirmed publish
when `globalPublishAllowed` is true. The plugin never edits another provider's
files and never copies a project skill automatically.

## Web/API boundary

The browser supplies only a session id and a skill name or proposal id. The host
resolves the session's `cwd`, then the Git root. It never accepts an arbitrary
filesystem path. Routes:

```text
GET  /api/project-evolution/overview?sessionId=
GET  /api/project-evolution/knowledge?sessionId=&query=
GET  /api/project-evolution/skill?sessionId=&name=
GET  /api/project-evolution/versions?sessionId=&name=
POST /api/project-evolution/action
```

The action endpoint dispatches the same service methods used by model tools:
`analyze`, `accept`, `reject`, `rollback`, `set-enabled`, `archive`,
`publish-global`, `propose`, `record-note`, `propose-edit`,
`delete-knowledge`, `save-settings`, `get-skill`, `list-versions`,
`get-version`, `refresh`.

## Isolation and lifecycle

The project key is a hash of the resolved absolute project root. State,
knowledge, proposals, versions, and runs all live under that root's `.dsh`
directory and are Git-ignored. Two projects therefore cannot read each other's
data through this plugin. Config is global to the DSH profile by design.

Disabling the bundle stops capture, routes, tools, and the prompt section but
leaves all files intact. Removing the bundle also leaves project data and
native skills in place; re-enabling resumes from the same store. Disposing
routes/tools is registered through `ctx.effect`.

## Concurrency and failure behavior

- Per-project file lock serializes state read-modify-write.
- Duplicate turn events are ignored by `lastTurn`.
- Daily analysis and proposal caps are checked inside the lock.
- Torn knowledge lines are skipped; a corrupt `state.json` is quarantined as
  `state.json.corrupt-<timestamp>` before a fresh state is created.
- Missing/corrupt proposal JSON is ignored by listing, not treated as a crash.
- Route errors return JSON with `cache-control: no-store` and no stack trace.
