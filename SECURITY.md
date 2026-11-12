# Security policy

## Reporting a vulnerability

Please use GitHub's **private vulnerability reporting** on this repository
(Security → Report a vulnerability). Do not open a public issue for a suspected
vulnerability, and do not include live credentials in a report.

The maintainer will acknowledge a report as soon as possible and coordinate a
fix and disclosure. There is no bug bounty.

## Scope

In scope:

- the host code in `index.js` and `src/`;
- the browser code in `client.js`;
- the package contents published from this repository;
- path handling, secret masking, prompt-injection filtering, and the exact
  Fetch routes under `/api/project-evolution`.

Out of scope:

- vulnerabilities in DeepSeek Harness itself;
- a local user or process that already has write access to the project;
- the correctness or safety of a procedure that a user explicitly accepts;
- GitHub, npm, or registry infrastructure.

## Security properties

- No runtime dependencies and no install-time lifecycle scripts.
- No telemetry, external service, or model/API call.
- Captured commands are stored as text and are never executed.
- Git is read with bounded `execFile` calls and `GIT_TERMINAL_PROMPT=0`;
  the plugin never commits, pushes, merges, resets, or publishes.
- Captured text is untrusted input. Secrets are masked before storage, and
  high-severity prompt-injection or dangerous-command findings block a skill
  proposal.
- Project writes are confined to `<project>/.dsh`; skill and version IDs are
  validated before use. Global publication is off by default and requires an
  explicit confirmation.
- HTTP routes are served by the harness and inherit its authentication. The
  browser talks only to the same-origin `/api/project-evolution` namespace.

## Release checks

Each public release is built from a clean checkout and checked with:

```sh
node --check index.js && node --check client.js
npm test                 # unit, integration, client
npm run acceptance       # two-project acceptance scenario
npm run smoke            # isolated capture/route/apply smoke
npm audit --omit=dev     # zero runtime dependencies
npm pack --dry-run       # package contents
```

The release tarball is attached to the GitHub release with a SHA-256 checksum.
Secret scanning and push protection are enabled on the public repository.

These checks are a baseline, not a guarantee. The plugin is not a security
boundary against a malicious local user, and heuristic detection can miss a
novel secret or injection format.
