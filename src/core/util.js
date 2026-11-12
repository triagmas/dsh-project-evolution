/**
 * Small, dependency-free helpers shared by the host and tests.
 *
 * Everything here is deterministic and side-effect free except the explicit
 * atomic-write helpers. Keeping these primitives in one module lets the
 * acceptance script exercise the same code paths the plugin uses at runtime.
 */
import { createHash, randomBytes } from 'node:crypto'
import { mkdir, open, readFile, rename, rm, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'

export const PLUGIN_ID = 'dsh-project-evolution'
export const DATA_DIRNAME = 'project-evolution'
export const MAX_TEXT = 200_000

export function nowIso() {
  return new Date().toISOString()
}

export function sha256(value) {
  return createHash('sha256').update(String(value)).digest('hex')
}

export function shortHash(value, length = 12) {
  return sha256(value).slice(0, length)
}

export function token() {
  return randomBytes(16).toString('hex')
}

export function clamp(value, min, max) {
  const number = Number(value)
  if (!Number.isFinite(number)) return min
  return Math.min(max, Math.max(min, Math.trunc(number)))
}

export function asString(value, fallback = '') {
  return typeof value === 'string' ? value : fallback
}

export function asArray(value) {
  return Array.isArray(value) ? value : []
}

export function truncate(value, max = MAX_TEXT) {
  const text = String(value ?? '')
  if (text.length <= max) return text
  return `${text.slice(0, max)}\n…[truncated ${text.length - max} chars]`
}

export function unique(values) {
  return [...new Set(values.filter(Boolean))]
}

export function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function slugify(value, fallback = 'experience') {
  const slug = String(value ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9\u0400-\u04ff]+/g, '-')
  return slug.split('-').filter(Boolean).join('-') || fallback
}

export function yamlString(value) {
  return JSON.stringify(String(value ?? ''))
}

export function parseFrontmatter(markdown) {
  const text = String(markdown ?? '').replace(/^\uFEFF/, '')
  if (!text.startsWith('---\n') && !text.startsWith('---\r\n')) return { data: {}, body: text, raw: '' }
  const end = text.search(/\r?\n---\r?\n/)
  if (end < 0) return { data: {}, body: text, raw: '' }
  const raw = text.slice(text.indexOf('\n') + 1, end)
  const body = text.slice(end + (text.slice(end).startsWith('\r\n---\r\n') ? 7 : 5))
  const data = {}
  for (const line of raw.split(/\r?\n/)) {
    const match = /^([A-Za-z0-9_.-]+):\s*(.*)$/.exec(line)
    if (!match) continue
    const [, key, rest] = match
    let value = rest.trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    data[key] = value
  }
  return { data, body, raw }
}

export function renderFrontmatter(data) {
  const lines = ['---']
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined || value === null) continue
    lines.push(`${key}: ${typeof value === 'string' ? yamlString(value) : JSON.stringify(value)}`)
  }
  lines.push('---', '')
  return lines.join('\n')
}

export async function ensureDir(path) {
  await mkdir(path, { recursive: true })
}

export async function pathExists(path) {
  try {
    await readFile(path)
    return true
  } catch (error) {
    if (error?.code === 'ENOENT') return false
    if (error?.code === 'EISDIR') return true
    throw error
  }
}

export async function readJson(path, fallback) {
  try {
    return JSON.parse(await readFile(path, 'utf8'))
  } catch (error) {
    if (error?.code === 'ENOENT') return fallback
    if (error instanceof SyntaxError) return fallback
    throw error
  }
}

export async function readText(path, fallback = '') {
  try {
    return await readFile(path, 'utf8')
  } catch (error) {
    if (error?.code === 'ENOENT') return fallback
    throw error
  }
}

export async function atomicWrite(path, content) {
  await ensureDir(dirname(path))
  const temp = `${path}.${process.pid}.${randomBytes(6).toString('hex')}.tmp`
  try {
    await writeFile(temp, content, 'utf8')
    await rename(temp, path)
  } finally {
    await rm(temp, { force: true })
  }
}

export async function writeJson(path, value) {
  await atomicWrite(path, `${JSON.stringify(value, null, 2)}\n`)
}

/**
 * Acquire an exclusive per-project lock without a third-party dependency.
 * A stale lock is reclaimed only after its age exceeds `staleMs`; the
 * ownership token prevents one waiter from deleting another waiter's lock.
 */
export async function withFileLock(lockPath, fn, options = {}) {
  const staleMs = options.staleMs ?? 60_000
  const timeoutMs = options.timeoutMs ?? 10_000
  const started = Date.now()
  const owner = token()
  await ensureDir(dirname(lockPath))
  let handle
  while (!handle) {
    try {
      handle = await open(lockPath, 'wx')
      await handle.writeFile(JSON.stringify({ owner, pid: process.pid, at: nowIso() }))
    } catch (error) {
      if (error?.code !== 'EEXIST') throw error
      try {
        const current = JSON.parse(await readFile(lockPath, 'utf8'))
        const age = Date.now() - Date.parse(current.at || 0)
        if (!Number.isFinite(age) || age > staleMs) await rm(lockPath, { force: true })
      } catch {
        await rm(lockPath, { force: true }).catch(() => {})
      }
      if (Date.now() - started > timeoutMs) {
        throw new Error(`Timed out acquiring project lock: ${lockPath}`)
      }
      await new Promise((resolve) => setTimeout(resolve, 40))
    }
  }
  try {
    return await fn()
  } finally {
    await handle.close().catch(() => {})
    try {
      const current = JSON.parse(await readFile(lockPath, 'utf8'))
      if (current.owner === owner) await rm(lockPath, { force: true })
    } catch {
      // A stale cleaner may already have removed it.
    }
  }
}

/**
 * Bounded line diff with unified-style hunks. The implementation is a plain
 * LCS so it stays readable and has no runtime dependency. Very large inputs
 * fall back to a whole-file replace, which is still a truthful diff.
 */
export function unifiedDiff(oldText, newText, oldLabel = 'before', newLabel = 'after') {
  const oldLines = String(oldText ?? '').replace(/\r\n/g, '\n').split('\n')
  const newLines = String(newText ?? '').replace(/\r\n/g, '\n').split('\n')
  const limit = 1_500
  if (oldLines.length > limit || newLines.length > limit) {
    return [
      `--- ${oldLabel}`,
      `+++ ${newLabel}`,
      `@@ -1,${oldLines.length} +1,${newLines.length} @@`,
      ...oldLines.map((line) => `-${line}`),
      ...newLines.map((line) => `+${line}`),
    ].join('\n')
  }
  const rows = oldLines.length + 1
  const cols = newLines.length + 1
  const table = Array.from({ length: rows }, () => new Uint32Array(cols))
  for (let i = oldLines.length - 1; i >= 0; i--) {
    for (let j = newLines.length - 1; j >= 0; j--) {
      table[i][j] = oldLines[i] === newLines[j]
        ? table[i + 1][j + 1] + 1
        : Math.max(table[i + 1][j], table[i][j + 1])
    }
  }
  const ops = []
  let i = 0
  let j = 0
  while (i < oldLines.length && j < newLines.length) {
    if (oldLines[i] === newLines[j]) {
      ops.push({ type: ' ', line: oldLines[i], old: i + 1, new: j + 1 })
      i++
      j++
    } else if (table[i + 1][j] >= table[i][j + 1]) {
      ops.push({ type: '-', line: oldLines[i], old: i + 1, new: j + 1 })
      i++
    } else {
      ops.push({ type: '+', line: newLines[j], old: i + 1, new: j + 1 })
      j++
    }
  }
  while (i < oldLines.length) {
    ops.push({ type: '-', line: oldLines[i], old: i + 1, new: j + 1 })
    i++
  }
  while (j < newLines.length) {
    ops.push({ type: '+', line: newLines[j], old: i + 1, new: j + 1 })
    j++
  }
  const changed = ops.map((op, index) => (op.type === ' ' ? -1 : index)).filter((index) => index >= 0)
  if (changed.length === 0) return ''
  const context = 3
  const keep = new Set()
  for (const index of changed) {
    for (let k = Math.max(0, index - context); k <= Math.min(ops.length - 1, index + context); k++) keep.add(k)
  }
  const lines = [`--- ${oldLabel}`, `+++ ${newLabel}`]
  let index = 0
  while (index < ops.length) {
    if (!keep.has(index)) {
      index++
      continue
    }
    const start = index
    while (index < ops.length && keep.has(index)) index++
    const hunk = ops.slice(start, index)
    const oldStart = hunk.find((op) => op.type !== '+')?.old ?? 1
    const newStart = hunk.find((op) => op.type !== '-')?.new ?? 1
    const oldCount = hunk.filter((op) => op.type !== '+').length
    const newCount = hunk.filter((op) => op.type !== '-').length
    lines.push(`@@ -${oldStart},${oldCount} +${newStart},${newCount} @@`)
    for (const op of hunk) lines.push(`${op.type}${op.line}`)
  }
  return lines.join('\n')
}

export function normalizeCommand(command) {
  return String(command ?? '')
    .replace(/\\\s*\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 500)
}

export function stableStringify(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(',')}}`
}
