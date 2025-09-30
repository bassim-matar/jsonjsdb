import { describe, it, expect, beforeEach } from 'vitest'
import Jsonjsdb from '../src/Jsonjsdb'
import Loader from '../src/Loader'

describe('Loader', () => {
  const dbKey = 'gdf9898fds'
  const path = 'test/db/' + dbKey
  let loader: Loader

  beforeEach(() => {
    const db = new Jsonjsdb({ dbKey, path: 'test/db' })
    loader = db.loader
  })

  describe('load_jsonjs()', () => {
    it('should load records without throwing an error', async () => {
      const users = await loader.loadJsonjs(path, 'user')
      expect(users).toBeInstanceOf(Array)
      expect(users.length).toBeGreaterThan(0)
      expect(users[0]).toHaveProperty('id')
    })
  })

  describe('load()', () => {
    it('should load db tables', async () => {
      await loader.load(path)
      expect(loader.db).toBeTypeOf('object')
      expect(Object.keys(loader.db).length).toBeGreaterThan(0)
    })

    it('should load db tables with cache', async () => {
      await loader.load(path, true)
      expect(loader.db).toBeTypeOf('object')
      expect(Object.keys(loader.db).length).toBeGreaterThan(0)
    })
  })

  describe('add_meta()', () => {
    it('should add metadata', async () => {
      await loader.load(path)
      await loader.addMeta()
      expect(loader.db).toHaveProperty('metaFolder')
      expect(loader.db).toHaveProperty('metaDataset')
      expect(loader.db).toHaveProperty('metaVariable')
    })
  })

  describe('arrayToObject()', () => {
    it('should convert matrix data into objects', async () => {
      await loader.load(path)
      const arrayToObject = (loader as any).arrayToObject.bind(loader)

      const result = arrayToObject([
        ['id', 'name', 'age'],
        [1, 'Alice', 30],
        [2, 'Bob'],
      ])

      expect(result).toEqual([
        { id: 1, name: 'Alice', age: 30 },
        { id: 2, name: 'Bob' },
      ])
    })
  })

  describe('HTML escaping', () => {
    it('should escape HTML entities in arrayToObject by default', async () => {
      await loader.load(path)
      const arrayToObject = (loader as any).arrayToObject.bind(loader)

      const result = arrayToObject([
        ['id', 'content', 'description'],
        [1, '<script>alert("xss")</script>', 'Test & Demo'],
        [2, 'Hello <b>World</b>', 'Price: $10 > $5'],
      ])

      expect(result).toEqual([
        {
          id: 1,
          content: '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;',
          description: 'Test &amp; Demo',
        },
        {
          id: 2,
          content: 'Hello &lt;b&gt;World&lt;/b&gt;',
          description: 'Price: $10 &gt; $5',
        },
      ])
    })

    it('should not escape HTML when escapeHtml option is false', async () => {
      await loader.load(path, false, { escapeHtml: false })
      const arrayToObject = (loader as any).arrayToObject.bind(loader)

      const result = arrayToObject(
        [
          ['id', 'content'],
          [1, '<script>alert("xss")</script>'],
          [2, 'Hello <b>World</b>'],
        ],
        false,
      )

      expect(result).toEqual([
        { id: 1, content: '<script>alert("xss")</script>' },
        { id: 2, content: 'Hello <b>World</b>' },
      ])
    })

    it('should escape HTML in applyEscapeHtml by default', async () => {
      await loader.load(path)
      const applyEscapeHtml = (loader as any).applyEscapeHtml.bind(loader)

      const result = applyEscapeHtml([
        {
          id: 1,
          content: '<script>alert("xss")</script>',
          name: 'Test & Demo',
        },
        { id: 2, content: 'Hello <b>World</b>', name: 'Price: $10 > $5' },
      ])

      expect(result).toEqual([
        {
          id: 1,
          content: '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;',
          name: 'Test &amp; Demo',
        },
        {
          id: 2,
          content: 'Hello &lt;b&gt;World&lt;/b&gt;',
          name: 'Price: $10 &gt; $5',
        },
      ])
    })

    it('should not escape HTML in applyEscapeHtml when escapeHtml option is false', async () => {
      await loader.load(path, false, { escapeHtml: false })
      const applyEscapeHtml = (loader as any).applyEscapeHtml.bind(loader)

      const result = applyEscapeHtml(
        [
          { id: 1, content: '<script>alert("xss")</script>' },
          { id: 2, content: 'Hello <b>World</b>' },
        ],
        false,
      )

      expect(result).toEqual([
        { id: 1, content: '<script>alert("xss")</script>' },
        { id: 2, content: 'Hello <b>World</b>' },
      ])
    })

    it('should not escape non-string values', async () => {
      await loader.load(path)
      const arrayToObject = (loader as any).arrayToObject.bind(loader)

      const result = arrayToObject([
        ['id', 'count', 'active', 'data'],
        [1, 42, true, null],
        [2, 100, false, undefined],
      ])

      expect(result).toEqual([
        { id: 1, count: 42, active: true, data: null },
        { id: 2, count: 100, active: false, data: undefined },
      ])
    })

    it('should handle empty arrays', async () => {
      await loader.load(path)
      const applyEscapeHtml = (loader as any).applyEscapeHtml.bind(loader)

      const result = applyEscapeHtml([])
      expect(result).toEqual([])
    })
  })
})
