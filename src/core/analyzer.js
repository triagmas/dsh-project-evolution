/**
 * Deterministic experience extraction from a completed agent turn.
 *
 * The analyzer reads only committed session events. It never asks a model and
 * never treats captured prose as an instruction. A turn is eligible only when
 * it shows concrete evidence (file mutations, a passing test command, or an
 * explicit user correction) and reaches a minimum evidence score.
 */
import {
  asArray, normalizeCommand, nowIso, sha256, shortHash,
  slugify, truncate, unique, yamlString,
} from './util.js'
import { isSafeCommand, maskSecrets, scanInjection } from './security.js'

const TEST_COMMAND = /(?:^|\s)(?:npm|pnpm|yarn|bun|npx)\s+(?:run\s+)?(?:test|vitest|jest|mocha|playwright|cypress)\b|\b(?:pytest|py\.test|python3?\s+-m\s+(?:pytest|unittest)|cargo\s+test|go\s+test|dotnet\s+test|mvn\s+(?:test|verify)|gradle\w*\s+test|make\s+(?:test|check)|(?:bash|sh)\s+[^\n]*test[^\n]*\.sh|node\s+--test)\b/i
const FAILURE_MARKER = /\b(?:FAIL(?:ED|URE)?|ERROR|AssertionError|Traceback|panic:|exit code [1-9]|tests? failed|✗|×)\b/i
const EDIT_TOOLS = new Set(['edit', 'write', 'apply_patch', 'patch', 'create_file', 'str_replace_editor', 'multi_edit', 'write_file', 'edit_file'])
const SHELL_TOOLS = new Set(['bash', 'shell', 'exec', 'exec_command', 'run_terminal_cmd', 'terminal', 'pwsh', 'powershell', 'run_command'])
const CORRECTION = /(?:^|\b)(?:no[,.!]|actually|instead|that'?s wrong|not what i|incorrect|should be|don'?t do|do not do|use .+ instead|wrong approach|fix (?:this|that)|не так|нет[,.]|неправильно|исправь|надо было|лучше сделай|не делай)\b/i

export function messageText(message) {
  if (!message) return ''
  if (typeof message === 'string') return message
  const content = message.content
  if (typeof content === 'string') return content
  if (!Array.isArray(content)) return ''
  const parts = []
  for (const part of content) {
    if (typeof part === 'string') parts.push(part)
    else if (part?.type === 'text' && typeof part.text === 'string') parts.push(part.text)
    else if (part?.type === 'tool-result' && typeof part.text === 'string') parts.push(part.text)
  }
  return parts.join('\n')
}

function parseArguments(raw) {
  if (raw && typeof raw === 'object') return raw
  try {
    return JSON.parse(String(raw ?? '{}'))
  } catch {
    return {}
  }
}

function commandOf(args) {
  return normalizeCommand(args.command ?? args.cmd ?? args.script ?? args.input ?? '')
}

function stripZeroFailureLines(output) {
  return output.split('\n').map((line) => {
    const withoutIndent = line.trimStart()
    const body = withoutIndent.startsWith('#') ? withoutIndent.slice(1).trimStart() : withoutIndent
    const marker = /^fail(?:ed|ure)?s?\b/i.exec(body)
    if (!marker) return line
    const rest = body.slice(marker[0].length).trimStart()
    const value = rest.startsWith(':') || rest.startsWith('=') ? rest.slice(1).trimStart() : rest
    return /^0(?:\b|$)/.test(value) ? '' : line
  }).join('\n')
}

function classifyTest(command, output, isError) {
  const text = `${command}\n${output}`
  if (!TEST_COMMAND.test(command)) return undefined
  // `node --test` prints "# fail 0"; that is success, not a failure marker.
  const normalizedOutput = stripZeroFailureLines(output)
  const hasFailure = Boolean(isError) || FAILURE_MARKER.test(normalizedOutput)
  const hasSuccess = !hasFailure && !isError
  return {
    command,
    passed: Boolean(hasSuccess && !hasFailure),
    failed: Boolean(hasFailure),
    exitError: Boolean(isError),
    output: truncate(output, 1_500),
    marker: hasFailure ? 'failure' : hasSuccess ? 'success' : 'unknown',
  }
}

function clipAtWord(text, max) {
  if (text.length <= max) return text
  const cut = text.slice(0, max)
  const boundary = cut.lastIndexOf(' ')
  return (boundary > 0 ? cut.slice(0, boundary) : cut).replace(/[\s,;:.-]+$/, '')
}

function deriveTitle(userText, files) {
  const first = String(userText ?? '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/[#>*_`]/g, ' ')
    .split(/\n|\.\s/)[0]
    .replace(/\s+/g, ' ')
    .trim()
  if (first.length >= 12) return clipAtWord(first, 90)
  if (files.length) return `Change ${files.slice(0, 3).join(', ')}`
  return 'Project task'
}

function changeKind({ testPasses, testFailures, corrections, fileEdits }) {
  if (corrections.length > 0 && (fileEdits.length > 0 || testPasses.length > 0)) return 'correction'
  if (testFailures.length > 0 && testPasses.length > 0) return 'solution'
  if (testPasses.length > 0 && fileEdits.length > 0) return 'procedure'
  if (fileEdits.length > 0) return 'change'
  if (testPasses.length > 0) return 'verification'
  return 'note'
}

function scoreEvidence(signals) {
  let score = 0
  if (signals.userText.trim().length >= 12) score += 5
  if (signals.fileEdits.length > 0) score += 6
  if (signals.fileEdits.length >= 3) score += 3
  if (signals.testPasses.length > 0) score += 12
  if (signals.testFailures.length > 0) score += 2
  if (signals.corrections.length > 0) score += 7
  if (signals.skillsUsed.length > 0) score += 2
  if (signals.turnCompleted) score += 2
  if (signals.assistantMessages > 1) score += 1
  return Math.min(score, 100)
}

/**
 * Extract turn signals from committed events.
 * @param {object} input
 * @param {string} input.sessionId
 * @param {number} input.turn
 * @param {Array<object>} input.events
 * @param {object} [input.config]
 * @param {string} [input.projectRoot]
 * @param {boolean} [input.assumeCompleted] treat a settled turn as completed
 *   when the caller is the turn-stopping boundary and no turn/end event is
 *   committed yet.
 */
export function extractTurnSignals({ sessionId, turn, events, config = {}, projectRoot = '', assumeCompleted = false }) {
  const rows = asArray(events)
  const calls = new Map()
  const results = new Map()
  const users = []
  const assistants = []
  const skillsUsed = []
  let turnCompleted = false
  let turnClosed = false
  let turnReason = undefined
  const startedAt = rows[0]?.time

  for (const event of rows) {
    if (!event || typeof event !== 'object') continue
    const data = event.data ?? {}
    if (event.type === 'user/message') {
      // Synthetic context (file notices, skill bodies, relayed prompts) also
      // arrives as a user-role message. Only a human source counts as direct
      // user intent or as a correction.
      if (data?.source?.kind && data.source.kind !== 'user') continue
      const text = messageText(data).trim()
      if (text) users.push({ seq: event.seq, text })
    } else if (event.type === 'assistant/message') {
      const text = messageText(data.message ?? data).trim()
      if (text) assistants.push({ seq: event.seq, text })
    } else if (event.type === 'tool/call') {
      calls.set(data.callId, {
        seq: event.seq,
        callId: data.callId,
        name: String(data.name ?? ''),
        arguments: data.arguments,
        args: parseArguments(data.arguments),
      })
      if (['skill', 'load_skill', 'skill_invoke'].includes(String(data.name ?? ''))) {
        const args = parseArguments(data.arguments)
        if (args.name) skillsUsed.push(String(args.name))
      }
    } else if (event.type === 'tool/result') {
      const call = calls.get(data.message?.toolCallId) ?? calls.get(data.toolCallId)
      if (call) results.set(call.callId, { seq: event.seq, data })
    } else if (event.type === 'turn/end') {
      turnClosed = true
      turnReason = typeof data.reason === 'string' ? data.reason : data.reason?.kind
      turnCompleted = turnReason === 'completed'
    }
  }
  // `agent/turn-stopping` is awaited before the boundary commits, so the
  // current turn's `turn/end` event may not exist yet. The boundary itself is
  // completion evidence; an aborted signal is not.
  if (!turnClosed && assumeCompleted) {
    turnCompleted = true
    turnReason = 'stopping'
  }

  const fileEdits = []
  const testPasses = []
  const testFailures = []
  const commands = []
  for (const call of calls.values()) {
    const result = results.get(call.callId)
    const output = result ? messageText(result.data.message) : ''
    const isError = Boolean(result?.data?.message?.isError || result?.data?.error)
    if (EDIT_TOOLS.has(call.name)) {
      const path = String(call.args.path ?? call.args.file_path ?? call.args.filePath ?? call.args.file ?? '').trim()
      fileEdits.push({
        seq: call.seq,
        tool: call.name,
        path: path || '(unknown path)',
        added: Number(call.args.content ? String(call.args.content).split('\n').length : call.args.old_string ? String(call.args.new_string ?? '').split('\n').length : 0),
      })
      continue
    }
    const command = commandOf(call.args)
    if (command) commands.push({ seq: call.seq, tool: call.name, command, safe: isSafeCommand(command) })
    if (!SHELL_TOOLS.has(call.name) && !TEST_COMMAND.test(command)) continue
    const test = classifyTest(command, output, isError)
    if (!test) continue
    if (test.passed) testPasses.push(test)
    if (test.failed) testFailures.push(test)
  }

  // Usually the task is the first user message and a correction is a later
  // message in the same turn. A correction can also start its own later turn;
  // in that case it is the only user message in the slice.
  const correctionUsers = users.slice(1)
  if (correctionUsers.length === 0 && users.length === 1 && Number(turn) > 1 && CORRECTION.test(users[0].text)) {
    correctionUsers.push(users[0])
  }
  const corrections = config.captureUserCorrections === false
    ? []
    : correctionUsers.filter((entry) => CORRECTION.test(entry.text)).map((entry) => ({
        seq: entry.seq,
        text: truncate(entry.text, 1_200),
      }))

  const userText = users[0]?.text ?? ''
  const title = deriveTitle(userText, fileEdits.map((edit) => edit.path))
  const signals = {
    sessionId,
    turn,
    startedAt,
    userText: truncate(userText, 4_000),
    userMessages: users.length,
    assistantMessages: assistants.length,
    fileEdits: unique(fileEdits.map((edit) => edit.path)).filter((path) => path !== '(unknown path)').slice(0, 30),
    fileEditCount: fileEdits.length,
    testPasses,
    testFailures,
    corrections,
    skillsUsed: unique(skillsUsed),
    commands: commands.filter((item) => item.command).slice(0, 40),
    turnCompleted,
    turnReason,
    title,
  }
  signals.evidenceScore = scoreEvidence(signals)
  signals.kind = changeKind(signals)
  signals.confidence = signals.testPasses.length > 0 && turnCompleted ? 'confirmed' : 'observed'
  signals.substantive = signals.evidenceScore >= (config.minEvidenceScore ?? 5) &&
    (signals.fileEdits.length > 0 || signals.testPasses.length > 0 || signals.corrections.length > 0 || signals.userText.length > 120)
  signals.projectRoot = projectRoot
  signals.fingerprint = `turn:${shortHash(`${signals.kind}|${signals.title}|${signals.testPasses.map((test) => test.command).join(';')}|${signals.fileEdits.join(',')}`, 24)}`
  return signals
}

/**
 * Turn a signal snapshot into bounded knowledge rows. Each row is evidence,
 * not a skill: the proposal layer decides whether it is reusable.
 */
export function knowledgeFromSignals(signals) {
  const rows = []
  const source = {
    sessionId: signals.sessionId,
    turn: signals.turn,
    eventSeqs: [
      ...signals.testPasses.map((item) => item.seq),
      ...signals.testFailures.map((item) => item.seq),
      ...signals.corrections.map((item) => item.seq),
    ].filter(Boolean).slice(0, 50),
  }
  const baseTags = unique([
    signals.kind,
    signals.confidence,
    ...signals.fileEdits.slice(0, 5).map((path) => path.split('/').slice(-2).join('/')),
  ])
  if (!signals.substantive) return rows

  const procedureParts = []
  if (signals.userText) procedureParts.push(`Task: ${truncate(signals.userText, 800)}`)
  if (signals.fileEdits.length) procedureParts.push(`Changed files: ${signals.fileEdits.join(', ')}`)
  if (signals.testPasses.length) procedureParts.push(`Passing verification: ${signals.testPasses.map((item) => item.command).join('; ')}`)
  if (signals.testFailures.length) procedureParts.push(`Earlier failing command: ${signals.testFailures.map((item) => item.command).join('; ')}`)
  if (signals.corrections.length) procedureParts.push(`User correction: ${signals.corrections.map((item) => item.text).join(' | ')}`)
  const content = procedureParts.join('\n\n')
  if (content.trim()) {
    rows.push({
      kind: signals.kind,
      title: signals.title,
      content: truncate(content, 4_000),
      tags: baseTags,
      confidence: signals.confidence,
      source,
      evidenceScore: signals.evidenceScore,
      fingerprint: `knowledge:${signals.fingerprint}`,
    })
  }
  for (const test of signals.testPasses.slice(0, 3)) {
    rows.push({
      kind: 'test',
      title: `Verified command: ${truncate(test.command, 120)}`,
      content: `Command passed after the change.\n\n$ ${test.command}\n\n${truncate(test.output, 800)}`,
      tags: unique(['test', 'pass', ...baseTags]).slice(0, 8),
      confidence: 'confirmed',
      source: { ...source, command: test.command },
      evidenceScore: Math.min(100, signals.evidenceScore + 5),
      fingerprint: `test:${sha256(`${test.command}|${test.output}`).slice(0, 24)}`,
    })
  }
  for (const correction of signals.corrections.slice(0, 2)) {
    rows.push({
      kind: 'correction',
      title: `User correction: ${truncate(correction.text.split('\n')[0], 90)}`,
      content: truncate(correction.text, 1_500),
      tags: unique(['correction', ...baseTags]).slice(0, 8),
      confidence: 'confirmed',
      source: { ...source, eventSeqs: [correction.seq] },
      evidenceScore: Math.min(100, signals.evidenceScore + 3),
      fingerprint: `correction:${sha256(`${signals.title}|${correction.text}`).slice(0, 24)}`,
    })
  }
  return rows.map((row) => {
    const masked = maskSecrets(row.content)
    const title = maskSecrets(row.title)
    const source = { ...row.source }
    if (source.command) source.command = maskSecrets(source.command).text
    const injection = [
      ...scanInjection(masked.text),
      ...scanInjection(title.text),
    ]
    return {
      ...row,
      title: title.text,
      content: masked.text,
      source,
      redactions: unique([...masked.redactions, ...title.redactions]),
      injection,
      untrusted: injection.length > 0,
    }
  })
}

export function proposedSkillName(title, existingNames = []) {
  // Keep generated names readable: drop dangling conjunctions left by a
  // character cut, and cut on a word boundary instead of mid-word.
  const stopwords = new Set(['a', 'an', 'and', 'or', 'then', 'to', 'for', 'of', 'in', 'on', 'at', 'by', 'with', 'from'])
  const words = slugify(title).split('-').filter(Boolean)
  while (words.length > 2 && stopwords.has(words[words.length - 1])) words.pop()
  let base = words.join('-')
  if (base.length > 50) {
    const cut = base.slice(0, 50)
    const boundary = cut.lastIndexOf('-')
    base = boundary > 0 ? cut.slice(0, boundary) : cut
    while (base.endsWith('-')) base = base.slice(0, -1)
  }
  while (base.includes('-') && stopwords.has(base.slice(base.lastIndexOf('-') + 1))) {
    base = base.slice(0, base.lastIndexOf('-'))
  }
  while (base.endsWith('-')) base = base.slice(0, -1)
  base = base || 'project-workflow'
  let name = base
  if (!/^(?:use|run|apply|verify|build|test|debug|fix|add|update|create|migrate|deploy|review)-/.test(name)) {
    name = `use-${name}`
  }
  name = name.slice(0, 64)
  while (name.endsWith('-')) name = name.slice(0, -1)
  let index = 2
  const taken = new Set(existingNames)
  while (taken.has(name)) {
    const suffix = `-${index++}`
    name = `${name.slice(0, 64 - suffix.length)}${suffix}`
  }
  return name
}

function sanitizeDescription(value, fallback) {
  return String(value ?? fallback)
    .replace(/\s+/g, ' ')
    .replace(/[<>]/g, '')
    .trim()
    .slice(0, 400)
}

export function skillContentFromExperience(signals, options = {}) {
  const name = options.name || proposedSkillName(signals.title)
  const trigger = sanitizeDescription(options.trigger || signals.title, 'a related project task').replace(/[.!?]+$/, '')
  const description = sanitizeDescription(
    options.description || `Use when ${trigger.toLowerCase().replace(/^\W+/, '')}. Reuses a verified project procedure with concrete test evidence.`,
    `Use when working on ${trigger}.`,
  )
  const testCommands = unique(signals.testPasses.map((item) => item.command).filter((command) => isSafeCommand(command)))
  const failingCommands = unique(signals.testFailures.map((item) => item.command).filter((command) => isSafeCommand(command)))
  const files = signals.fileEdits.slice(0, 12)
  const corrections = signals.corrections.slice(0, 6)
  const changed = files.length ? files.map((path) => `- \`${path}\``).join('\n') : '- No file paths were captured; identify the relevant files first.'
  const verify = testCommands.length
    ? testCommands.map((command) => `- \`${command}\``).join('\n')
    : '- No safe test command was captured. Add a real verification command before claiming success.'
  const failureNote = failingCommands.length
    ? `\n## Failure to reproduce first\n\nA failing check was observed before the fix:\n\n${failingCommands.map((command) => `- \`${command}\``).join('\n')}\n`
    : ''
  const correctionNote = corrections.length
    ? `\n## User corrections\n\nThese are recorded corrections from the originating task. Follow them; do not repeat the corrected behavior.\n\n${corrections.map((item) => `- ${item.text.replace(/\n/g, ' ')}`).join('\n')}\n`
    : ''
  const evidenceDate = signals.startedAt ? new Date(signals.startedAt).toISOString() : nowIso()
  const body = `# ${trigger.replace(/\.$/, '')}

## When to use

Use this skill when the task resembles: **${trigger}**. It is specific to this project and its verified commands, not a general-purpose workflow.

## Procedure

1. Inspect the current state before editing. Confirm the working directory and project root, then read the files named below and any nearby tests.
2. Reproduce the relevant check when a failing command is listed. Do not skip a failing baseline.
3. Apply the smallest change that addresses the task. Keep unrelated refactors out of the change.
4. Run the verification commands exactly as listed. Add focused tests when the existing suite does not cover the changed behavior.
5. Report the commands you actually ran, their output, and anything still not tested. Never mark a check as passed without output.

## Files touched in the verified task

${changed}
${failureNote}
## Verification

Run these checks after the change:

${verify}

A change is complete only when the command exits successfully and the output shows the relevant tests passing. If a command is unavailable in this environment, say so explicitly and mark the check as not tested.

## Pitfalls

- Do not copy secrets, tokens, or environment values into this skill; store references instead.
- Do not run destructive commands (recursive deletes, history resets, pushes, package publishing) as part of this procedure.
- Do not assume a global package or service is installed; check first.
- A passing command is evidence for the exact revision that ran it. Re-run it after further edits.
${correctionNote}
## Evidence

- Extracted: ${evidenceDate}
- Confidence: ${signals.confidence}
- Evidence score: ${signals.evidenceScore}/100
- Session: ${signals.sessionId}, turn ${signals.turn}
- Source events: ${signals.kind} / ${signals.fingerprint}
`
  const frontmatter = [
    '---',
    `name: ${yamlString(name)}`,
    `description: ${yamlString(description)}`,
    `whenToUse: ${yamlString(trigger)}`,
    'created_by: project-evolution',
    `confidence: ${signals.confidence}`,
    `evidence_score: ${signals.evidenceScore}`,
    `source_session: ${yamlString(signals.sessionId)}`,
    `source_turn: ${signals.turn}`,
    `source_fingerprint: ${yamlString(signals.fingerprint)}`,
    `updated: ${yamlString(nowIso().slice(0, 10))}`,
    '---',
    '',
  ].join('\n')
  return { name, description, content: `${frontmatter}${body}` }
}

/**
 * Evidence-replay backtest.
 *
 * Cases are derived from the originating turn: the new skill must mention the
 * verified command, the changed file, and the user correction. The old candidate
 * is evaluated on exactly the same cases. This is a deterministic artifact
 * check, not a model-quality benchmark; both facts stay visible in the result.
 */
export function buildBacktestCases(signals) {
  const cases = []
  for (const test of signals.testPasses.slice(0, 4)) {
    if (!isSafeCommand(test.command)) continue
    cases.push({
      id: `command:${shortHash(test.command, 10)}`,
      kind: 'verified-command',
      description: `Skill must include the verified command: ${test.command}`,
      expect: test.command,
      weight: 3,
    })
  }
  for (const path of signals.fileEdits.slice(0, 6)) {
    cases.push({
      id: `file:${shortHash(path, 10)}`,
      kind: 'changed-file',
      description: `Skill must mention the changed file: ${path}`,
      expect: path,
      weight: 1,
    })
  }
  for (const correction of signals.corrections.slice(0, 4)) {
    const phrase = correction.text.replace(/\s+/g, ' ').trim().split(' ').slice(0, 8).join(' ')
    if (phrase.length < 8) continue
    cases.push({
      id: `correction:${shortHash(phrase, 10)}`,
      kind: 'user-correction',
      description: `Skill must carry the user correction: ${truncate(phrase, 80)}`,
      expect: phrase,
      weight: 3,
    })
  }
  return cases
}

export function evaluateBacktest(content, cases) {
  const text = String(content ?? '')
  const results = cases.map((testCase) => {
    const passed = text.includes(testCase.expect)
    return {
      id: testCase.id,
      kind: testCase.kind,
      description: testCase.description,
      weight: testCase.weight,
      passed,
    }
  })
  const total = results.reduce((sum, item) => sum + item.weight, 0)
  const earned = results.reduce((sum, item) => sum + (item.passed ? item.weight : 0), 0)
  return {
    status: cases.length === 0 ? 'NOT_TESTED' : earned === total ? 'PASS' : 'FAIL',
    score: total === 0 ? 0 : Math.round((earned / total) * 100),
    passed: results.filter((item) => item.passed).length,
    total: results.length,
    cases: results,
    note: cases.length === 0
      ? 'No safe, reproducible cases were extracted. This proposal is not tested and cannot be auto-accepted.'
      : 'Deterministic evidence replay against the originating turn. It checks that the artifact preserves verified commands, files, and corrections; it does not measure model behavior.',
  }
}
