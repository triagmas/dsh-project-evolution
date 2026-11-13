# Acceptance evidence

Run from the repository root:

```bash
node --test test/unit.test.js test/integration.test.js test/client.test.js
node scripts/smoke.mjs
node scripts/acceptance.mjs
```

The commands create only temporary directories under the OS temp area. They do
not install into a DSH profile, call a model, or contact the network.

## Full scenario (`scripts/acceptance.mjs`)

The script creates two isolated Git projects (`project-a`, `project-b`) and an
isolated `DSH_HOME`, then simulates the real session event envelope.

Expected PASS lines:

```text
PASS project identity and Git detection
PASS verified turn captured as reviewable proposal
PASS manual acceptance writes a native project SKILL.md
PASS new session discovers and recalls the accepted project skill
PASS user correction proposes a new version, not a second skill
PASS versions and diffs preserve both the correction and its rationale
PASS rollback restores an earlier content-addressed version
PASS second project is isolated from the first project knowledge and skills
PASS evidence is Git-ignored while project skills remain usual tracked files
PASS Web API route returns the scoped overview
PASS global projects API returns config and both project roots with chat counts
```

It asserts, among other things:

- no project skill exists before acceptance;
- the proposal is `PASS` and the skill file is absent;
- acceptance writes `.dsh/skills/<name>/SKILL.md`;
- a new session's native catalog and `recall` discover that skill;
- a correction creates an `update` proposal for the same skill, not a duplicate;
- the update backtest is `PASS`, its baseline is `FAIL`, and the diff contains
  both the correction and the new command;
- versions preserve the diff metadata; rollback restores byte-identical v1;
- project B cannot see project A's knowledge or skill;
- Git ignores the evidence directory and shows the project skill as untracked;
- the overview route returns HTTP 200 and the correct project root;
- the global projects API returns both project roots, their chat counts, and
  the default-off auto-accept config without a session.

## Unit and integration coverage

`node --test test/unit.test.js test/integration.test.js test/client.test.js` covers:

- utility/YAML round trips and bounded diff;
- secret masking, injection detection, dangerous command rejection, and normal
  Markdown code fences;
- Git-root project detection and path escape rejection;
- analyzer filtering of synthetic user messages, `# fail 0`, own-turn
  corrections, generated content, and replay PASS/FAIL/NOT_TESTED;
- project store deduplication, caps, and corrupt-state quarantine;
- project grouping from live sessions and persisted `sessionQuery` headers,
  plus `SESSION_REQUIRED` on sessionless project routes;
- proposal → apply → edit → rollback → global publish, including version diffs;
- conservative config normalization;
- Web API success/error/404/409 paths, JSON errors;
- default-off auto-accept and the rule that Analyze/manual proposals never
  auto-apply;
- read-only verification is captured as knowledge but not auto-proposed;
  manual Analyze can still create a review item;
- the client loader contract, conversation/settings registration, and EN/RU key parity;
- the model tool surface has no accept/apply/rollback tool.

## What is not covered by a real browser yet

The host and client contracts are tested without a browser. Before relying on
the UI in production, install the bundle into a test profile, open the
**Evolution** conversation tab (fifth after Chat, Trajectory, Context,
Fleet), and verify its four tabs plus the global **Settings → Project
Evolution** page render in both light and dark themes and at a narrow width.
Installation into a live profile is a separate, explicit user decision.

## Interpreting `PASS`

`PASS` means the deterministic replay found the observed command/file/correction
facts in the candidate content. It does not mean a model was benchmarked or
that a future task is guaranteed to improve. `Not tested` is shown whenever a
proposal has no safe replay case.
