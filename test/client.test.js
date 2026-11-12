import assert from 'node:assert/strict'
import test from 'node:test'

test('client bundle registers its settings section and ships EN/RU dictionaries', async () => {
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
  let section
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
      register(options) { section = options; return () => {} },
    },
  }
  assert.doesNotThrow(() => module.apply(ctx))
  assert.equal(dictionaries.namespace, 'projectEvolution')
  assert.equal(section.name, 'settings.section')
  assert.equal(section.id, 'project-evolution')
  assert.equal(section.order, 35)
  assert.equal(typeof section.label, 'function')
  const en = Object.keys(dictionaries.value.en).sort()
  const ru = Object.keys(dictionaries.value.ru).sort()
  assert.deepEqual(ru, en)
  assert.ok(en.includes('tabs.overview'))
  assert.ok(en.includes('evolution.acceptConfirm'))
})
