import { describe, it, expect, beforeEach } from 'vitest'
import Jsonjsdb from '../src/Jsonjsdb'
import Loader from '../src/Loader'

type LoaderPrivate = {
  arrayToObject: (
    data: unknown[][],
    shouldStandardizeIds?: boolean,
  ) => Record<string, unknown>[]
  applyTransform: (data: unknown[], shouldStandardizeIds?: boolean) => unknown[]
  standardizeId: (id: string) => string
  isVariableId: (variable: string) => boolean
}

describe('Loader', () => {
  const dbKey = 'gdf9898fds'
  const path = 'test/db/' + dbKey
  let loader: Loader
  let loaderPrivate: LoaderPrivate

  beforeEach(() => {
    const db = new Jsonjsdb({ dbKey, path: 'test/db' })
    loader = db.loader
    loaderPrivate = loader as unknown as LoaderPrivate
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

      const result = loaderPrivate.arrayToObject([
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
      expect(loaderPrivate.standardizeId('user123')).toBe('user123')
      expect(loaderPrivate.standardizeId('abc-def')).toBe('abc-def')
      expect(loaderPrivate.standardizeId('abc_def')).toBe('abc_def')
      expect(loaderPrivate.standardizeId('abc,def')).toBe('abc,def')
      expect(loaderPrivate.standardizeId('ABC123')).toBe('ABC123')
    })

    it('should remove invalid characters from IDs', async () => {
      expect(loaderPrivate.standardizeId('user@123')).toBe('user123')
      expect(loaderPrivate.standardizeId('user 123')).toBe('user 123') // spaces are valid
      expect(loaderPrivate.standardizeId('user#123')).toBe('user123')
      expect(loaderPrivate.standardizeId('user$123')).toBe('user123')
      expect(loaderPrivate.standardizeId('user!@#$123')).toBe('user123')
    })

    it('should trim leading and trailing spaces', async () => {
      expect(loaderPrivate.standardizeId(' user123 ')).toBe('user123')
      expect(loaderPrivate.standardizeId('user\t123')).toBe('user123') // tabs are invalid
      expect(loaderPrivate.standardizeId('user\n123')).toBe('user123') // newlines are invalid
      expect(loaderPrivate.standardizeId('A B C')).toBe('A B C') // internal spaces are kept
      expect(loaderPrivate.standardizeId(' tag1, tag2 ')).toBe('tag1, tag2') // trim but keep internal spaces
    })

    it('should handle custom validIdChars configuration', async () => {
      const db = new Jsonjsdb({
        dbKey,
        path: 'test/db',
        validIdChars: 'a-z0-9',
      })
      const customLoader = db.loader
      const customLoaderPrivate = customLoader as unknown as LoaderPrivate

      expect(customLoaderPrivate.standardizeId('abc123')).toBe('abc123')
      expect(customLoaderPrivate.standardizeId('ABC123')).toBe('123')
      expect(customLoaderPrivate.standardizeId('user_id')).toBe('userid')
      expect(customLoaderPrivate.standardizeId('user-id')).toBe('userid')
    })
  })

  describe('arrayToObject() with ID standardization', () => {
    it('should standardize IDs in columns ending with _id', async () => {
      const result = loaderPrivate.arrayToObject(
        [
          ['id', 'user_id', 'name'],
          ['usr@001', 'admin#123', 'Alice'],
          ['usr 002', 'user 456', 'Bob'],
        ],
        true,
      )

      expect(result).toEqual([
        { id: 'usr001', userId: 'admin123', name: 'Alice' },
        { id: 'usr 002', userId: 'user 456', name: 'Bob' }, // internal spaces kept
      ])
    })

    it('should standardize IDs in columns ending with _ids', async () => {
      const result = loaderPrivate.arrayToObject(
        [
          ['id', 'tag_ids', 'name'],
          ['1', 'tag@1,tag 2', 'Item 1'],
          ['2', 'tag#3', 'Item 2'],
        ],
        true,
      )

      expect(result).toEqual([
        { id: '1', tagIds: 'tag1,tag 2', name: 'Item 1' }, // space after comma kept
        { id: '2', tagIds: 'tag3', name: 'Item 2' },
      ])
    })

    it('should not standardize non-ID columns', async () => {
      const result = loaderPrivate.arrayToObject(
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
      const result = loaderPrivate.arrayToObject(
        [
          ['id', 'user_id', 'name'],
          ['usr@001', 'admin#123', 'Alice'],
        ],
        false,
      )

      expect(result).toEqual([
        { id: 'usr@001', userId: 'admin#123', name: 'Alice' },
      ])
    })
  })

  describe('applyTransform() with ID standardization', () => {
    it('should standardize IDs in object format data', async () => {
      const data = [
        { id: 'usr@001', userId: 'admin#123', name: 'Alice' },
        { id: 'usr 002', userId: 'user 456', name: 'Bob' },
      ]

      const result = loaderPrivate.applyTransform(data, true)

      expect(result).toEqual([
        { id: 'usr001', userId: 'admin123', name: 'Alice' },
        { id: 'usr 002', userId: 'user 456', name: 'Bob' }, // internal spaces kept
      ])
    })

    it('should handle parentId field', async () => {
      const data = [{ id: 'cat@001', parentId: 'cat 000', name: 'Subcategory' }]

      const result = loaderPrivate.applyTransform(data, true)

      expect(result).toEqual([
        { id: 'cat001', parentId: 'cat 000', name: 'Subcategory' }, // internal space kept
      ])
    })

    it('should not standardize when shouldStandardizeIds=false', async () => {
      const data = [{ id: 'usr@001', userId: 'admin#123', name: 'Alice' }]

      const result = loaderPrivate.applyTransform(data, false)

      expect(result).toEqual([
        { id: 'usr@001', userId: 'admin#123', name: 'Alice' },
      ])
    })

    it('should handle empty arrays', async () => {
      const result = loaderPrivate.applyTransform([], true)

      expect(result).toEqual([])
    })
  })

  describe('isVariableId()', () => {
    it('should identify ID variables correctly', async () => {
      expect(loaderPrivate.isVariableId('id')).toBe(true)
      expect(loaderPrivate.isVariableId('userId')).toBe(true)
      expect(loaderPrivate.isVariableId('parentId')).toBe(true)
      expect(loaderPrivate.isVariableId('tagIds')).toBe(true)
      expect(loaderPrivate.isVariableId('categoryIds')).toBe(true)
      expect(loaderPrivate.isVariableId('name')).toBe(false)
      expect(loaderPrivate.isVariableId('email')).toBe(false)
      expect(loaderPrivate.isVariableId('idNumber')).toBe(false)
    })
  })
})
