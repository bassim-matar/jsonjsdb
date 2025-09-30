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

  describe('init({ aliases })', () => {
    it('should work with aliases', async () => {
      const dbOption = {
        aliases: [
          { table: 'user', alias: 'owner' },
          { table: 'user', alias: 'manager' },
        ],
      }
      const dbInit = await db.init(dbOption)
      expect(dbInit).not.toBe(false)

      // Verify that the aliases were created and can be accessed
      const owners = db.getAll('owner')
      const managers = db.getAll('manager')
      const users = db.getAll('user')

      expect(owners).toBeInstanceOf(Array)
      expect(managers).toBeInstanceOf(Array)
      expect(owners.length).toBe(users.length)
      expect(managers.length).toBe(users.length)

      // Verify that alias records have the correct structure
      expect(owners[0]).toHaveProperty('id')
      expect(owners[0]).toHaveProperty('user_id')
      expect(managers[0]).toHaveProperty('id')
      expect(managers[0]).toHaveProperty('user_id')
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
        expect(user!.id).toBeDefined()
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

    describe('exists()', () => {
      it('should return false for nonexistent entity', () => {
        const result = db.exists('nonexistent_entity', 1)
        expect(result).toBe(false)
      })

      it('should return false for nonexistent id', () => {
        const result = db.exists('user', 999)
        expect(result).toBe(false)
      })

      it('should return true for existing record', () => {
        const result = db.exists('user', 1)
        expect(result).toBe(true)
      })

      it('should return false for table without id index', () => {
        const result = db.exists('nonexistent_table', 1)
        expect(result).toBe(false)
      })
    })

    describe('countRelated()', () => {
      it('should return 0 for nonexistent related table', () => {
        const result = db.countRelated('user', 1, 'nonexistent_table')
        expect(result).toBe(0)
      })

      it('should return 0 for nonexistent record', () => {
        const result = db.countRelated('user', 999, 'email')
        expect(result).toBe(0)
      })

      it('should count related records correctly', () => {
        // Count emails for user 1
        const emailCount = db.countRelated('user', 1, 'email')
        expect(typeof emailCount).toBe('number')
        expect(emailCount).toBeGreaterThanOrEqual(0)
      })

      it('should count docs for user correctly', () => {
        // Count docs for user 1
        const docCount = db.countRelated('user', 1, 'doc')
        expect(typeof docCount).toBe('number')
        expect(docCount).toBeGreaterThanOrEqual(0)
      })

      it('should return 0 when no related records exist', () => {
        // Use a user that likely has no related records
        const result = db.countRelated('user', 999, 'email')
        expect(result).toBe(0)
      })
    })

    describe('getConfig()', () => {
      it('should return undefined for nonexistent id', () => {
        const result = db.getConfig('nonexistent_id')
        expect(result).toBeUndefined()
      })
    })

    describe('use and useRecursive', () => {
      it('should have use property with correct entities', () => {
        expect(db.use).toBeDefined()
        expect(typeof db.use).toBe('object')

        // These tables exist and have data
        expect(db.use.user).toBe(true)
        expect(db.use.doc).toBe(true)
        expect(db.use.email).toBe(true)
        expect(db.use.tag).toBe(true)
        expect(db.use.config).toBe(true)
        expect(db.use.connexion).toBe(true)

        // This table doesn't exist
        expect(db.use.nonexistent).toBeUndefined()
      })

      it('should have useRecursive property', () => {
        expect(db.useRecursive).toBeDefined()
        expect(typeof db.useRecursive).toBe('object')
      })

      it('should not mark tables with underscores as used', () => {
        // user_tag contains underscore, should be ignored
        expect(db.use.user_tag).toBeUndefined()
      })

      it('should detect recursive entities correctly', () => {
        // Since test data doesn't have parent_id, let's test the logic by mocking
        const originalTables = db.tables
        const originalComputeUsage = db['computeUsage'].bind(db)

        // Create mock data with proper types
        const recursiveData = [
          { id: 1, name: 'test 1', parent_id: null },
          { id: 2, name: 'test 2', parent_id: 1 },
        ]

        // Temporarily add the recursive table using Object.defineProperty
        Object.defineProperty(db.tables, 'recursivetable', {
          value: recursiveData,
          configurable: true,
          enumerable: true,
        })

        // Re-compute usage with mocked data
        originalComputeUsage()

        expect(db.use.recursivetable).toBe(true)
        expect(db.useRecursive.recursivetable).toBe(true)

        // Clean up - remove the test property
        delete (db.tables as Record<string, unknown>)['recursivetable']
        originalComputeUsage()
      })

      it('should not mark entities as recursive if they have no parent_id', () => {
        // Test tables don't have parent_id, so none should be recursive
        expect(db.useRecursive.user).toBeUndefined()
        expect(db.useRecursive.doc).toBeUndefined()
        expect(db.useRecursive.email).toBeUndefined()
        expect(db.useRecursive.tag).toBeUndefined()
      })

      it('should handle empty tables correctly', () => {
        const originalComputeUsage = db['computeUsage'].bind(db)

        // Add an empty table temporarily
        Object.defineProperty(db.tables, 'emptytable', {
          value: [],
          configurable: true,
          enumerable: true,
        })

        originalComputeUsage()

        // Empty table should not be marked as used
        expect(db.use.emptytable).toBeUndefined()

        // Clean up
        delete (db.tables as Record<string, unknown>)['emptytable']
        originalComputeUsage()
      })
    })
  })

  describe('getSchema()', () => {
    it('should return a deep copy of the schema', async () => {
      await db.init()
      const schema = db.getSchema()

      expect(schema).toBeDefined()
      expect(schema).toHaveProperty('oneToOne')
      expect(schema).toHaveProperty('oneToMany')
      expect(schema).toHaveProperty('manyToMany')
      expect(schema).toHaveProperty('aliases')

      expect(Array.isArray(schema.oneToOne)).toBe(true)
      expect(Array.isArray(schema.oneToMany)).toBe(true)
      expect(Array.isArray(schema.manyToMany)).toBe(true)
      expect(Array.isArray(schema.aliases)).toBe(true)
    })

    it('should return a deep copy that does not affect the original', async () => {
      await db.init()
      const schema1 = db.getSchema()
      const schema2 = db.getSchema()

      // Get initial lengths
      const initialAliasesLength = schema2.aliases.length
      const initialOneToOneLength = schema2.oneToOne.length

      // Modify the first copy
      schema1.aliases.push('test_alias')
      schema1.oneToOne.push(['test1', 'test2'])

      // The second copy should not be affected
      expect(schema2.aliases).not.toContain('test_alias')
      expect(schema2.oneToOne.length).toBe(initialOneToOneLength)
    })

    it('should return default empty schema when no schema exists', async () => {
      const dbWithoutSchema = new Jsonjsdb({
        dbKey: 'gdf9898fds',
        path: 'test/db',
      })

      await dbWithoutSchema.init()
      const schema = dbWithoutSchema.getSchema()

      // The test database should have an empty default schema structure
      expect(schema).toHaveProperty('oneToOne')
      expect(schema).toHaveProperty('oneToMany')
      expect(schema).toHaveProperty('manyToMany')
      expect(schema).toHaveProperty('aliases')
      expect(Array.isArray(schema.oneToOne)).toBe(true)
      expect(Array.isArray(schema.oneToMany)).toBe(true)
      expect(Array.isArray(schema.manyToMany)).toBe(true)
      expect(Array.isArray(schema.aliases)).toBe(true)
    })
  })

  describe('checkIntegrity()', () => {
    it('should check database integrity successfully', async () => {
      const result = await db.checkIntegrity()

      expect(result).toHaveProperty('emptyId')
      expect(result).toHaveProperty('duplicateId')
      expect(result).toHaveProperty('parentIdNotFound')
      expect(result).toHaveProperty('parentIdSame')
      expect(result).toHaveProperty('foreignIdNotFound')
      expect(Array.isArray(result.emptyId)).toBe(true)
    })
  })

  describe('HTML escaping - global vs local options', () => {
    it('should escape HTML by default (global: true, local: default)', async () => {
      const dbTest = new Jsonjsdb({
        dbKey: 'gdf9898fds',
        browserKey: 'gdf9898fdsTEST1',
        path: 'test/db',
      })
      await dbTest.init({ escapeHtml: true })

      const userTags = dbTest.getAll('user_tag')
      expect(userTags[0].note).toBe(
        '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;',
      )
      expect(userTags[1].note).toBe('Safe &lt;b&gt;content&lt;/b&gt;')
    })

    it('should not escape HTML when global option is false', async () => {
      const dbTest = new Jsonjsdb({
        dbKey: 'gdf9898fds',
        browserKey: 'gdf9898fdsTEST2',
        path: 'test/db',
      })
      await dbTest.init({ escapeHtml: false })

      const userTags = dbTest.getAll('user_tag')
      expect(userTags[0].note).toBe('<script>alert("xss")</script>')
      expect(userTags[1].note).toBe('Safe <b>content</b>')
    })

    it('should use local option (false) when global is true', async () => {
      const dbTest = new Jsonjsdb({
        dbKey: 'gdf9898fds',
        browserKey: 'gdf9898fdsTEST3',
        path: 'test/db',
      })
      await dbTest.init({ escapeHtml: true })

      const data = await dbTest.load('', 'user_tag', false)
      expect((data[0] as any).note).toBe('<script>alert("xss")</script>')
      expect((data[1] as any).note).toBe('Safe <b>content</b>')

      const userTags = dbTest.getAll('user_tag')
      expect(userTags[0].note).toBe(
        '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;',
      )
    })

    it('should use local option (true) when global is false', async () => {
      const dbTest = new Jsonjsdb({
        dbKey: 'gdf9898fds',
        browserKey: 'gdf9898fdsTEST4',
        path: 'test/db',
      })
      await dbTest.init({ escapeHtml: false })

      const data = await dbTest.load('', 'user_tag', true)
      expect((data[0] as any).note).toBe(
        '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;',
      )
      expect((data[1] as any).note).toBe('Safe &lt;b&gt;content&lt;/b&gt;')

      const userTags = dbTest.getAll('user_tag')
      expect(userTags[0].note).toBe('<script>alert("xss")</script>')
    })

    it('should not affect global option after local calls', async () => {
      const dbTest = new Jsonjsdb({
        dbKey: 'gdf9898fds',
        browserKey: 'gdf9898fdsTEST5',
        path: 'test/db',
      })
      await dbTest.init({ escapeHtml: true })

      let userTags = dbTest.getAll('user_tag')
      expect(userTags[0].note).toBe(
        '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;',
      )

      await dbTest.load('', 'user_tag', false)

      userTags = dbTest.getAll('user_tag')
      expect(userTags[0].note).toBe(
        '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;',
      )

      await dbTest.load('', 'user_tag', true)

      userTags = dbTest.getAll('user_tag')
      expect(userTags[0].note).toBe(
        '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;',
      )
    })

    it('should use config.escapeHtml when set in constructor', async () => {
      const dbTest1 = new Jsonjsdb({
        dbKey: 'gdf9898fds',
        browserKey: 'gdf9898fdsTEST6',
        path: 'test/db',
        escapeHtml: false,
      })
      await dbTest1.init()

      let userTags = dbTest1.getAll('user_tag')
      expect(userTags[0].note).toBe('<script>alert("xss")</script>')

      const dbTest2 = new Jsonjsdb({
        dbKey: 'gdf9898fds',
        browserKey: 'gdf9898fdsTEST7',
        path: 'test/db',
        escapeHtml: true,
      })
      await dbTest2.init()

      userTags = dbTest2.getAll('user_tag')
      expect(userTags[0].note).toBe(
        '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;',
      )
    })

    it('should override config.escapeHtml with init option', async () => {
      const dbTest = new Jsonjsdb({
        dbKey: 'gdf9898fds',
        browserKey: 'gdf9898fdsTEST8',
        path: 'test/db',
        escapeHtml: false,
      })
      await dbTest.init({ escapeHtml: true })

      const userTags = dbTest.getAll('user_tag')
      expect(userTags[0].note).toBe(
        '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;',
      )
    })
  })
})
