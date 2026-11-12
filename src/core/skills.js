/**
 * Project skill files, proposals, versions, backtests, and rollback.
 *
 * Project skills are ordinary `<project>/.dsh/skills/<name>/SKILL.md` files so
 * DSH's native skill filesystem discovers them and Git tracks them. This module
 * adds evidence, review, version history, and rollback around that standard
 * format; it does not introduce a second skill format.
 */
import { cp, readdir, readFile, rename, rm, stat } from 'node:fs/promises'
import { basename, dirname, join } from 'node:path'
import {
  asArray, atomicWrite, clamp, ensureDir, escapeRegExp, nowIso, parseFrontmatter,
  readText, renderFrontmatter, sha256, shortHash, slugify, truncate, unique,
  unifiedDiff, yamlString,
} from './util.js'
import { maskSecrets, securitySummary, validateSkillContent } from './security.js'
import { buildBacktestCases, evaluateBacktest, proposedSkillName } from './analyzer.js'
import { assertInside, projectDataDir, projectSkillsDir, relativeSafe } from './project.js'

const SKILL_NAME = /^[a-z0-9][a-z0-9._-]{0,63}$/
const VERSION_NAME = /^v_[A-Za-z0-9._-]{1,120}$/

export function isValidSkillName(name) {
  return SKILL_NAME.test(String(name ?? ''))
}

function sanitizeForYaml(value) {
  return String(value ?? '').replace(/\r?\n/g, ' ').trim()
}

async function walkSkillFiles(root) {
  const entries = await readdir(root, { withFileTypes: true }).catch(() => [])
  const files = []
  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue
    if (entry.isDirectory()) {
      const file = join(root, entry.name, 'SKILL.md')
      try {
        const info = await stat(file)
        files.push({ name: entry.name, path: file, modified: info.mtime.toISOString() })
      } catch {
        // Not every directory is a skill.
      }
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      const info = await stat(join(root, entry.name))
      files.push({ name: basename(entry.name, '.md'), path: join(root, entry.name), modified: info.mtime.toISOString() })
    }
  }
  return files
}

function skillMetadata(content, fallbackName) {
  const parsed = parseFrontmatter(content)
  const data = parsed.data
  return {
    name: data.name || fallbackName,
    description: data.description || '',
    whenToUse: data.whenToUse || data['when-to-use'] || '',
    created_by: data.created_by || data.createdBy || '',
    confidence: data.confidence || '',
    evidence_score: Number(data.evidence_score ?? 0) || 0,
    source_fingerprint: data.source_fingerprint || '',
    source_session: data.source_session || '',
    source_turn: Number(data.source_turn ?? 0) || 0,
    disableModelInvocation: String(data['disable-model-invocation'] ?? '').toLowerCase() === 'true',
    body: parsed.body,
  }
}

export class SkillManager {
  constructor({ ctx, store, project, config, logger }) {
    this.ctx = ctx
    this.store = store
    this.project = project
    this.config = config
    this.logger = logger
    this.skillsDir = projectSkillsDir(project.root)
    this.dataDir = projectDataDir(project.root)
    this.archiveDir = join(this.dataDir, 'archive')
  }

  async listProjectSkills() {
    const rows = []
    for (const file of await walkSkillFiles(this.skillsDir)) {
      const content = await readText(file.path, '')
      const metadata = skillMetadata(content, file.name)
      rows.push({
        name: metadata.name,
        description: metadata.description,
        whenToUse: metadata.whenToUse,
        path: file.path,
        relativePath: relativeSafe(this.project.root, file.path),
        scope: 'project',
        source: 'dsh-project',
        provider: 'project-evolution',
        createdBy: metadata.created_by,
        confidence: metadata.confidence,
        evidenceScore: metadata.evidence_score,
        sourceFingerprint: metadata.source_fingerprint,
        sourceSession: metadata.source_session,
        sourceTurn: metadata.source_turn,
        enabled: !metadata.disableModelInvocation,
        modified: file.modified,
        bytes: Buffer.byteLength(content, 'utf8'),
      })
    }
    return rows.sort((left, right) => left.name.localeCompare(right.name))
  }

  async nativeCatalog() {
    try {
      return await this.ctx.skills.list({ cwd: this.project.sessionCwd })
    } catch (error) {
      this.logger?.warn?.(`project-evolution: skill catalog unavailable: ${error?.message ?? error}`)
      return []
    }
  }

  async listCatalog() {
    const projectSkills = await this.listProjectSkills()
    const projectNames = new Set(projectSkills.map((skill) => skill.name))
    const native = await this.nativeCatalog()
    const globals = []
    for (const skill of native) {
      if (projectNames.has(skill.name)) continue
      if (skill.source === 'project-dsh' || skill.source === 'project-agents') continue
      globals.push({
        name: skill.name,
        description: skill.description,
        whenToUse: skill.whenToUse ?? '',
        path: skill.path,
        relativePath: undefined,
        scope: 'global',
        source: skill.source,
        provider: skill.provider,
        createdBy: '',
        confidence: '',
        evidenceScore: 0,
        enabled: skill.invocation.modelInvocable,
        bytes: undefined,
        modified: undefined,
      })
    }
    return {
      project: projectSkills,
      global: globals.sort((left, right) => left.name.localeCompare(right.name)),
    }
  }

  async findProjectSkill(name) {
    if (!isValidSkillName(name)) return undefined
    const rows = await this.listProjectSkills()
    return rows.find((row) => row.name === name)
  }

  async readSkill(name) {
    if (!isValidSkillName(name)) throw new Error('Invalid skill name.')
    const project = await this.findProjectSkill(name)
    if (project) {
      const content = await readFile(project.path, 'utf8')
      return { ...project, content, metadata: skillMetadata(content, name) }
    }
    try {
      const definition = await this.ctx.skills.get(name, { cwd: this.project.sessionCwd })
      if (definition) {
        return {
          name: definition.name,
          description: definition.description,
          whenToUse: definition.whenToUse ?? '',
          path: definition.path,
          relativePath: undefined,
          scope: 'global',
          source: definition.source,
          provider: definition.provider,
          enabled: definition.invocation.modelInvocable,
          content: definition.content,
          metadata: skillMetadata(definition.content, name),
        }
      }
    } catch (error) {
      this.logger?.warn?.(`project-evolution: skill read failed: ${error?.message ?? error}`)
    }
    return undefined
  }

  async ensureSkillDir(name) {
    if (!isValidSkillName(name)) throw new Error('Invalid skill name.')
    const dir = join(this.skillsDir, name)
    assertInside(this.project.root, dir, 'skill directory')
    await ensureDir(dir)
    return dir
  }

  /**
   * Project writes go through `ctx.fs` when present, so the harness sandbox
   * policy decides. Directory creation is limited to the project's own
   * `.dsh/skills` tree.
   */
  async writeProjectSkill(name, content, sessionId) {
    const existing = await this.findProjectSkill(name)
    const flat = existing && basename(existing.path) !== 'SKILL.md'
    const file = flat ? existing.path : join(await this.ensureSkillDir(name), 'SKILL.md')
    assertInside(this.project.root, file, 'skill file')
    const fs = typeof this.ctx.get === 'function' ? this.ctx.get('fs') : this.ctx.fs
    if (fs && typeof fs.resolve === 'function') {
      const target = await fs.resolve(file)
      await fs.writeText(target, content, undefined, undefined, {
        mode: 'workspace-write',
        workspaceRoot: this.project.sessionCwd,
        additionalWritableRoots: [this.project.root],
        sessionId,
      })
    } else {
      await atomicWrite(file, content)
    }
    return file
  }

  async currentSkillContent(name) {
    const skill = await this.findProjectSkill(name)
    if (!skill) return ''
    return readFile(skill.path, 'utf8')
  }

  async propose({ name, content, reason, signals, kind = 'create', source = 'manual', sessionId, allowAutoAccept = true }) {
    const finalName = name || proposedSkillName(signals?.title ?? 'project-workflow', (await this.listProjectSkills()).map((skill) => skill.name))
    if (!isValidSkillName(finalName)) throw new Error(`Invalid skill name "${finalName}".`)
    const oldContent = await this.currentSkillContent(finalName)
    // Never persist raw secret material, even in a blocked proposal. The
    // checks below run on the redacted artifact and record the redactions.
    const maskedContent = maskSecrets(String(content ?? ''))
    const contentForStore = maskedContent.text
    const maskedBaseline = maskSecrets(oldContent)
    const validation = validateSkillContent(contentForStore, finalName)
    if (maskedContent.redactions.length > 0) {
      validation.errors.push(`Secret material was redacted before storage (${maskedContent.redactions.join(', ')}).`)
      validation.ok = false
    }
    const security = securitySummary(contentForStore)
    if (maskedContent.redactions.length > 0) {
      security.redactions = [...new Set([...security.redactions, ...maskedContent.redactions])]
      if (security.severity === 'none') security.severity = 'high'
    }
    const cases = signals ? buildBacktestCases(signals) : []
    const baseline = evaluateBacktest(maskedBaseline.text, cases)
    const candidate = evaluateBacktest(contentForStore, cases)
    const improvement = oldContent ? candidate.score > baseline.score : candidate.score > 0
    const tests = {
      status: candidate.status,
      baseline: oldContent ? baseline : { ...baseline, status: 'BASELINE_MISSING', score: 0, note: 'New skill; no previous version existed.' },
      candidate,
      improvement,
      cases: cases.length,
      note: cases.length === 0
        ? 'Not tested: no safe evidence case could be extracted. Manual review is required and auto-accept is disabled.'
        : `Evidence replay: baseline ${baseline.score}%, candidate ${candidate.score}%.`,
    }
    const checks = [
      { id: 'format', label: 'SKILL.md format', status: validation.ok ? 'PASS' : 'FAIL', details: validation.errors },
      { id: 'security', label: 'Secret and prompt-injection scan', status: security.severity === 'high' ? 'FAIL' : 'PASS', details: security },
      { id: 'scope', label: 'Project scope confinement', status: 'PASS', details: [`.dsh/skills/${finalName}/SKILL.md`] },
      { id: 'backtest', label: 'Evidence-replay backtest', status: tests.status, details: tests.note },
    ]
    const fatal = checks.some((check) => check.id !== 'backtest' && check.status === 'FAIL')
    const diff = unifiedDiff(maskedBaseline.text, contentForStore, `project:${finalName}@current`, `project:${finalName}@proposed`)
    const now = nowIso()
    const revision = 1
    const proposal = {
      id: `pr_${shortHash(`${finalName}:${now}:${contentForStore}`, 16)}`,
      revision,
      kind: oldContent ? 'update' : kind,
      skill: finalName,
      status: fatal ? 'blocked' : 'proposed',
      source,
      reason: truncate(maskSecrets(reason || 'Extracted from a verified project turn.').text, 1_000),
      createdAt: now,
      updatedAt: now,
      sessionId: sessionId ?? signals?.sessionId,
      sourceFingerprint: signals?.fingerprint,
      evidenceScore: signals?.evidenceScore ?? 0,
      confidence: signals?.confidence ?? 'observed',
      baseline: { exists: Boolean(oldContent), hash: oldContent ? sha256(oldContent) : null, content: maskedBaseline.text },
      candidate: { hash: sha256(contentForStore), content: contentForStore },
      diff,
      checks,
      tests,
      security,
      validation,
      applied: null,
    }
    await this.store.saveProposal(proposal)
    await this.store.updateState((state) => {
      state.statistics.proposals = (state.statistics.proposals ?? 0) + 1
      state.lastProposalAt = now
    })
    if (allowAutoAccept && !fatal && this.config.autoAccept && this.config.requireTestsForAutoAccept && tests.status === 'PASS' && tests.improvement) {
      return this.apply(proposal.id, { expectedRevision: revision, actor: 'auto', sessionId })
    }
    return { proposal, autoAccepted: false }
  }

  async apply(id, { expectedRevision, actor = 'user', sessionId } = {}) {
    const proposal = await this.store.getProposal(id)
    if (!proposal) throw new Error('Proposal not found.')
    if (expectedRevision !== undefined && Number(expectedRevision) !== proposal.revision) {
      const error = new Error('Proposal changed since it was read. Refresh and review the new revision.')
      error.code = 'REVISION_CONFLICT'
      throw error
    }
    if (proposal.status === 'accepted') return { proposal, alreadyApplied: true }
    if (proposal.status === 'rejected' || proposal.status === 'rolled-back') {
      throw new Error(`Proposal is ${proposal.status}.`)
    }
    if (proposal.status === 'blocked') throw new Error('Proposal is blocked by a failed required check.')
    if (proposal.tests?.status === 'FAIL') throw new Error('Proposal backtest failed. Fix the candidate before applying.')
    if (proposal.validation && !proposal.validation.ok) throw new Error('Proposal failed SKILL.md validation.')
    if (proposal.security?.severity === 'high') throw new Error('Proposal failed the security scan.')

    const current = await this.currentSkillContent(proposal.skill)
    const currentHash = current ? sha256(current) : null
    if (proposal.baseline?.hash && proposal.baseline.hash !== currentHash) {
      const error = new Error('Skill changed after the proposal was created. Create a fresh proposal.')
      error.code = 'BASELINE_CONFLICT'
      throw error
    }
    if (!proposal.baseline?.hash && current) {
      const error = new Error('Skill now exists; the create proposal is stale. Create a fresh proposal.')
      error.code = 'BASELINE_CONFLICT'
      throw error
    }

    let beforeVersion = null
    if (current) {
      beforeVersion = await this.store.saveVersion({
        skill: proposal.skill,
        content: current,
        diff: unifiedDiff('', current, '/dev/null', `project:${proposal.skill}@before`),
        metadata: { reason: `before ${proposal.id}`, proposalId: proposal.id },
      })
    }
    const file = await this.writeProjectSkill(proposal.skill, proposal.candidate.content, sessionId)
    const afterVersion = await this.store.saveVersion({
      skill: proposal.skill,
      content: proposal.candidate.content,
      diff: proposal.diff,
      metadata: { reason: proposal.reason, proposalId: proposal.id, actor },
    })
    const now = nowIso()
    const next = {
      ...proposal,
      revision: proposal.revision + 1,
      status: 'accepted',
      updatedAt: now,
      applied: {
        at: now,
        actor,
        file,
        beforeVersion: beforeVersion?.version ?? null,
        afterVersion: afterVersion.version,
        contentHash: proposal.candidate.hash,
      },
    }
    await this.store.saveProposal(next)
    await this.store.updateState((state) => {
      state.statistics.accepted = (state.statistics.accepted ?? 0) + 1
      if (state.statistics.accepted > 0) state.statistics.lastAcceptedAt = now
    })
    await this.store.saveRun({
      kind: 'apply',
      proposalId: id,
      skill: proposal.skill,
      status: 'PASS',
      actor,
      file,
      beforeVersion: beforeVersion?.version ?? null,
      afterVersion: afterVersion.version,
      createdAt: now,
    })
    return { proposal: next, file, beforeVersion, afterVersion }
  }

  async reject(id, { expectedRevision, reason } = {}) {
    const proposal = await this.store.getProposal(id)
    if (!proposal) throw new Error('Proposal not found.')
    if (expectedRevision !== undefined && Number(expectedRevision) !== proposal.revision) {
      const error = new Error('Proposal changed since it was read.')
      error.code = 'REVISION_CONFLICT'
      throw error
    }
    const next = {
      ...proposal,
      revision: proposal.revision + 1,
      status: 'rejected',
      updatedAt: nowIso(),
      rejectionReason: truncate(reason || 'Rejected by user.', 500),
    }
    await this.store.saveProposal(next)
    await this.store.updateState((state) => {
      state.statistics.rejected = (state.statistics.rejected ?? 0) + 1
    })
    return next
  }

  async rollback(skill, version, { actor = 'user', sessionId } = {}) {
    if (!isValidSkillName(skill)) throw new Error('Invalid skill name.')
    if (!VERSION_NAME.test(String(version ?? ''))) throw new Error('Invalid version id.')
    const record = await this.store.getVersion(skill, version)
    if (!record) throw new Error('Version not found.')
    const current = await this.currentSkillContent(skill)
    if (!current) throw new Error('Skill file is missing; cannot roll back in place.')
    const snapshot = await this.store.saveVersion({
      skill,
      content: current,
      diff: unifiedDiff(record.content, current, `project:${skill}@${version}`, `project:${skill}@current`),
      metadata: { reason: `rollback snapshot before ${version}`, actor },
    })
    await this.writeProjectSkill(skill, record.content, sessionId)
    await this.store.updateState((state) => {
      state.statistics.rollbacks = (state.statistics.rollbacks ?? 0) + 1
    })
    const run = await this.store.saveRun({
      kind: 'rollback',
      skill,
      version,
      snapshot: snapshot.version,
      status: 'PASS',
      actor,
      createdAt: nowIso(),
    })
    return { skill, version, snapshot: snapshot.version, run }
  }

  async setEnabled(name, enabled, { sessionId } = {}) {
    const skill = await this.readSkill(name)
    if (!skill || skill.scope !== 'project') throw new Error('Only project skills can be toggled here.')
    const parsed = parseFrontmatter(skill.content)
    const data = { ...parsed.data }
    if (enabled) delete data['disable-model-invocation']
    else data['disable-model-invocation'] = 'true'
    const content = `${renderFrontmatter(data)}${parsed.body}`
    await this.writeProjectSkill(name, content, sessionId)
    const version = await this.store.saveVersion({
      skill: name,
      content,
      diff: unifiedDiff(skill.content, content, `project:${name}@current`, `project:${name}@${enabled ? 'enabled' : 'disabled'}`),
      metadata: { reason: enabled ? 'enable' : 'disable' },
    })
    return { name, enabled, version }
  }

  async archive(name, { sessionId } = {}) {
    const skill = await this.readSkill(name)
    if (!skill || skill.scope !== 'project') throw new Error('Only project skills can be archived here.')
    if (skill.metadata?.created_by !== 'project-evolution') {
      throw new Error('Refusing to archive a project skill not created by project-evolution. Use the native skill manager for manual skills.')
    }
    await ensureDir(this.archiveDir)
    const stamp = nowIso().replace(/[:.]/g, '-')
    const source = skill.path
    assertInside(this.project.root, source, 'skill file')
    // Native DSH supports both `<name>/SKILL.md` and `<name>.md`. Archive only
    // the skill itself; a flat file must never cause the whole skills root to
    // be renamed.
    const isDirectorySkill = basename(source) === 'SKILL.md'
    const extension = isDirectorySkill ? '' : '.md'
    const destination = join(this.archiveDir, `${name}-${stamp}${extension}`)
    assertInside(this.project.root, destination, 'archive destination')
    await rename(source, destination)
    await this.store.saveRun({
      kind: 'archive',
      skill: name,
      destination,
      status: 'PASS',
      actor: 'user',
      createdAt: nowIso(),
    })
    return { name, destination }
  }

  async publishGlobal(name, { confirm = false, overwrite = false } = {}) {
    if (!confirm) throw new Error('Global publication requires explicit confirmation.')
    if (!this.config.globalPublishAllowed) throw new Error('Global publication is disabled in Settings.')
    if (!this.dshHome) throw new Error('DSH_HOME is unavailable; cannot locate the global skill root.')
    const skill = await this.readSkill(name)
    if (!skill || skill.scope !== 'project') throw new Error('Only a project skill can be published globally.')
    const validation = validateSkillContent(skill.content, name)
    if (!validation.ok) throw new Error('Refusing to publish an invalid skill.')
    const targetDir = join(this.dshHome, 'skills', name)
    const targetFile = join(targetDir, 'SKILL.md')
    const exists = await readFile(targetFile, 'utf8').then(() => true).catch(() => false)
    if (exists && !overwrite) throw new Error('A global skill with this name already exists. Explicit overwrite is required.')
    await ensureDir(targetDir)
    await atomicWrite(targetFile, skill.content)
    await this.store.saveRun({
      kind: 'publish-global',
      skill: name,
      target: targetFile,
      overwritten: exists,
      status: 'PASS',
      actor: 'user',
      createdAt: nowIso(),
    })
    return { name, target: targetFile, overwritten: exists }
  }

  async listVersions(name) {
    if (!isValidSkillName(name)) throw new Error('Invalid skill name.')
    const rows = await this.store.listVersions(name)
    return rows.map((row) => ({
      version: row.version,
      createdAt: row.createdAt,
      metadata: row.metadata,
      diff: row.diff,
      bytes: Buffer.byteLength(row.content, 'utf8'),
    }))
  }

  async getVersion(name, version) {
    if (!isValidSkillName(name)) throw new Error('Invalid skill name.')
    if (!VERSION_NAME.test(String(version ?? ''))) throw new Error('Invalid version id.')
    return this.store.getVersion(name, version)
  }

  async checksFor(name, content) {
    const validation = validateSkillContent(content, name)
    const security = securitySummary(content)
    return {
      validation,
      security,
      checks: [
        { id: 'format', label: 'SKILL.md format', status: validation.ok ? 'PASS' : 'FAIL', details: validation.errors },
        { id: 'security', label: 'Secret and prompt-injection scan', status: security.severity === 'high' ? 'FAIL' : 'PASS', details: security },
      ],
    }
  }

  async proposeEdit(name, content, { reason, sessionId } = {}) {
    const existing = await this.findProjectSkill(name)
    if (!existing) throw new Error('Project skill not found.')
    return this.propose({
      name,
      content,
      reason: reason || 'Manual edit from Project Evolution.',
      kind: 'update',
      source: 'editor',
      sessionId,
      allowAutoAccept: false,
    })
  }

  async exportSkill(name) {
    const skill = await this.readSkill(name)
    if (!skill) throw new Error('Skill not found.')
    return {
      name: skill.name,
      scope: skill.scope,
      content: skill.content,
      description: skill.description,
      bytes: Buffer.byteLength(skill.content, 'utf8'),
    }
  }
}
