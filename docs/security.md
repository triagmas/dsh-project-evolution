# Security and privacy

## Trust boundaries

Captured session text, tool output, skill content, and recalled knowledge are
**untrusted data**. They are never executed by this plugin and are never treated
as instructions by the plugin. The only code that runs is the plugin's own; the
only external side effects are local files explicitly written by user actions.

## What is stored

Under `<project>/.dsh/project-evolution`:

- bounded knowledge rows with title/content (max 8,000 chars per row);
- proposal records including the candidate skill, diff, checks, and a prior
  content snapshot for baseline comparison;
- version files (max 20 per skill) and run audit records (retention-bounded);
- state counters and per-session cursors.

Per project, never global: knowledge and proposals cannot leak to another
project through the plugin. The `.gitignore` in that directory ignores local
evidence; project skills under `.dsh/skills` remain ordinary tracked files.

## Secret handling

`maskSecrets` recognizes private keys, OpenAI-style keys, GitHub tokens,
Slack tokens, AWS access keys, Google API keys, JWTs, bearer tokens, assigned
password/secret fields, and URL credentials. Captured knowledge is masked before
storage and records which rules fired. Skill validation rejects content that
still matches a secret pattern. This is a best-effort detector, not a guarantee:
a user can still manually write a secret into a skill, so review diffs.

## Prompt injection and dangerous commands

`scanInjection` flags instruction overrides, system/developer spoofing, role
override, exfiltration phrasing, silent-action requests, pipe-to-shell,
destructive root commands, encoded PowerShell, and fake tool calls. Recalled
knowledge is explicitly labeled `untrusted` and the recall response repeats
that it must not be followed as instructions. High-severity injection blocks a
proposal.

`scanDangerousCommands` flags shell chaining, sudo, recursive delete, network
pipe, Git push/reset/clean, package publish, and credential reads. A generated
skill containing a high-severity pattern is blocked. The `shell-chain` rule is
ignored only for Markdown SKILL.md content, because normal prose uses backticks
and line breaks; it still applies to captured command analysis.

## No execution, no network

- No `child_process` is used by the plugin.
- Captured commands are text, not executed.
- No model/API calls are made; `maxModelCallsPerDay` is reserved and unused.
- No external telemetry or remote service.
- Git is read through short, bounded `git` snapshots for project metadata only
  (branch, HEAD, dirty count); the plugin never commits, pushes, merges, or
  resets.

## Filesystem and approval boundaries

- Project writes are confined to `<project>/.dsh/skills` and
  `<project>/.dsh/project-evolution`; paths are asserted inside the project.
- When `ctx.fs` exists, skill writes use the harness sandbox policy. Otherwise
  the plugin uses an atomic local write.
- Global publish is off by default, requires `globalPublishAllowed`, an explicit
  confirmation, and refuses to overwrite an existing global skill unless
  overwrite is separately requested.
- Archive refuses to move a project skill not created by this plugin.
- The Web UI never supplies a filesystem path; the host derives it from the
  session working directory.
- No unsandboxed shell is exposed to generated skills. Generated content is
  inert Markdown.

## Storage bounds and cleanup

Daily analysis cap, knowledge cap, proposal cap, version count, per-row size,
skill size (60,000 chars), retention days, and request body limit are enforced.
Cleanup runs on `init`/overview and prunes expired runs and excess rows. A
corrupt state file is preserved under a `.corrupt-*` name rather than silently
discarded.

## Known remaining risks

- Secret detection can miss novel formats.
- Prompt-injection detection is heuristic; a user can paste hostile text into a
  manual skill draft, though high-severity patterns are blocked.
- Auto-accept, if enabled, trusts deterministic evidence replay. That replay
  validates artifacts, not correctness or safety of the procedure.
- A malicious local process with filesystem access can edit project data; the
  plugin is not a security boundary against the local user.
- Global publishing deliberately writes outside the project after confirmation;
  review the copied content before sharing a profile.
