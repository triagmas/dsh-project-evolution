import assert from 'node:assert/strict'
import test from 'node:test'

test('client bundle registers the conversation view and global settings section with EN/RU dictionaries', async () => {
  let definition
  globalThis.window = {
    __ModuleLoader__: { load(value) { definition = value } },
    location: { origin: 'http://127.0.0.1:3080' },
  }
  const React = {
    createElement() { return null },
    Fragment: Symbol('Fragment'),
    useState(value) { return [value, () => {}] },
    useEffect() {},
    useMemo(factory) { return factory() },
    useCallback(factory) { return factory },
    useRef(value) { return { current: value } },
  }
  await import(`../client.js?test=${Date.now()}`)
  assert.equal(definition.id, 'dsh-project-evolution')
  const module = definition.factory(() => React)
  assert.deepEqual(module.inject, ['slots', 'locale'])
  let dictionaries
  const registrations = []
  const renderers = []
  const ctx = {
    effect(callback) { return callback() },
    locale: {
      register(namespace, value) { dictionaries = { namespace, value }; return () => {} },
      bind() { return (key) => key },
      getSnapshot() { return { active: 'en', revision: 0 } },
      subscribe() { return () => {} },
    },
    slots: {
      inject(name, callback) { callback() },
      register(options, renderer) { registrations.push(options); renderers.push(renderer); return () => {} },
    },
  }
  assert.doesNotThrow(() => module.apply(ctx))
  assert.equal(dictionaries.namespace, 'projectEvolution')
  const bySlot = Object.fromEntries(registrations.map((registration) => [registration.name, registration]))
  assert.deepEqual(Object.keys(bySlot).sort(), ['conversation.view', 'settings.section'])
  assert.equal(bySlot['conversation.view'].id, 'project-evolution')
  assert.equal(bySlot['conversation.view'].order, 40)
  assert.equal(typeof bySlot['conversation.view'].label, 'function')
  assert.equal(bySlot['settings.section'].id, 'project-evolution')
  assert.equal(bySlot['settings.section'].order, 35)
  assert.equal(typeof bySlot['settings.section'].label, 'function')
  assert.equal(renderers.length, 2)
  assert.equal(renderers.every((renderer) => typeof renderer === 'function'), true)
  const en = Object.keys(dictionaries.value.en).sort()
  const ru = Object.keys(dictionaries.value.ru).sort()
  assert.deepEqual(ru, en)
  assert.ok(en.includes('tabs.overview'))
  assert.ok(en.includes('nav.conversation'))
  assert.equal(dictionaries.value.en['nav.conversation'], 'Evolution')
  assert.equal(dictionaries.value.ru['nav.conversation'], 'Эволюция')
  assert.ok(en.includes('evolution.acceptConfirm'))
})
