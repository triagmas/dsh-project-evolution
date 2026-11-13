/**
 * End-to-end acceptance for dsh-project-evolution.
 *
 * Uses two real temporary Git projects, a simulated DSH session event stream,
 * and the same host service/routes the plugin mounts. It does not install into
 * the active DSH profile and makes no model or network calls.
 */
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdir, mkdtemp, readFile, readdir, stat, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { EvolutionService } from '../src/core/service.js'
import { createRoutes } from '../src/core/routes.js'
import { parseFrontmatter } from '../src/core/util.js'

const steps = []
function step(name, detail = '') {
  steps.push({ name, detail, at: new Date().toISOString() })
  console.log(`PASS ${name}${detail ? `: ${detail}` : ''}`)
}
function run(command, args, cwd) {
  return execFileSync(command, args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
}
async function fileExists(path) {
  try { await stat(path); return true } catch { return false }
}

const base = await mkdtemp(join(tmpdir(), 'dsh-pe-accept-'))
const projectA = join(base, 'project-a')
const projectB = join(base, 'project-b')
const home = join(base, 'home')
await mkdir(projectA, { recursive: true })
await mkdir(projectB, { recursive: true })
await mkdir(home, { recursive: true })
for (const root of [projectA, projectB]) {
  run('git', ['init', '-q'], root)
  run('git', ['config', 'user.email', 'acceptance@example.invalid'], root)
  run('git', ['config', 'user.name', 'Acceptance'], root)
}
await mkdir(join(projectA, 'src'), { recursive: true })
await writeFile(join(projectA, 'src', 'math.js'), 'export const add = (a, b) => a + b\n')
await writeFile(join(projectA, 'package.json'), JSON.stringify({ name: 'project-a', scripts: { test: 'node --test' } }, null, 2))
await writeFile(join(projectB, 'README.md'), '# unrelated project\n')
run('git', ['add', '.'], projectA)
run('git', ['commit', '-q', '-m', 'initial'], projectA)
run('git', ['add', '.'], projectB)
run('git', ['commit', '-q', '-m', 'initial'], projectB)

/** Minimal stand-in for DSH's native skill provider, backed by the real files. */
function makeSkills() {
  return {
    async list({ cwd }) {
      const dir = join(cwd, '.dsh', 'skills')
      const entries = await readdir(dir, { withFileTypes: true }).catch(() => [])
      const rows = []
      for (const entry of entries) {
        if (!entry.isDirectory()) continue
        const path = join(dir, entry.name, 'SKILL.md')
        const content = await readFile(path, 'utf8').catch(() => '')
        if (!content) continue
        const parsed = parseFrontmatter(content)
        rows.push({
          name: parsed.data.name || entry.name,
          description: parsed.data.description || '',
          whenToUse: parsed.data.whenToUse || '',
          path,
          source: 'project-dsh',
          provider: 'native',
          invocation: { modelInvocable: true },
          content,
        })
      }
      return rows
    },
    async get(name, { cwd }) {
      return (await this.list({ cwd })).find((row) => row.name === name)
    },
  }
}

function session(id, cwd, events) {
  return { id, header: { cwd, title: `session ${id}`, updatedAt: new Date().toISOString() }, snapshotEvents: () => events }
}
const now = () => new Date().toISOString()
function baseEvents(turn, user, editPath, command, output) {
  return [
    { type: 'turn/start', seq: turn * 100 + 1, time: now(), data: { turn } },
    { type: 'user/message', seq: turn * 100 + 2, time: now(), data: { id: `u${turn}`, role: 'user', content: [{ type: 'text', text: user }], source: { kind: 'user' } } },
    { type: 'assistant/message', seq: turn * 100 + 3, time: now(), data: { turn, step: 1, message: { role: 'assistant', content: [{ type: 'text', text: 'Applying the change and running verification.' }] } } },
    { type: 'tool/call', seq: turn * 100 + 4, time: now(), data: { turn, step: 1, callId: `c${turn}a`, name: 'edit', arguments: JSON.stringify({ file_path: editPath, old_string: 'x', new_string: 'y' }) } },
    { type: 'tool/result', seq: turn * 100 + 5, time: now(), data: { turn, step: 1, message: { role: 'tool', toolCallId: `c${turn}a`, content: [{ type: 'text', text: 'ok' }], isError: false } } },
    { type: 'tool/call', seq: turn * 100 + 6, time: now(), data: { turn, step: 2, callId: `c${turn}b`, name: 'bash', arguments: JSON.stringify({ command }) } },
    { type: 'tool/result', seq: turn * 100 + 7, time: now(), data: { turn, step: 2, message: { role: 'tool', toolCallId: `c${turn}b`, content: [{ type: 'text', text: output }], isError: false } } },
    { type: 'turn/end', seq: turn * 100 + 8, time: now(), data: { turn, reason: { kind: 'completed' } } },
  ]
}

const s1 = session('s1', projectA, baseEvents(1, 'Add a subtraction helper to src/math.js and verify it with the test command.', 'src/math.js', 'node --test', '# tests 3\n# pass 3\n# fail 0'))
const warnings = []
const ctx = {
  skills: makeSkills(),
  sessions: {
    get: (id) => {
      if (id === 's1') return s1
      if (id === 's2') return s2
      if (id === 's3') return s3
      return undefined
    },
    list: () => [s1, s2, s3],
  },
  logger: { info() {}, warn: (...args) => warnings.push(args.join(' ')), error: (...args) => warnings.push(args.join(' ')) },
}
const service = new EvolutionService({ ctx, config: {}, logger: ctx.logger, dshHome: home })

const overview0 = await service.overview('s1')
assert.equal(overview0.catalog.project.length, 0)
step('project identity and Git detection', `${overview0.project.name} @ ${overview0.project.git.head}`)

await service.captureTurn({ agent: { session: s1 }, turn: 1, events: s1.snapshotEvents() })
assert.equal(warnings.length, 0, warnings.join('\n'))
const overview1 = await service.overview('s1')
assert.equal(overview1.status.counts.knowledge >= 1, true)
assert.equal(overview1.proposals.length, 1)
const createProposal = overview1.proposals[0]
assert.equal(createProposal.tests.status, 'PASS')
assert.equal(createProposal.status, 'proposed')
assert.equal(await fileExists(join(projectA, '.dsh', 'skills', createProposal.skill, 'SKILL.md')), false)
step('verified turn captured as reviewable proposal', `${createProposal.skill}; backtest ${createProposal.tests.status}`)

const firstAccept = await service.action('s1', { action: 'accept', proposalId: createProposal.id, expectedRevision: createProposal.revision })
assert.equal(firstAccept.proposal.status, 'accepted')
assert.equal(firstAccept.proposal.applied.actor, 'user')
const skillPath = join(projectA, '.dsh', 'skills', createProposal.skill, 'SKILL.md')
const v1 = await readFile(skillPath, 'utf8')
assert.match(v1, /^---\nname:/)
assert.match(v1, /node --test/)
step('manual acceptance writes a native project SKILL.md', skillPath)

const nativeRows = await ctx.skills.list({ cwd: projectA })
assert.equal(nativeRows.some((row) => row.name === createProposal.skill), true)
const recalled = await service.recall('s1', 'subtraction math test')
assert.equal(recalled.skills.some((row) => row.name === createProposal.skill), true)
const nativeGet = await ctx.skills.get(createProposal.skill, { cwd: projectA })
assert.match(nativeGet.content, /## Verification/)
step('new session discovers and recalls the accepted project skill', createProposal.skill)

const s2 = session('s2', projectA, baseEvents(2, "Actually, don't use node --test here; use npm test instead so the package script is authoritative.", 'src/math.js', 'npm test', '# tests 3\n# pass 3\n# fail 0'))
await service.captureTurn({ agent: { session: s2 }, turn: 2, events: s2.snapshotEvents() })
assert.equal(warnings.length, 0, warnings.join('\n'))
const overview2 = await service.overview('s2')
const updateProposal = overview2.proposals.find((row) => row.kind === 'update')
assert.ok(updateProposal, 'expected an update proposal after a correction')
assert.equal(updateProposal.skill, createProposal.skill)
assert.equal(updateProposal.tests.status, 'PASS')
assert.equal(updateProposal.tests.improvement, true)
assert.match(updateProposal.diff, /User corrections/)
assert.match(updateProposal.diff, /npm test/)
step('user correction proposes a new version, not a second skill', `backtest ${updateProposal.tests.status}, baseline ${updateProposal.tests.baseline.status}`)

const secondAccept = await service.action('s2', { action: 'accept', proposalId: updateProposal.id, expectedRevision: updateProposal.revision })
assert.equal(secondAccept.proposal.status, 'accepted')
const v2 = await readFile(skillPath, 'utf8')
assert.notEqual(v1, v2)
assert.match(v2, /npm test/)
assert.match(v2, /Actually, don't use node --test/)
const versions = await service.action('s2', { action: 'list-versions', skill: createProposal.skill })
assert.equal(versions.versions.length >= 2, true)
const updatedRecord = versions.versions.find((row) => row.metadata?.proposalId === updateProposal.id)
assert.ok(updatedRecord)
assert.match(updatedRecord.diff, /User corrections/)
step('versions and diffs preserve both the correction and its rationale', `${versions.versions.length} versions recorded`)

const rollback = await service.action('s2', { action: 'rollback', skill: createProposal.skill, version: versions.versions[versions.versions.length - 1].version })
assert.equal(rollback.skill, createProposal.skill)
const v3 = await readFile(skillPath, 'utf8')
assert.equal(v3, v1)
step('rollback restores an earlier content-addressed version', rollback.version)

const beforeB = await service.overview('s2')
const s3 = session('s3', projectB, baseEvents(1, 'Change the unrelated README and run its check.', 'README.md', 'node --test', '# tests 1\n# pass 1\n# fail 0'))
await service.captureTurn({ agent: { session: s3 }, turn: 1, events: s3.snapshotEvents() })
const overviewB = await service.overview('s3')
assert.equal(overviewB.project.root, projectB)
assert.equal(overviewB.catalog.project.length, 0)
const knowledgeB = await service.knowledge('s3', '')
assert.equal(knowledgeB.length >= 1, true)
assert.equal(knowledgeB.some((row) => /subtraction/i.test(row.title + row.content)), false)
const recallB = await service.recall('s3', 'subtraction math test')
assert.equal(recallB.skills.length, 0)
const afterA = await service.overview('s2')
assert.equal(afterA.status.counts.knowledge, beforeB.status.counts.knowledge)
assert.equal(afterA.catalog.project.length, 1)
step('second project is isolated from the first project knowledge and skills', `${projectB} has no inherited skill`)

const ignore = run('git', ['check-ignore', '.dsh/project-evolution/state.json'], projectA).trim()
assert.equal(ignore, '.dsh/project-evolution/state.json')
const status = run('git', ['status', '--porcelain=v1', '--untracked-files=all'], projectA)
assert.match(status, /\.dsh\/skills\//)
step('evidence is Git-ignored while project skills remain usual tracked files')

const [overviewRoute] = createRoutes(service, ctx.logger).filter((route) => route.path.endsWith('/overview'))
const response = await overviewRoute.fetch(new Request('http://127.0.0.1/api/project-evolution/overview?sessionId=s2'))
assert.equal(response.status, 200)
const body = await response.json()
assert.equal(body.ok, true)
assert.equal(body.project.root, projectA)
step('Web API route returns the scoped overview', `${response.status}`)

const [projectsRoute] = createRoutes(service, ctx.logger).filter((route) => route.path.endsWith('/projects'))
const projectsResponse = await projectsRoute.fetch(new Request('http://127.0.0.1/api/project-evolution/projects'))
assert.equal(projectsResponse.status, 200)
const projectsBody = await projectsResponse.json()
assert.equal(projectsBody.ok, true)
assert.equal(projectsBody.config.autoAccept, false)
const projectARow = projectsBody.projects.find((project) => project.root === projectA)
const projectBRow = projectsBody.projects.find((project) => project.root === projectB)
assert.ok(projectARow && projectBRow)
assert.equal(projectARow.sessionCount, 2)
assert.equal(projectBRow.sessionCount, 1)
step('global projects API returns config and both project roots with chat counts', `${projectsBody.projects.length} projects`)

console.log(JSON.stringify({ ok: true, steps, projectA, projectB, warnings }, null, 2))
