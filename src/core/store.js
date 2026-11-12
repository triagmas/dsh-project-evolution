/**
 * Bounded, per-project persistence.
 *
 * Layout:
 *   <project>/.dsh/project-evolution/state.json
 *   <project>/.dsh/project-evolution/knowledge.jsonl
 *   <project>/.dsh/project-evolution/proposals/<id>.json
 *   <project>/.dsh/project-evolution/versions/<skill>/<version>.json
 *   <project>/.dsh/project-evolution/runs/<id>.json
 *   <project>/.dsh/project-evolution/lock
 *
 * The directory carries its own `.gitignore`, so captured evidence stays local
 * while `.dsh/skills` remains a normal, reviewable Git-tracked directory.
 */
import { readdir, rename, rm, unlink } from 'node:fs/promises'
import { basename, join } from 'node:path'
import {
  asArray, asString, atomicWrite, clamp, ensureDir, nowIso, readJson, readText,
  shortHash, token, truncate, unique, withFileLock, writeJson,
} from './util.js'
import { projectDataDir, projectSkillsDir } from './project.js'
import { maskSecrets } from './security.js'

export const DEFAULT_CONFIG = Object.freeze({
  enabled: true,
  autoAnalyze: true,
  autoAccept: false,
  analyzeIntervalMinutes: 5,
  maxAnalysesPerDay: 48,
  maxModelCallsPerDay: 0,
  maxInputChars: 24_000,
  maxKnowledgeEntries: 500,
  maxProposals: 100,
  retentionDays: 90,
  minEvidenceScore: 5,
  captureUserCorrections: true,
  requireTestsForAutoAccept: true,
  globalPublishAllowed: false,
  lastUpdated: null,
})

export const STATE_VERSION = 1

export function normalizeConfig(input = {}) {
  return {
    enabled: input.enabled !== false,
    autoAnalyze: input.autoAnalyze !== false,
    autoAccept: input.autoAccept === true,
    analyzeIntervalMinutes: clamp(input.analyzeIntervalMinutes ?? 5, 1, 1_440),
    maxAnalysesPerDay: clamp(input.maxAnalysesPerDay ?? 48, 1, 500),
    maxModelCallsPerDay: clamp(input.maxModelCallsPerDay ?? 0, 0, 1_000),
    maxInputChars: clamp(input.maxInputChars ?? 24_000, 1_000, 200_000),
    maxKnowledgeEntries: clamp(input.maxKnowledgeEntries ?? 500, 20, 5_000),
    maxProposals: clamp(input.maxProposals ?? 100, 10, 2_000),
    retentionDays: clamp(input.retentionDays ?? 90, 1, 3_650),
    minEvidenceScore: clamp(input.minEvidenceScore ?? 5, 1, 100),
    captureUserCorrections: input.captureUserCorrections !== false,
    requireTestsForAutoAccept: input.requireTestsForAutoAccept !== false,
    globalPublishAllowed: input.globalPublishAllowed === true,
    lastUpdated: asString(input.lastUpdated) || null,
  }
}

export async function readGlobalConfig(dshHome) {
  const path = join(dshHome, 'project-evolution', 'config.json')
  return normalizeConfig(await readJson(path, {}))
}

export async function writeGlobalConfig(dshHome, patch) {
  const path = join(dshHome, 'project-evolution', 'config.json')
  const current = await readGlobalConfig(dshHome)
  const next = normalizeConfig({ ...current, ...patch, lastUpdated: nowIso() })
  await writeJson(path, next)
  return next
}

function dayKey(date = new Date()) {
  return date.toISOString().slice(0, 10)
}

function emptyState(project) {
  return {
    version: STATE_VERSION,
    projectKey: project.key,
    projectRoot: project.root,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    statistics: {
      knowledge: 0,
      proposals: 0,
      accepted: 0,
      rejected: 0,
      rollbacks: 0,
      analyses: 0,
      skillUses: 0,
    },
    analysis: { day: dayKey(), count: 0, modelCalls: 0 },
    sessions: {},
    lastAnalysisAt: null,
    lastProposalAt: null,
  }
}

async function ensureProjectLayout(project) {
  const dir = projectDataDir(project.root)
  await ensureDir(join(dir, 'proposals'))
  await ensureDir(join(dir, 'versions'))
  await ensureDir(join(dir, 'runs'))
  const ignore = join(dir, '.gitignore')
  await atomicWrite(ignore, '# Local project-evolution evidence; project skills remain tracked under .dsh/skills.\n*\n!.gitignore\n')
  return dir
}

export class ProjectStore {
  constructor({ project, config, dshHome }) {
    this.project = project
    this.config = normalizeConfig(config ?? {})
    this.dshHome = dshHome
    this.root = project.root
    this.dir = projectDataDir(project.root)
    this.statePath = join(this.dir, 'state.json')
    this.knowledgePath = join(this.dir, 'knowledge.jsonl')
    this.proposalsDir = join(this.dir, 'proposals')
    this.versionsDir = join(this.dir, 'versions')
    this.runsDir = join(this.dir, 'runs')
    this.lockPath = join(this.dir, 'lock')
    this.skillsDir = projectSkillsDir(project.root)
  }

  async init() {
    await ensureProjectLayout(this.project)
    let state = null
    try {
      const raw = await readText(this.statePath, null)
      if (raw !== null) state = JSON.parse(raw)
    } catch {
      // A torn state file is evidence about a crash, not a reason to discard
      // it. Keep a quarantined copy and start a clean state next to it.
      const quarantine = `${this.statePath}.corrupt-${nowIso().replace(/[:.]/g, '-')}`
      await rename(this.statePath, quarantine).catch(() => {})
    }
    if (!state || state.version !== STATE_VERSION) {
      await writeJson(this.statePath, emptyState(this.project))
    }
    await this.cleanup()
    return this
  }

  withLock(fn, options) {
    return withFileLock(this.lockPath, fn, options)
  }

  async readState() {
    return (await readJson(this.statePath, null)) ?? emptyState(this.project)
  }

  async writeState(state) {
    const next = { ...state, updatedAt: nowIso() }
    await writeJson(this.statePath, next)
    return next
  }

  async updateState(mutator) {
    const state = await this.readState()
    const result = mutator(state)
    await this.writeState(state)
    return result
  }

  async readKnowledge() {
    const text = await readText(this.knowledgePath, '')
    if (!text.trim()) return []
    const rows = []
    for (const line of text.split('\n')) {
      if (!line.trim()) continue
      try {
        rows.push(JSON.parse(line))
      } catch {
        // A torn line is ignored rather than poisoning the whole store.
      }
    }
    return rows
  }

  async writeKnowledge(rows) {
    const bounded = rows
      .sort((left, right) => String(left.createdAt).localeCompare(String(right.createdAt)))
      .slice(-this.config.maxKnowledgeEntries)
    await atomicWrite(this.knowledgePath, bounded.map((row) => JSON.stringify(row)).join('\n') + (bounded.length ? '\n' : ''))
    return bounded
  }

  /**
   * Deduplicate by content fingerprint. Re-seeing the same decision increments
   * `seenCount`; it does not create another row. This is the main defense
   * against "one skill/file per event" noise.
   */
  async appendKnowledge(entry) {
    const rows = await this.readKnowledge()
    const fingerprint = entry.fingerprint || `${entry.kind}:${shortHash(`${entry.title}\n${entry.content}`, 20)}`
    const existing = rows.find((row) => row.fingerprint === fingerprint)
    if (existing) {
      existing.seenCount = (existing.seenCount ?? 1) + 1
      existing.lastSeenAt = nowIso()
      existing.confidence = entry.confidence === 'confirmed' ? 'confirmed' : existing.confidence
      await this.writeKnowledge(rows)
      return { entry: existing, created: false }
    }
    const id = `kn_${shortHash(`${fingerprint}:${nowIso()}`, 16)}`
    const row = {
      id,
      fingerprint,
      kind: entry.kind,
      title: truncate(entry.title, 200),
      content: truncate(entry.content, 8_000),
      tags: unique(asArray(entry.tags).map((tag) => String(tag).slice(0, 40))).slice(0, 12),
      confidence: entry.confidence === 'confirmed' ? 'confirmed' : 'observed',
      source: entry.source ?? {},
      evidenceScore: clamp(entry.evidenceScore ?? 0, 0, 100),
      untrusted: entry.untrusted === true,
      redactions: asArray(entry.redactions).slice(0, 20),
      injection: asArray(entry.injection).slice(0, 10),
      seenCount: 1,
      createdAt: nowIso(),
      lastSeenAt: nowIso(),
    }
    rows.push(row)
    const saved = await this.writeKnowledge(rows)
    const kept = saved.some((item) => item.id === id)
    return { entry: row, created: kept }
  }

  async deleteKnowledge(id) {
    const rows = await this.readKnowledge()
    const next = rows.filter((row) => row.id !== id)
    if (next.length === rows.length) return false
    await this.writeKnowledge(next)
    return true
  }

  async listProposals() {
    const names = await readdir(this.proposalsDir).catch(() => [])
    const rows = []
    for (const name of names) {
      if (!name.endsWith('.json')) continue
      const proposal = await readJson(join(this.proposalsDir, name), null)
      if (proposal) rows.push(proposal)
    }
    return rows.sort((left, right) => String(right.createdAt).localeCompare(String(left.createdAt)))
  }

  async getProposal(id) {
    return readJson(join(this.proposalsDir, `${id}.json`), null)
  }

  async saveProposal(proposal) {
    await ensureDir(this.proposalsDir)
    await writeJson(join(this.proposalsDir, `${proposal.id}.json`), proposal)
    const all = await this.listProposals()
    if (all.length > this.config.maxProposals) {
      // Bounded storage: keep the newest N proposals even when many are still
      // awaiting review. The oldest are removed; accepted versions and runs
      // remain the durable history of what actually changed.
      const removable = all.slice(this.config.maxProposals)
      for (const item of removable) await rm(join(this.proposalsDir, `${item.id}.json`), { force: true })
    }
    return proposal
  }

  async deleteProposal(id) {
    await rm(join(this.proposalsDir, `${id}.json`), { force: true })
  }

  async saveVersion({ skill, content, diff, metadata }) {
    const dir = join(this.versionsDir, skill)
    await ensureDir(dir)
    const stamp = nowIso().replace(/[:.]/g, '-')
    const version = `v_${stamp}_${token().slice(0, 6)}`
    // Version history is local evidence too: never persist a credential that
    // happened to exist in an older skill file or in a generated diff.
    const record = {
      version,
      skill,
      content: maskSecrets(String(content ?? '')).text,
      diff: maskSecrets(String(diff ?? '')).text,
      metadata: metadata ?? {},
      createdAt: nowIso(),
    }
    await writeJson(join(dir, `${version}.json`), record)
    const versions = await this.listVersions(skill)
    for (const old of versions.slice(20)) {
      await rm(join(dir, `${old.version}.json`), { force: true })
    }
    return record
  }

  async listVersions(skill) {
    const dir = join(this.versionsDir, skill)
    const names = await readdir(dir).catch(() => [])
    const rows = []
    for (const name of names) {
      if (!name.endsWith('.json')) continue
      const record = await readJson(join(dir, name), null)
      if (record) rows.push({ ...record, bytes: Buffer.byteLength(String(record.content ?? ''), 'utf8') })
    }
    return rows.sort((left, right) => String(right.createdAt).localeCompare(String(left.createdAt)))
  }

  async getVersion(skill, version) {
    return readJson(join(this.versionsDir, skill, `${version}.json`), null)
  }

  async saveRun(run) {
    await ensureDir(this.runsDir)
    const id = run.id || `run_${shortHash(`${run.kind}:${nowIso()}`, 16)}`
    const record = { ...run, id, createdAt: run.createdAt || nowIso() }
    await writeJson(join(this.runsDir, `${id}.json`), record)
    return record
  }

  async listRuns(limit = 30) {
    const names = await readdir(this.runsDir).catch(() => [])
    const rows = []
    for (const name of names) {
      if (!name.endsWith('.json')) continue
      const record = await readJson(join(this.runsDir, name), null)
      if (record) rows.push(record)
    }
    return rows
      .sort((left, right) => String(right.createdAt).localeCompare(String(left.createdAt)))
      .slice(0, limit)
  }

  async cleanup() {
    const cutoff = Date.now() - this.config.retentionDays * 86_400_000
    const runs = await readdir(this.runsDir).catch(() => [])
    for (const name of runs) {
      if (!name.endsWith('.json')) continue
      const path = join(this.runsDir, name)
      const record = await readJson(path, null)
      if (!record || Date.parse(record.createdAt) < cutoff) await unlink(path).catch(() => {})
    }
    const rows = await this.readKnowledge()
    if (rows.length > this.config.maxKnowledgeEntries) {
      await this.writeKnowledge(rows)
    }
    const proposals = await this.listProposals()
    for (const proposal of proposals.slice(this.config.maxProposals)) {
      await this.deleteProposal(proposal.id).catch(() => {})
    }
  }

  async status() {
    const [state, knowledge, proposals, runs] = await Promise.all([
      this.readState(),
      this.readKnowledge(),
      this.listProposals(),
      this.listRuns(10),
    ])
    return {
      project: {
        root: this.project.root,
        name: this.project.name,
        key: this.project.key,
        isGit: this.project.isGit,
        sessionCwd: this.project.sessionCwd,
      },
      state,
      counts: {
        knowledge: knowledge.length,
        confirmedKnowledge: knowledge.filter((row) => row.confidence === 'confirmed').length,
        proposals: proposals.length,
        pendingProposals: proposals.filter((row) => row.status === 'proposed').length,
        runs: runs.length,
      },
      lastRuns: runs,
    }
  }

  async health() {
    const state = await this.readState()
    const knowledge = await this.readKnowledge()
    const proposals = await this.listProposals()
    return {
      ok: true,
      version: STATE_VERSION,
      dataDir: basename(this.dir),
      knowledgeDir: this.dir,
      skillsDir: projectSkillsDir(this.root),
      counts: { knowledge: knowledge.length, proposals: proposals.length },
      analysis: state.analysis,
      limit: {
        knowledge: this.config.maxKnowledgeEntries,
        proposals: this.config.maxProposals,
      },
    }
  }
}
