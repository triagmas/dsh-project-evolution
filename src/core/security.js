/**
 * Secret masking, prompt-injection flags, and skill-content validation.
 *
 * Captured history is untrusted data. The plugin never executes commands from
 * that history; the captured text is masked before it is persisted and is
 * rendered as evidence, never as an instruction. Generated skills contain a
 * deterministic template plus allowlisted commands from actual tool results.
 */
import { truncate, unique } from './util.js'

const SECRET_PATTERNS = [
  { name: 'pem-private-key', pattern: /-----BEGIN (?:RSA |EC |OPENSSH |PGP )?PRIVATE KEY-----[\s\S]*?-----END (?:RSA |EC |OPENSSH |PGP )?PRIVATE KEY-----/g },
  { name: 'openai-key', pattern: /\bsk-(?:proj-)?[A-Za-z0-9_-]{20,}\b/g },
  { name: 'github-token', pattern: /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{20,}\b/g },
  { name: 'github-fine-grained', pattern: /\bgithub_pat_[A-Za-z0-9_]{20,}\b/g },
  { name: 'slack-token', pattern: /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/g },
  { name: 'aws-access-key', pattern: /\bAKIA[0-9A-Z]{16}\b/g },
  { name: 'google-api-key', pattern: /\bAIza[0-9A-Za-z_-]{35}\b/g },
  { name: 'jwt', pattern: /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g },
  { name: 'bearer-token', pattern: /\bBearer\s+[A-Za-z0-9._~+/-]{20,}=*/gi },
  {
    name: 'assigned-secret',
    pattern: /(^|[\s"'])((?:api[_-]?key|access[_-]?token|auth[_-]?token|client[_-]?secret|secret|password|passwd|pwd)\s*[:=]\s*)(["']?)([^\s"'`,;]{8,})\3/gi,
    replace: (_match, lead, prefix, quote) => `${lead}${prefix}${quote}[REDACTED]${quote}`,
  },
  {
    name: 'url-credentials',
    pattern: /\b([a-z][a-z0-9+.-]*:\/\/)([^/:@\s]+):([^/@\s]+)@/gi,
    replace: (_match, scheme) => `${scheme}[REDACTED]:[REDACTED]@`,
  },
]

const INJECTION_PATTERNS = [
  { name: 'ignore-instructions', severity: 'high', pattern: /\b(?:ignore|disregard|forget)\s+(?:all\s+)?(?:previous|prior|above|earlier)\s+(?:instructions?|prompts?|rules?)\b/i },
  { name: 'system-prompt-spoof', severity: 'high', pattern: /<\|?\s*(?:system|developer)\s*\|?>|^\s*(?:system|developer)\s*:/im },
  { name: 'role-override', severity: 'high', pattern: /\b(?:you are now|act as|from now on you)\b.{0,80}\b(?:system|admin|root|developer)\b/i },
  { name: 'exfiltration', severity: 'high', pattern: /\b(?:exfiltrat|send|upload|post|leak)\b.{0,60}\b(?:secret|token|credential|\.env|ssh key|private key)\b/i },
  { name: 'silent-action', severity: 'high', pattern: /\b(?:do not|don't|never)\s+(?:tell|inform|warn|ask)\s+(?:the\s+)?(?:user|human)\b/i },
  { name: 'pipe-to-shell', severity: 'high', pattern: /\b(?:curl|wget)\b[^\n|]{0,200}\|\s*(?:sudo\s+)?(?:ba|z|da|k)?sh\b/i },
  { name: 'destructive-root', severity: 'high', pattern: /\brm\s+-[a-z]*r[a-z]*f[a-z]*\s+(?:\/|\$HOME|~)(?:\s|$)/i },
  { name: 'powershell-encoded', severity: 'high', pattern: /\bpowershell(?:\.exe)?\b.{0,80}\s-(?:enc|encodedcommand)\b/i },
  { name: 'fake-tool-call', severity: 'medium', pattern: /\[\[?\s*(?:tool_call|function_call)\s*\]?\]/i },
]

const DANGEROUS_COMMAND_PATTERNS = [
  { name: 'shell-chain', severity: 'high', pattern: /(?:^|[^&])&&|[;|`]|\$\(|\n/ },
  { name: 'sudo', severity: 'high', pattern: /\bsudo\b/ },
  { name: 'recursive-delete', severity: 'high', pattern: /\brm\s+-[a-z]*r[a-z]*f|\bRemove-Item\b.*-Recurse/i },
  { name: 'network-pipe', severity: 'high', pattern: /\b(?:curl|wget)\b.*\|\s*(?:sh|bash|zsh|node|python)/i },
  { name: 'git-push', severity: 'high', pattern: /\bgit\s+(?:push|reset\s+--hard|clean\s+-[a-z]*f)/ },
  { name: 'package-publish', severity: 'high', pattern: /\b(?:npm|pnpm|yarn)\s+publish\b/ },
  { name: 'credential-read', severity: 'high', pattern: /(?:^|\s)(?:cat|type|Get-Content)\s+[^\n]*(?:\.env|id_rsa|credentials|\.npmrc|\.pypirc)\b/i },
]

const SAFE_EXECUTABLES = new Set([
  'npm', 'pnpm', 'yarn', 'npx', 'node', 'python', 'python3', 'pytest', 'uv', 'poetry',
  'cargo', 'rustc', 'go', 'make', 'cmake', 'dotnet', 'mvn', 'gradle', 'gradlew',
  'git', 'ls', 'dir', 'cat', 'type', 'head', 'tail', 'wc', 'find', 'grep', 'rg',
  'jq', 'yq', 'bash', 'sh', 'powershell', 'pwsh', 'deno', 'bun', 'php', 'ruby',
])

export function maskSecrets(value) {
  let text = String(value ?? '')
  const found = []
  for (const rule of SECRET_PATTERNS) {
    text = text.replace(rule.pattern, (...args) => {
      found.push(rule.name)
      if (typeof rule.replace === 'function') return rule.replace(...args)
      return '[REDACTED]'
    })
  }
  return { text, redactions: unique(found) }
}

export function scanInjection(value) {
  const text = String(value ?? '')
  const findings = []
  for (const rule of INJECTION_PATTERNS) {
    if (rule.pattern.test(text)) findings.push({ rule: rule.name, severity: rule.severity })
  }
  return findings
}

export function scanDangerousCommands(value) {
  const text = String(value ?? '')
  const findings = []
  for (const rule of DANGEROUS_COMMAND_PATTERNS) {
    if (rule.pattern.test(text)) findings.push({ rule: rule.name, severity: rule.severity })
  }
  return findings
}

export function commandExecutable(command) {
  const first = String(command ?? '').trim().split(/\s+/)[0] ?? ''
  return first.replace(/^.*[\\/]/, '').toLowerCase()
}

/**
 * Allowlist used for *describing* a command in a generated skill, not for
 * executing it. Commands with shell syntax, privilege escalation, publishing,
 * or destructive git operations are rejected.
 */
export function isSafeCommand(command) {
  const text = String(command ?? '').trim()
  if (!text || text.length > 300) return false
  if (!SAFE_EXECUTABLES.has(commandExecutable(text))) return false
  return scanDangerousCommands(text).every((finding) => finding.severity !== 'high')
}

export function sanitizeForStorage(value, options = {}) {
  const max = options.max ?? 12_000
  const raw = truncate(value, max)
  const masked = maskSecrets(raw)
  const injection = scanInjection(masked.text)
  return {
    text: masked.text,
    redactions: masked.redactions,
    injection,
    untrusted: injection.length > 0,
  }
}

export function validateSkillContent(content, expectedName) {
  const text = String(content ?? '')
  const errors = []
  const warnings = []
  if (!text.trim()) errors.push('Skill content is empty.')
  if (text.length > 60_000) errors.push('Skill content exceeds 60,000 characters.')
  const frontmatter = /^---\r?\n([\s\S]*?)\r?\n---\r?\n/.exec(text)
  if (!frontmatter) {
    errors.push('Missing YAML frontmatter delimited by --- lines.')
  } else {
    const block = frontmatter[1]
    const name = /^name:\s*(.+)$/m.exec(block)?.[1]?.trim().replace(/^["']|["']$/g, '')
    const description = /^description:\s*(.+)$/m.exec(block)?.[1]?.trim().replace(/^["']|["']$/g, '')
    if (!name) errors.push('Frontmatter requires a name.')
    if (!description) errors.push('Frontmatter requires a description.')
    if (name && expectedName && name !== expectedName) {
      errors.push(`Frontmatter name "${name}" does not match requested skill "${expectedName}".`)
    }
    if (name && !/^[a-z0-9][a-z0-9._-]{0,63}$/.test(name)) {
      errors.push('Skill name must be lowercase kebab/dot/underscore, at most 64 characters.')
    }
    if (description && description.length > 500) warnings.push('Description is longer than 500 characters; routing quality may suffer.')
    if (description && !/(use when|используй|when the|when you)/i.test(description)) {
      warnings.push('Description does not name a trigger ("Use when …"); future discovery may be weaker.')
    }
  }
  const masked = maskSecrets(text)
  if (masked.redactions.length > 0) errors.push(`Skill contains possible secret material (${masked.redactions.join(', ')}).`)
  const injection = scanInjection(text)
  if (injection.length > 0) errors.push(`Skill contains prompt-injection-like text (${injection.map((item) => item.rule).join(', ')}).`)
  const dangerous = scanDangerousCommands(text).filter((finding) => finding.rule !== 'shell-chain')
  for (const finding of dangerous) {
    if (finding.severity === 'high') errors.push(`Skill contains a disallowed command pattern (${finding.rule}).`)
  }
  const body = frontmatter ? text.slice(frontmatter[0].length) : text
  if (body.trim().length < 120) warnings.push('Skill body is very short; add procedure, pitfalls, and verification steps.')
  if (!/^#\s+/m.test(body)) warnings.push('Skill body has no Markdown title.')
  if (!/(?:^|\n)##\s+(?:verification|проверка|success criteria)/i.test(body)) {
    warnings.push('Skill body has no Verification or Success criteria section.')
  }
  return { ok: errors.length === 0, errors, warnings, injection, redactions: masked.redactions, dangerous }
}

export function securitySummary(content) {
  const masked = maskSecrets(content)
  const injection = scanInjection(content)
  const dangerous = scanDangerousCommands(content).filter((finding) => finding.rule !== 'shell-chain')
  const severity = injection.some((item) => item.severity === 'high') || dangerous.some((item) => item.severity === 'high')
    ? 'high'
    : injection.length || dangerous.length || masked.redactions.length
      ? 'medium'
      : 'none'
  return {
    severity,
    redactions: masked.redactions,
    injection,
    dangerous,
    preview: masked.text.slice(0, 280),
  }
}
