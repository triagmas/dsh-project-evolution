import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { EvolutionService } from '../src/core/service.js'
import { createRoutes } from '../src/core/routes.js'
import { writeGlobalConfig } from '../src/core/store.js'
import { createTools } from '../src/core/tools.js'
import { extractTurnSignals } from '../src/core/analyzer.js'
import { fakeCtx, fakeSession, gitProject, tempDir, turnEvents, writeProjectFile } from './helpers.js'

async function setup({ config = {}, homeConfig = {} } = {}) {
  const root = await gitProject()
  await writeProjectFile(root, 'src/math.js', 'export const add = (a,b) => a+b\n')
  const home = await tempDir('dsh-pe-home-')
  if (Object.keys(homeConfig).length) await writeGlobalConfig(home, homeConfig)
  const session = fakeSession({ id: 's1', cwd: root, events: turnEvents({ user: 'Add subtraction to src/math.js and run the test command.', file: 'src/math.js' }) })
  const ctx = fakeCtx([session])
  const logger = { warnings: [], info() {}, warn(...args) { this.warnings.push(args.join(' ')) }, error(...args) { this.warnings.push(args.join(' ')) } }
  const service = new EvolutionService({ ctx, config, logger, dshHome: home })
  return { root, home, session, ctx, service, logger }
}

function readOnlyTurnEvents() {
  const events = turnEvents({
    user: 'You are auditing an existing repository READ-ONLY. Do not modify any file.',
    command: 'npm test',
    output: '# tests 1\n# pass 1\n# fail 0',
  })
  return events.filter((event) => {
    const data = event.data ?? {}
    const callId = data.callId ?? data.message?.toolCallId
    return data.name !== 'edit' && callId !== 'c1a'
  })
}

function route(service, suffix) {
  return createRoutes(service, { info() {}, warn() {} }).find((item) => item.path.endsWith(suffix))
}

async function call(service, suffix, { method = 'GET', sessionId = 's1', body, query = '' } = {}) {
  const request = new Request(`http://127.0.0.1/api/project-evolution${suffix}?sessionId=${sessionId}${query}`, {
    method,
    headers: body === undefined ? undefined : { 'content-type': 'application/json' },
    body: body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body),
  })
  return route(service, suffix).fetch(request)
}

test('routes return scoped overview and knowledge', async () => {
  const { service, root } = await setup()
  const response = await call(service, '/overview')
  assert.equal(response.status, 200)
  const payload = await response.json()
  assert.equal(payload.ok, true)
  assert.equal(payload.project.root, root)
  assert.equal(payload.session.id, 's1')
  assert.equal(payload.config.autoAccept, false)

  const knowledge = await call(service, '/knowledge', { query: '&query=math' })
  assert.equal(knowledge.status, 200)
  assert.deepEqual((await knowledge.json()).knowledge, [])
})

test('action route records knowledge, proposes a draft, and maps revision conflicts to 409', async () => {
  const { service, root } = await setup()
  const note = await call(service, '/action', {
    method: 'POST',
    body: { action: 'record-note', title: 'Pitfall', content: 'Do not duplicate the test command.', kind: 'pitfall' },
  })
  assert.equal(note.status, 200)
  const noteBody = await note.json()
  assert.equal(noteBody.ok, true)
  assert.equal(noteBody.result.entry.confidence, 'observed')
  const knowledge = await (await call(service, '/knowledge', { query: '&query=duplicate' })).json()
  assert.equal(knowledge.knowledge.length, 1)

  const draft = await call(service, '/action', {
    method: 'POST',
    body: {
      action: 'propose',
      name: 'use-manual-draft',
      content: '---\nname: use-manual-draft\ndescription: Use when a manual draft is reviewed.\n---\n# Manual draft\n\n## Verification\n\nRun `npm test`.\n',
    },
  })
  assert.equal(draft.status, 200)
  const draftBody = await draft.json()
  assert.equal(draftBody.result.proposal.skill, 'use-manual-draft')
  assert.equal(draftBody.result.proposal.tests.status, 'NOT_TESTED')

  const conflict = await call(service, '/action', {
    method: 'POST',
    body: { action: 'accept', proposalId: draftBody.result.proposal.id, expectedRevision: 999 },
  })
  assert.equal(conflict.status, 409)
  assert.equal((await conflict.json()).error.code, 'REVISION_CONFLICT')
  await assert.rejects(() => readFile(join(root, '.dsh', 'skills', 'use-manual-draft', 'SKILL.md')), /ENOENT/)
})

test('oversized action bodies are rejected with 413 before parsing', async () => {
  const { service } = await setup()
  const oversized = await call(service, '/action', {
    method: 'POST',
    body: { action: 'record-note', title: 'Large', content: 'x'.repeat(1_000_001) },
  })
  assert.equal(oversized.status, 413)
  assert.equal((await oversized.json()).error.code, 'BODY_TOO_LARGE')
})

test('oversized streamed action bodies are rejected without a content-length header', async () => {
  const { service } = await setup()
  const body = new ReadableStream({
    start(controller) {
      controller.enqueue(new Uint8Array(1_000_001))
      controller.close()
    },
  })
  const request = new Request('http://127.0.0.1/api/project-evolution/action?sessionId=s1', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body,
    duplex: 'half',
  })
  const response = await route(service, '/action').fetch(request)
  assert.equal(response.status, 413)
  assert.equal((await response.json()).error.code, 'BODY_TOO_LARGE')
})

test('bad JSON and unknown skill are explicit errors, not crashes', async () => {
  const { service } = await setup()
  const bad = await call(service, '/action', { method: 'POST', body: '{not json' })
  assert.equal(bad.status, 400)
  assert.equal((await bad.json()).error.code, 'BAD_JSON')
  const missing = await call(service, '/skill', { query: '&name=no-such-skill' })
  assert.equal(missing.status, 404)
})

test('auto-accept is OFF by default and only the automatic verified path may use it', async () => {
  const first = await setup()
  await first.service.captureTurn({ agent: { session: first.session }, turn: 1, events: first.session.snapshotEvents() })
  const firstOverview = await first.service.overview('s1')
  assert.equal(firstOverview.proposals[0].status, 'proposed')
  await assert.rejects(() => readFile(join(first.root, '.dsh', 'skills', firstOverview.proposals[0].skill, 'SKILL.md')), /ENOENT/)

  const second = await setup({ homeConfig: { autoAccept: true } })
  await second.service.captureTurn({ agent: { session: second.session }, turn: 1, events: second.session.snapshotEvents() })
  const secondOverview = await second.service.overview('s1')
  assert.equal(secondOverview.proposals[0].status, 'accepted')
  const file = join(second.root, '.dsh', 'skills', secondOverview.proposals[0].skill, 'SKILL.md')
  assert.match(await readFile(file, 'utf8'), /## Verification/)

  const manual = await call(second.service, '/action', {
    method: 'POST',
    body: {
      action: 'propose',
      name: 'use-manual-no-auto',
      content: '---\nname: use-manual-no-auto\ndescription: Use when a manual draft must be reviewed.\n---\n# Manual draft\n\n## Verification\n\nRun `npm test`.\n',
    },
  })
  const manualBody = await manual.json()
  assert.equal(manualBody.result.proposal.status, 'proposed')
  await assert.rejects(() => readFile(join(second.root, '.dsh', 'skills', 'use-manual-no-auto', 'SKILL.md')), /ENOENT/)
})

test('read-only verification is knowledge, not an automatic skill proposal', async () => {
  const root = await gitProject()
  const home = await tempDir('dsh-pe-home-')
  const events = readOnlyTurnEvents()
  const session = fakeSession({ id: 's1', cwd: root, events })
  const service = new EvolutionService({ ctx: fakeCtx([session]), dshHome: home, config: {} })

  await service.captureTurn({ agent: { session }, turn: 1, events })
  const overview = await service.overview('s1')
  assert.equal(overview.proposals.length, 0)
  assert.ok((await service.knowledge('s1')).length > 0)

  const manual = await service.action('s1', { action: 'analyze' })
  assert.equal(manual.proposal.proposal.status, 'proposed')
  assert.equal(manual.proposal.proposal.skill, 'audit-existing-repository-read-only')
})

test('model tools expose status/recall/record/propose but no apply', async () => {
  const { service, session } = await setup()
  const tools = createTools(service)
  assert.deepEqual(tools.map((tool) => tool.name).sort(), [
    'project_evolution_propose', 'project_evolution_recall', 'project_evolution_record', 'project_evolution_status',
  ])
  const status = await tools.find((tool) => tool.name === 'project_evolution_status').execute({}, { agent: { session } })
  const parsed = JSON.parse(status)
  assert.equal(parsed.project.root, session.header.cwd)
  assert.equal(parsed.skills.length, 0)
  assert.doesNotMatch(status, /undefined/)
  assert.equal(tools.some((tool) => /accept|apply|rollback/.test(tool.name)), false)
})

test('manual analyze never auto-applies even when auto-accept is enabled', async () => {
  const { service, session, root } = await setup({ homeConfig: { autoAccept: true } })
  const result = await service.action('s1', { action: 'analyze' })
  assert.equal(result.proposal.proposal.status, 'proposed')
  await assert.rejects(() => readFile(join(root, '.dsh', 'skills', result.proposal.proposal.skill, 'SKILL.md')), /ENOENT/)
})

test('host entry registers routes, tools, prompt section, observer, and cleanup', async () => {
  const { apply, name, inject } = await import('../index.js')
  const { session } = await setup()
  assert.equal(name, 'dsh-project-evolution')
  assert.deepEqual(inject, ['skills', 'sessions'])
  const registered = { routes: [], tools: [], prompts: [], listeners: [], effects: [] }
  const ctx = {
    skills: { list: async () => [], get: async () => undefined },
    sessions: { get: () => session, list: () => [session] },
    logger: { info() {}, warn() {}, error() {} },
    effect(callback) { registered.effects.push(callback()); return () => {} },
    connection: { fetch: { register(route) { registered.routes.push(route); return () => {} } } },
    tools: { register(tool) { registered.tools.push(tool); return () => {} } },
    systemPrompt: { section(section) { registered.prompts.push(section); return () => {} } },
    on(event, listener) { registered.listeners.push({ event, listener }); return () => {} },
  }
  await apply(ctx, { projectRoot: session.header.cwd })
  assert.deepEqual(registered.routes.map((item) => item.path), [
    '/api/project-evolution/overview', '/api/project-evolution/knowledge', '/api/project-evolution/skill',
    '/api/project-evolution/versions', '/api/project-evolution/action',
  ])
  assert.equal(registered.tools.length, 4)
  assert.equal(registered.prompts[0].name, 'project-evolution:discipline')
  assert.equal(registered.listeners[0].event, 'agent/turn-stopping')
  assert.equal(registered.effects.length, 1)
  assert.equal(typeof registered.effects[0], 'function')
  registered.effects[0]()
})

test('secret material is redacted before it reaches proposals or knowledge', async () => {
  const { service } = await setup()
  const { store } = await service.storeFor('s1')
  const secret = `ghp_${'a'.repeat(36)}`
  const content = `---
name: use-secret-check
description: Use when checking secret storage behavior.
---
# Secret check

Token: ${secret}

## Verification

Run \`npm test\` and inspect the output.
`
  const created = await store.skills.propose({
    name: 'use-secret-check', content, reason: `token ${secret}`, kind: 'create', source: 'test', sessionId: 's1', allowAutoAccept: false,
  })
  assert.equal(created.proposal.status, 'blocked')
  assert.equal(created.proposal.validation.ok, false)
  assert.doesNotMatch(created.proposal.candidate.content, /ghp_/)
  assert.doesNotMatch(created.proposal.diff, /ghp_/)
  assert.doesNotMatch(created.proposal.reason, /ghp_/)
  assert.ok(created.proposal.candidate.content.includes('[REDACTED]'))

  const row = await service.recordNote('s1', { title: `token ${secret}`, content: `Use ${secret} carefully.` })
  assert.doesNotMatch(row.entry.title, /ghp_/)
  assert.doesNotMatch(row.entry.content, /ghp_/)
  assert.ok(row.entry.redactions.length > 0)
})
