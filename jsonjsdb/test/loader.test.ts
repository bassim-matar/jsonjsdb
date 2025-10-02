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

  describe('standardizeId()', () => {
    it('should not modify valid IDs', async () => {
      const standardizeId = (loader as any).standardizeId.bind(loader)

      expect(standardizeId('user123')).toBe('user123')
      expect(standardizeId('abc-def')).toBe('abc-def')
      expect(standardizeId('abc_def')).toBe('abc_def')
      expect(standardizeId('abc,def')).toBe('abc,def')
      expect(standardizeId('ABC123')).toBe('ABC123')
    })

    it('should remove invalid characters from IDs', async () => {
      const standardizeId = (loader as any).standardizeId.bind(loader)

      expect(standardizeId('user@123')).toBe('user123')
      expect(standardizeId('user 123')).toBe('user123')
      expect(standardizeId('user#123')).toBe('user123')
      expect(standardizeId('user$123')).toBe('user123')
      expect(standardizeId('user!@#$123')).toBe('user123')
    })

    it('should remove whitespace characters', async () => {
      const standardizeId = (loader as any).standardizeId.bind(loader)

      expect(standardizeId(' user123 ')).toBe('user123')
      expect(standardizeId('user\t123')).toBe('user123')
      expect(standardizeId('user\n123')).toBe('user123')
      expect(standardizeId('A B C')).toBe('ABC')
    })

    it('should handle custom validIdChars configuration', async () => {
      const db = new Jsonjsdb({
        dbKey,
        path: 'test/db',
        validIdChars: 'a-z0-9',
      })
      const customLoader = db.loader
      const standardizeId = (customLoader as any).standardizeId.bind(
        customLoader,
      )

      expect(standardizeId('abc123')).toBe('abc123')
      expect(standardizeId('ABC123')).toBe('123')
      expect(standardizeId('user_id')).toBe('userid')
      expect(standardizeId('user-id')).toBe('userid')
    })
  })

  describe('arrayToObject() with ID standardization', () => {
    it('should standardize IDs in columns ending with _id', async () => {
      const arrayToObject = (loader as any).arrayToObject.bind(loader)

      const result = arrayToObject(
        [
          ['id', 'user_id', 'name'],
          ['usr@001', 'admin#123', 'Alice'],
          ['usr 002', 'user 456', 'Bob'],
        ],
        true,
      )

      expect(result).toEqual([
        { id: 'usr001', user_id: 'admin123', name: 'Alice' },
        { id: 'usr002', user_id: 'user456', name: 'Bob' },
      ])
    })

    it('should standardize IDs in columns ending with _ids', async () => {
      const arrayToObject = (loader as any).arrayToObject.bind(loader)

      const result = arrayToObject(
        [
          ['id', 'tag_ids', 'name'],
          ['1', 'tag@1,tag 2', 'Item 1'],
          ['2', 'tag#3', 'Item 2'],
        ],
        true,
      )

      expect(result).toEqual([
        { id: '1', tag_ids: 'tag1,tag2', name: 'Item 1' },
        { id: '2', tag_ids: 'tag3', name: 'Item 2' },
      ])
    })

    it('should not standardize non-ID columns', async () => {
      const arrayToObject = (loader as any).arrayToObject.bind(loader)

      const result = arrayToObject(
        [
          ['id', 'email', 'description'],
          ['1', 'user@example.com', 'Test #1'],
          ['2', 'admin@test.com', 'Item #2'],
        ],
        true,
      )

      expect(result).toEqual([
        { id: '1', email: 'user@example.com', description: 'Test #1' },
        { id: '2', email: 'admin@test.com', description: 'Item #2' },
      ])
    })

    it('should respect shouldStandardizeIds=false', async () => {
      const arrayToObject = (loader as any).arrayToObject.bind(loader)

      const result = arrayToObject(
        [
          ['id', 'user_id', 'name'],
          ['usr@001', 'admin#123', 'Alice'],
        ],
        false,
      )

      expect(result).toEqual([
        { id: 'usr@001', user_id: 'admin#123', name: 'Alice' },
      ])
    })
  })

  describe('applyTransform() with ID standardization', () => {
    it('should standardize IDs in object format data', async () => {
      const applyTransform = (loader as any).applyTransform.bind(loader)

      const data = [
        { id: 'usr@001', user_id: 'admin#123', name: 'Alice' },
        { id: 'usr 002', user_id: 'user 456', name: 'Bob' },
      ]

      const result = applyTransform(data, true)

      expect(result).toEqual([
        { id: 'usr001', user_id: 'admin123', name: 'Alice' },
        { id: 'usr002', user_id: 'user456', name: 'Bob' },
      ])
    })

    it('should handle parent_id field', async () => {
      const applyTransform = (loader as any).applyTransform.bind(loader)

      const data = [
        { id: 'cat@001', parent_id: 'cat 000', name: 'Subcategory' },
      ]

      const result = applyTransform(data, true)

      expect(result).toEqual([
        { id: 'cat001', parent_id: 'cat000', name: 'Subcategory' },
      ])
    })

    it('should not standardize when shouldStandardizeIds=false', async () => {
      const applyTransform = (loader as any).applyTransform.bind(loader)

      const data = [{ id: 'usr@001', user_id: 'admin#123', name: 'Alice' }]

      const result = applyTransform(data, false)

      expect(result).toEqual([
        { id: 'usr@001', user_id: 'admin#123', name: 'Alice' },
      ])
    })

    it('should handle empty arrays', async () => {
      const applyTransform = (loader as any).applyTransform.bind(loader)

      const result = applyTransform([], true)

      expect(result).toEqual([])
    })
  })

  describe('isVariableId()', () => {
    it('should identify ID variables correctly', async () => {
      const isVariableId = (loader as any).isVariableId.bind(loader)

      expect(isVariableId('id')).toBe(true)
      expect(isVariableId('user_id')).toBe(true)
      expect(isVariableId('parent_id')).toBe(true)
      expect(isVariableId('tag_ids')).toBe(true)
      expect(isVariableId('category_ids')).toBe(true)
      expect(isVariableId('name')).toBe(false)
      expect(isVariableId('email')).toBe(false)
      expect(isVariableId('id_number')).toBe(false)
    })
  })
})
