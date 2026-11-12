/**
 * Authenticated exact Fetch routes for the Project Evolution settings page.
 * These routes live below `/api`, are owner-only through DSH Connection, and
 * never accept an arbitrary filesystem path from the browser: the session id
 * is resolved against `ctx.sessions`.
 */
import { nowIso } from './util.js'

const PREFIX = '/api/project-evolution'

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
    },
  })
}

function errorBody(error, fallbackStatus = 500) {
  const status = error?.status ?? (error?.code === 'REVISION_CONFLICT' || error?.code === 'BASELINE_CONFLICT' ? 409 : fallbackStatus)
  return {
    status,
    body: {
      ok: false,
      error: {
        code: error?.code ?? 'INTERNAL',
        message: error?.message ?? String(error),
      },
      at: nowIso(),
    },
  }
}

const MAX_BODY_BYTES = 1_000_000

function bodyTooLarge() {
  const error = new Error('Request body is too large.')
  error.code = 'BODY_TOO_LARGE'
  error.status = 413
  return error
}

async function readBoundedBody(request) {
  const declared = Number(request.headers.get('content-length'))
  if (Number.isFinite(declared) && declared > MAX_BODY_BYTES) throw bodyTooLarge()
  if (!request.body) return ''
  const reader = request.body.getReader()
  const chunks = []
  let total = 0
  try {
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      total += value.byteLength
      if (total > MAX_BODY_BYTES) {
        await reader.cancel().catch(() => {})
        throw bodyTooLarge()
      }
      chunks.push(value)
    }
  } finally {
    reader.releaseLock?.()
  }
  return new TextDecoder().decode(Buffer.concat(chunks.map((chunk) => Buffer.from(chunk))))
}

async function bodyOf(request) {
  if (request.method !== 'POST') return {}
  const text = await readBoundedBody(request)
  if (!text.trim()) return {}
  try {
    const parsed = JSON.parse(text)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    const error = new Error('Request body must be valid JSON.')
    error.code = 'BAD_JSON'
    error.status = 400
    throw error
  }
}

export function createRoutes(service, logger = console) {
  return [
    {
      path: `${PREFIX}/overview`,
      methods: ['GET'],
      requestBody: 'buffered',
      async fetch(request) {
        try {
          const url = new URL(request.url)
          return json(await service.overview(url.searchParams.get('sessionId') ?? undefined))
        } catch (error) {
          logger?.warn?.(`project-evolution overview: ${error?.message ?? error}`)
          const failure = errorBody(error)
          return json(failure.body, failure.status)
        }
      },
    },
    {
      path: `${PREFIX}/knowledge`,
      methods: ['GET'],
      requestBody: 'buffered',
      async fetch(request) {
        try {
          const url = new URL(request.url)
          const rows = await service.knowledge(
            url.searchParams.get('sessionId') ?? undefined,
            url.searchParams.get('query') ?? '',
          )
          return json({ ok: true, knowledge: rows })
        } catch (error) {
          const failure = errorBody(error)
          return json(failure.body, failure.status)
        }
      },
    },
    {
      path: `${PREFIX}/skill`,
      methods: ['GET'],
      requestBody: 'buffered',
      async fetch(request) {
        try {
          const url = new URL(request.url)
          const { store, project } = await service.storeFor(url.searchParams.get('sessionId') ?? undefined)
          const name = url.searchParams.get('name') ?? ''
          const skill = await store.skills.readSkill(name)
          if (!skill) return json({ ok: false, error: { code: 'NOT_FOUND', message: 'Skill not found.' } }, 404)
          const versions = await store.skills.listVersions(name)
          return json({ ok: true, project: project.root, skill, versions })
        } catch (error) {
          const failure = errorBody(error)
          return json(failure.body, failure.status)
        }
      },
    },
    {
      path: `${PREFIX}/versions`,
      methods: ['GET'],
      requestBody: 'buffered',
      async fetch(request) {
        try {
          const url = new URL(request.url)
          const { store } = await service.storeFor(url.searchParams.get('sessionId') ?? undefined)
          return json({ ok: true, versions: await store.skills.listVersions(url.searchParams.get('name') ?? '') })
        } catch (error) {
          const failure = errorBody(error)
          return json(failure.body, failure.status)
        }
      },
    },
    {
      path: `${PREFIX}/action`,
      methods: ['POST'],
      requestBody: 'buffered',
      async fetch(request) {
        try {
          const payload = await bodyOf(request)
          const sessionId = payload.sessionId ?? new URL(request.url).searchParams.get('sessionId') ?? undefined
          const result = await service.action(sessionId, payload)
          return json({ ok: true, result })
        } catch (error) {
          logger?.warn?.(`project-evolution action failed: ${error?.message ?? error}`)
          const failure = errorBody(error)
          return json(failure.body, failure.status)
        }
      },
    },
  ]
}

export async function registerRoutes(ctx, service, logger = console) {
  const connection = typeof ctx.get === 'function' ? ctx.get('connection') : ctx.connection
  if (!connection?.fetch?.register) {
    logger?.warn?.('project-evolution: connection.fetch is unavailable; Web settings API not mounted')
    return []
  }
  const disposers = []
  for (const route of createRoutes(service, logger)) {
    disposers.push(await connection.fetch.register(route))
  }
  return disposers
}
