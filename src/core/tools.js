/**
 * Model-facing tools. They are read/propose only by design: accepting,
 * rolling back, publishing, archiving, and editing are user actions in the
 * Web UI. A model can collect and propose experience, but cannot
 * silently rewrite its own skills.
 */
import { truncate } from './util.js'

function tool(name, description, parameters, execute) {
  const properties = {}
  const required = []
  for (const [key, spec] of Object.entries(parameters)) {
    properties[key] = { type: spec.type ?? 'string', description: spec.description ?? '' }
    if (spec.enum) properties[key].enum = spec.enum
    if (spec.required) required.push(key)
  }
  return {
    name,
    description,
    parameters: { type: 'object', properties, required },
    output: {
      schema: { type: 'string' },
      render: (_args, value) => [{ type: 'text', text: typeof value === 'string' ? value : JSON.stringify(value, null, 2) }],
    },
    async execute(args, exec) {
      try {
        return await execute(args ?? {}, exec)
      } catch (error) {
        return `${name} failed: ${truncate(error?.message ?? String(error), 800)}`
      }
    },
  }
}

export function createTools(service) {
  return [
    tool('project_evolution_status', 'Show the current project, project skills, pending Project Evolution proposals, storage limits, and recent verification runs. Read-only.', {}, async (_args, exec) => {
      const overview = await service.statusForAgent(exec?.agent)
      return JSON.stringify({
        project: overview.project,
        counts: overview.status.counts,
        config: {
          autoAnalyze: overview.config.autoAnalyze,
          autoAccept: overview.config.autoAccept,
          maxAnalysesPerDay: overview.config.maxAnalysesPerDay,
          maxModelCallsPerDay: overview.config.maxModelCallsPerDay,
        },
        skills: overview.catalog.project.map((skill) => ({
          name: skill.name,
          description: skill.description,
          enabled: skill.enabled,
          evidenceScore: skill.evidenceScore,
          confidence: skill.confidence,
        })),
        pendingProposals: overview.proposals.filter((proposal) => proposal.status === 'proposed').map((proposal) => ({
          id: proposal.id,
          revision: proposal.revision,
          skill: proposal.skill,
          reason: proposal.reason,
          backtest: proposal.tests?.status,
        })),
        lastRuns: overview.runs.map((run) => ({ kind: run.kind, skill: run.skill, status: run.status, createdAt: run.createdAt })),
      }, null, 2)
    }),

    tool('project_evolution_recall', 'Recall project-specific verified experience and matching project skills before a complex task. Returns evidence marked untrusted; load a matching skill with the skill tool.', {
      query: { type: 'string', description: 'Short task description or keywords.' },
      limit: { type: 'number', description: 'Maximum rows (default 8, max 20).' },
    }, async (args, exec) => {
      const sessionId = exec?.agent?.session?.id
      const result = await service.recall(sessionId, String(args.query ?? ''), Math.min(20, Math.max(1, Number(args.limit) || 8)))
      return JSON.stringify(result, null, 2)
    }),

    tool('project_evolution_propose', 'Create a reviewable skill proposal from the last verified turn, or from an explicit skill draft. This DOES NOT write or apply a skill; the user reviews and accepts it in the Project Evolution conversation tab.', {
      name: { type: 'string', description: 'Optional skill name (lowercase kebab-case). Omit to derive one.' },
      reason: { type: 'string', description: 'Why this procedure is reusable.' },
      content: { type: 'string', description: 'Optional complete SKILL.md draft. Omit to extract from the last turn.' },
    }, async (args, exec) => {
      const sessionId = exec?.agent?.session?.id
      const result = await service.proposeManual(sessionId, {
        name: args.name,
        reason: args.reason,
        content: args.content,
      })
      const proposal = result.proposal
      return JSON.stringify({
        proposalId: proposal.id,
        revision: proposal.revision,
        skill: proposal.skill,
        status: proposal.status,
        backtest: proposal.tests?.status,
        score: proposal.tests?.candidate?.score,
        checks: proposal.checks?.map((check) => ({ id: check.id, status: check.status })),
        diff: proposal.diff,
        next: 'User reviews this proposal in the Project Evolution conversation tab. Nothing was applied.',
      }, null, 2)
    }),

    tool('project_evolution_record', 'Record one explicit project decision, pitfall, correction, or verified fact in the isolated project knowledge base. Secrets are masked; prompt-injection markers are flagged. Use sparingly and never store credentials.', {
      title: { type: 'string', required: true, description: 'Short decision or fact title.' },
      content: { type: 'string', required: true, description: 'Concrete evidence and context.' },
      kind: { type: 'string', enum: ['decision', 'pitfall', 'correction', 'solution', 'note'], description: 'Knowledge kind.' },
      tags: { type: 'string', description: 'Comma-separated tags.' },
      confidence: { type: 'string', enum: ['observed', 'confirmed'], description: 'Confirmed only with executed evidence.' },
    }, async (args, exec) => {
      if (!(await service.enabled())) return JSON.stringify({ ok: false, error: 'Project Evolution is disabled in Settings.' })
      const row = await service.recordNote(exec?.agent?.session?.id, {
        title: args.title,
        content: args.content,
        kind: args.kind,
        tags: String(args.tags ?? '').split(',').map((tag) => tag.trim()).filter(Boolean),
        confidence: args.confidence,
      })
      return JSON.stringify({
        ok: true,
        knowledge: row.entry ? { id: row.entry.id, created: row.created, confidence: row.entry.confidence, untrusted: row.entry.untrusted } : row,
      }, null, 2)
    }),
  ]
}
