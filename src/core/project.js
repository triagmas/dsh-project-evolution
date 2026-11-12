/**
 * Project detection and path layout.
 *
 * The canonical project root is the Git root when the session directory is in
 * a repository; otherwise it is the session directory. Project knowledge lives
 * in `<root>/.dsh/project-evolution`, project skills in `<root>/.dsh/skills`.
 * Nothing here reads another project's directory.
 */
import { execFile } from 'node:child_process'
import { realpath, stat } from 'node:fs/promises'
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from 'node:path'
import { promisify } from 'node:util'
import { DATA_DIRNAME, sha256 } from './util.js'

const execFileAsync = promisify(execFile)

export function projectKey(root) {
  return sha256(resolve(root)).slice(0, 20)
}

export function projectDataDir(root) {
  return join(root, '.dsh', DATA_DIRNAME)
}

export function projectSkillsDir(root) {
  return join(root, '.dsh', 'skills')
}

export function globalSkillsDir(dshHome) {
  return join(dshHome, 'skills')
}

export function globalConfigPath(dshHome) {
  return join(dshHome, DATA_DIRNAME, 'config.json')
}

export function relativeSafe(base, target) {
  const rel = relative(resolve(base), resolve(target))
  if (rel === '') return '.'
  if (rel.startsWith('..') || isAbsolute(rel)) return null
  return rel.split(sep).join('/')
}

export function assertInside(base, target, label = 'path') {
  const rel = relativeSafe(base, target)
  if (rel === null) throw new Error(`${label} escapes project root`)
  return rel
}

export async function realDirectory(path) {
  const info = await stat(path)
  if (!info.isDirectory()) throw new Error(`Not a directory: ${path}`)
  return realpath(path)
}

export async function findGitRoot(cwd) {
  let current
  try {
    current = await realDirectory(cwd)
  } catch {
    return undefined
  }
  let candidate = current
  for (let depth = 0; depth < 40; depth++) {
    try {
      const info = await stat(join(candidate, '.git'))
      if (info.isDirectory() || info.isFile()) return candidate
    } catch {
      // Keep walking.
    }
    const parent = dirname(candidate)
    if (parent === candidate) break
    candidate = parent
  }
  return undefined
}

async function git(root, args, timeout = 3_000) {
  try {
    const { stdout } = await execFileAsync('git', args, {
      cwd: root,
      timeout,
      maxBuffer: 2 * 1024 * 1024,
      windowsHide: true,
      env: {
        PATH: process.env.PATH,
        HOME: process.env.HOME,
        SYSTEMROOT: process.env.SYSTEMROOT,
        USERPROFILE: process.env.USERPROFILE,
        APPDATA: process.env.APPDATA,
        LOCALAPPDATA: process.env.LOCALAPPDATA,
        TEMP: process.env.TEMP,
        GIT_TERMINAL_PROMPT: '0',
        GIT_OPTIONAL_LOCKS: '0',
        GIT_CONFIG_NOSYSTEM: '1',
      },
    })
    return stdout.trim()
  } catch {
    return ''
  }
}

export async function gitSnapshot(root) {
  const [head, branch, status, diffStat] = await Promise.all([
    git(root, ['rev-parse', '--short=12', 'HEAD']),
    git(root, ['rev-parse', '--abbrev-ref', 'HEAD']),
    git(root, ['status', '--porcelain=v1', '--untracked-files=all']),
    git(root, ['diff', '--stat', '--no-ext-diff', '--no-color']),
  ])
  const files = status
    ? status.split('\n').filter(Boolean).slice(0, 80).map((line) => ({
        status: line.slice(0, 2).trim(),
        path: line.slice(3).trim(),
      }))
    : []
  return {
    isRepo: Boolean(head || branch || status),
    head: head || undefined,
    branch: branch || undefined,
    dirty: Boolean(status),
    changedFiles: files.length,
    files,
    diffStat: diffStat ? diffStat.split('\n').slice(0, 20) : [],
  }
}

/**
 * Resolve a session cwd into the project identity used by every store method.
 * The Git root is preferred; `cwd` is retained for context and for projects
 * that have not been initialized with Git yet.
 */
export async function resolveProject(cwd) {
  if (!cwd || typeof cwd !== 'string') throw new Error('Project detection requires a session working directory.')
  const sessionCwd = await realDirectory(cwd)
  const gitRoot = await findGitRoot(sessionCwd)
  const root = gitRoot ?? sessionCwd
  return {
    root,
    gitRoot,
    sessionCwd,
    isGit: Boolean(gitRoot),
    key: projectKey(root),
    name: basename(root) || root,
    dataDir: projectDataDir(root),
    skillsDir: projectSkillsDir(root),
    relativeCwd: relativeSafe(root, sessionCwd) ?? '.',
  }
}

export async function projectOverviewMetadata(project) {
  const git = await gitSnapshot(project.root)
  return {
    root: project.root,
    sessionCwd: project.sessionCwd,
    gitRoot: project.gitRoot,
    isGit: project.isGit,
    name: project.name,
    key: project.key,
    relativeCwd: project.relativeCwd,
    git,
  }
}
