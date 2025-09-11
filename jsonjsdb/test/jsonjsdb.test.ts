import { describe, it, expect, beforeAll, vi } from 'vitest'
import Jsonjsdb from '../src/Jsonjsdb'

describe('jsonjsdb', () => {
  let db: Jsonjsdb

  beforeAll(() => {
    db = new Jsonjsdb({ 
      db_key: 'gdf9898fds', 
      browser_key: 'gdf9898fdsS',
      path: 'test/db'
    })
  })

  it('should exist', () => {
    expect(db).toBeDefined()
  })

  describe('init()', () => {
    it('should work', async () => {
      const db_init = await db.init()
      expect(db_init).not.toBe(false)
    })
  })

  describe('init({ filter })', () => {
    it('should work with filter', async () => {
      const filter = {
        entity: 'user',
        variable: 'name',
        values: ['user 1', 'user 3'],
      }
      const db_init = await db.init({ filter })
      expect(db_init).not.toBe(false)
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
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
        const result = db.get('nonexistent_table', 1)
        expect(result).toBeUndefined()
        consoleSpy.mockRestore()
      })

      it('should return undefined for nonexistent id', () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
        const result = db.get('user', 999)
        expect(result).toBeUndefined()
        consoleSpy.mockRestore()
      })
    })

    describe('get_all()', () => {
      it('should run without error', () => {
        expect(() => db.get_all('user')).not.toThrow()
      })
      
      it('should return empty array for nonexistent table', () => {
        const result = db.get_all('nonexistent_table')
        expect(result).toBeInstanceOf(Array)
        expect(result).toHaveLength(0)
      })
      
      it('should return 2 records when limit is 2', () => {
        const result = db.get_all('user', null, { limit: 2 })
        expect(result).toHaveLength(2)
      })
      
      it('should work if an id is passed', () => {
        const result = db.get_all('email', { user: 1 })
        expect(result[0]).toHaveProperty('name')
      })
      
      it('should work if an object is passed', () => {
        const user = { id: 1 }
        const result = db.get_all('email', { user })
        expect(result[0]).toHaveProperty('name')
      })
      
      it('should get user 1 docs', () => {
        const user = db.get('user', 1)
        const docs = db.get_all('doc', { user: user.id })
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

    describe('table_has_id()', () => {
      it('should return false for nonexistent entity', () => {
        const result = db.table_has_id('nonexistent_entity', 1)
        expect(result).toBe(false)
      })

      it('should return false for nonexistent id', () => {
        const result = db.table_has_id('user', 999)
        expect(result).toBe(false)
      })
    })

    describe('get_config()', () => {
      it('should return undefined for nonexistent id', () => {
        const result = db.get_config('nonexistent_id')
        expect(result).toBeUndefined()
      })
    })
  })
})
