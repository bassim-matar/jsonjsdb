import { describe, it, expect, beforeAll, vi } from 'vitest'
import Jsonjsdb from '../src/Jsonjsdb'

describe('jsonjsdb', () => {
  let db: Jsonjsdb

  beforeAll(() => {
    db = new Jsonjsdb({
      dbKey: 'gdf9898fds',
      browserKey: 'gdf9898fdsS',
      path: 'test/db',
    })
  })

  it('should exist', () => {
    expect(db).toBeDefined()
  })

  describe('init()', () => {
    it('should work', async () => {
      const dbInit = await db.init()
      expect(dbInit).not.toBe(false)
    })
  })

  describe('init({ filter })', () => {
    it('should work with filter', async () => {
      const filter = {
        entity: 'user',
        variable: 'name',
        values: ['user 1', 'user 3'],
      }
      const dbInit = await db.init({ filter })
      expect(dbInit).not.toBe(false)
    })
  })

  describe('load()', () => {
    it('should load records', async () => {
      const users = await db.load('', 'user')
      expect(users).toBeInstanceOf(Array)
      expect(users.length).toBeGreaterThan(0)
      expect(users[0]).toHaveProperty('id')
    })
  })

  describe('after init done', () => {
    beforeAll(async () => {
      await db.init()
    })

    describe('get()', () => {
      it('should get a user by id', () => {
        const user = db.get('user', 1)
        expect(user).toHaveProperty('id', 1)
      })

      it('should return undefined for nonexistent table', () => {
        const consoleSpy = vi
          .spyOn(console, 'error')
          .mockImplementation(() => {})
        const result = db.get('nonexistent_table', 1)
        expect(result).toBeUndefined()
        consoleSpy.mockRestore()
      })

      it('should return undefined for nonexistent id', () => {
        const consoleSpy = vi
          .spyOn(console, 'error')
          .mockImplementation(() => {})
        const result = db.get('user', 999)
        expect(result).toBeUndefined()
        consoleSpy.mockRestore()
      })
    })

    describe('getAll()', () => {
      it('should run without error', () => {
        expect(() => db.getAll('user')).not.toThrow()
      })

      it('should return empty array for nonexistent table', () => {
        const result = db.getAll('nonexistent_table')
        expect(result).toBeInstanceOf(Array)
        expect(result).toHaveLength(0)
      })

      it('should return 2 records when limit is 2', () => {
        const result = db.getAll('user', undefined, { limit: 2 })
        expect(result).toHaveLength(2)
      })

      it('should work if an id is passed', () => {
        const result = db.getAll('email', { user: 1 })
        expect(result[0]).toHaveProperty('name')
      })

      it('should work if an object is passed', () => {
        const user = { id: 1 }
        const result = db.getAll('email', { user })
        expect(result[0]).toHaveProperty('name')
      })

      it('should get user 1 docs', () => {
        const user = db.get('user', 1)
        expect(user).toBeDefined()
        const docs = db.getAll('doc', { user: user!.id })
        expect(docs).toBeInstanceOf(Array)
        expect(docs.length).toBeGreaterThan(0)
      })
    })

    describe('foreach()', () => {
      it('should run a callback for every row', () => {
        db.foreach('user', user => {
          expect(user).toHaveProperty('id')
        })
      })
    })

    describe('tableHasId()', () => {
      it('should return false for nonexistent entity', () => {
        const result = db.tableHasId('nonexistent_entity', 1)
        expect(result).toBe(false)
      })

      it('should return false for nonexistent id', () => {
        const result = db.tableHasId('user', 999)
        expect(result).toBe(false)
      })
    })

    describe('getConfig()', () => {
      it('should return undefined for nonexistent id', () => {
        const result = db.getConfig('nonexistent_id')
        expect(result).toBeUndefined()
      })
    })
  })
})
