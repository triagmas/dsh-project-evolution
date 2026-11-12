/**
 * Host half of dsh-project-evolution.
 *
 * Surfaces:
 *  - one authenticated HTTP API for the settings page;
 *  - model tools for read/recall/record/propose (never apply);
 *  - a short prompt section establishing discovery and evidence discipline;
 *  - an `agent/turn-stopping` observer that writes bounded evidence and
 *    proposes reusable skills when the evidence is strong enough.
 *
 * All writes are local to `<project>/.dsh` or, after explicit confirmation,
 * `$DSH_HOME/skills`. There is no network service and no model call.
 */
import { homedir } from 'node:os'
import { join } from 'node:path'
import { EvolutionService } from './src/core/service.js'
import { registerRoutes } from './src/core/routes.js'
import { createTools } from './src/core/tools.js'
import { PLUGIN_ID } from './src/core/util.js'

export const name = PLUGIN_ID

export const inject = ['skills', 'sessions']

export async function apply(ctx, config = {}) {
  const logger = ctx.logger ?? console
  const dshHome = process.env.DSH_HOME || join(homedir(), '.dsh')
  const service = new EvolutionService({
    ctx,
    config,
    logger,
    dshHome,
    projectRoot: config.projectRoot,
  })

  // Optional services are read through `ctx.get` rather than injected, so the
  // plugin still activates in profiles without a Web transport or tool registry.
  const lookup = (key) => (typeof ctx.get === 'function' ? ctx.get(key) : ctx[key])
  const cleanups = []

  // `connection` is an optional Web transport in DSH. It may still be
  // activating when this plugin applies, so register the API reactively
  // instead of sampling it once and silently losing the routes.
  if (typeof ctx.inject === 'function') {
    ctx.inject(['connection'], (connectionCtx) => {
      void registerRoutes(connectionCtx, service, logger)
        .then((disposers) => cleanups.push(...disposers))
        .catch((error) => logger?.warn?.(`project-evolution: route registration failed: ${error?.message ?? error}`))
    })
  } else {
    const routeDisposers = await registerRoutes(ctx, service, logger)
    for (const dispose of routeDisposers) cleanups.push(dispose)
  }

  const tools = lookup('tools')
  if (tools?.register) {
    for (const definition of createTools(service)) {
      cleanups.push(tools.register(definition))
    }
  }

  const systemPrompt = lookup('systemPrompt')
  if (systemPrompt?.section) {
    cleanups.push(systemPrompt.section({
      name: 'project-evolution:discipline',
      order: 152,
      text: service.disciplineSection(),
    }))
  }

  if (typeof ctx.on === 'function') {
    const off = ctx.on('agent/turn-stopping', async (payload) => {
      try {
        await service.captureTurn({
          agent: payload?.agent,
          turn: payload?.turn,
          signal: payload?.signal,
          events: payload?.agent?.session?.snapshotEvents?.() ?? [],
        })
      } catch (error) {
        logger?.warn?.(`project-evolution: turn listener failed: ${error?.message ?? error}`)
      }
    })
    cleanups.push(off)
  }

  ctx.effect(() => {
    logger?.info?.(`${PLUGIN_ID}: ready (project-isolated evidence, manual acceptance by default)`)
    return () => {
      for (const dispose of cleanups.reverse()) {
        try {
          const result = dispose()
          if (result && typeof result.catch === 'function') result.catch(() => {})
        } catch {
          // Disposal is best-effort during unload.
        }
      }
    }
  }, `${PLUGIN_ID}: surfaces`)
}

export { EvolutionService }
export { ProjectStore, DEFAULT_CONFIG } from './src/core/store.js'
export { SkillManager } from './src/core/skills.js'
export { extractTurnSignals, knowledgeFromSignals, buildBacktestCases, evaluateBacktest } from './src/core/analyzer.js'
export { resolveProject } from './src/core/project.js'
export { maskSecrets, validateSkillContent, scanInjection } from './src/core/security.js'
