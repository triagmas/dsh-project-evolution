import { execFileSync } from 'node:child_process'
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

export async function tempDir(prefix = 'dsh-pe-test-') {
  return mkdtemp(join(tmpdir(), prefix))
}

export async function gitProject(prefix = 'dsh-pe-project-') {
  const root = await tempDir(prefix)
  execFileSync('git', ['init', '-q'], { cwd: root })
  execFileSync('git', ['config', 'user.email', 'test@example.invalid'], { cwd: root })
  execFileSync('git', ['config', 'user.name', 'Test'], { cwd: root })
  await writeFile(join(root, 'README.md'), '# test project\n')
  execFileSync('git', ['add', '.'], { cwd: root })
  execFileSync('git', ['commit', '-q', '-m', 'initial'], { cwd: root })
  return root
}

export async function writeProjectFile(root, path, content) {
  const full = join(root, path)
  await mkdir(join(full, '..'), { recursive: true })
  await writeFile(full, content)
}

const now = () => new Date().toISOString()

export function turnEvents({ turn = 1, user, file = 'src/index.js', command = 'npm test', output = '# pass 1\n# fail 0' } = {}) {
  const base = turn * 100
  return [
    { type: 'turn/start', seq: base + 1, time: now(), data: { turn } },
    { type: 'user/message', seq: base + 2, time: now(), data: { id: `u${turn}`, role: 'user', content: [{ type: 'text', text: user }], source: { kind: 'user' } } },
    { type: 'assistant/message', seq: base + 3, time: now(), data: { turn, step: 1, message: { role: 'assistant', content: [{ type: 'text', text: 'I will make the change.' }] } } },
    { type: 'tool/call', seq: base + 4, time: now(), data: { turn, step: 1, callId: `c${turn}a`, name: 'edit', arguments: JSON.stringify({ file_path: file, old_string: 'a', new_string: 'b' }) } },
    { type: 'tool/result', seq: base + 5, time: now(), data: { turn, step: 1, message: { role: 'tool', toolCallId: `c${turn}a`, content: [{ type: 'text', text: 'ok' }], isError: false } } },
    { type: 'tool/call', seq: base + 6, time: now(), data: { turn, step: 2, callId: `c${turn}b`, name: 'bash', arguments: JSON.stringify({ command }) } },
    { type: 'tool/result', seq: base + 7, time: now(), data: { turn, step: 2, message: { role: 'tool', toolCallId: `c${turn}b`, content: [{ type: 'text', text: output }], isError: false } } },
    { type: 'turn/end', seq: base + 8, time: now(), data: { turn, reason: { kind: 'completed' } } },
  ]
}

export function fakeSession({ id, cwd, events, title }) {
  return {
    id,
    header: { cwd, title: title || id, updatedAt: now() },
    snapshotEvents: () => events,
  }
}

export function fakeCtx(sessions = []) {
  const byId = new Map(sessions.map((session) => [session.id, session]))
  return {
    skills: { list: async () => [], get: async () => undefined },
    sessions: {
      get: (id) => byId.get(id),
      list: () => sessions,
    },
  }
}
