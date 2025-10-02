import { describe, it, expect, beforeAll, vi } from 'vitest'
import Jsonjsdb from '../src/Jsonjsdb'

type JsonjsdbPrivate = {
  computeUsage: () => void
}

type LoaderPrivate = {
  validIdChars: string
  validIdPattern: RegExp
  invalidIdPattern: RegExp
  standardizeId: (id: string) => string
}

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
      expect(owners[0]).toHaveProperty('userId')
      expect(managers[0]).toHaveProperty('id')
      expect(managers[0]).toHaveProperty('userId')
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
        const dbPrivate = db as unknown as JsonjsdbPrivate
        const originalComputeUsage = dbPrivate.computeUsage.bind(db)

        // Create mock data with proper types
        const recursiveData = [
          { id: 1, name: 'test 1', parentId: null },
          { id: 2, name: 'test 2', parentId: 1 },
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
        const dbPrivate = db as unknown as JsonjsdbPrivate
        const originalComputeUsage = dbPrivate.computeUsage.bind(db)

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

  describe('validIdChars configuration', () => {
    it('should pass validIdChars from Jsonjsdb to Loader via config', async () => {
      const customDb = new Jsonjsdb({
        dbKey: 'gdf9898fds',
        path: 'test/db',
        validIdChars: 'a-z0-9',
      })

      // Check that config has been set correctly
      expect(customDb.config.validIdChars).toBe('a-z0-9')

      // Check that loader received the config
      const loaderPrivate = customDb.loader as unknown as LoaderPrivate
      expect(loaderPrivate.validIdChars).toBe('a-z0-9')

      // Verify regex patterns are created correctly
      const validIdPattern = loaderPrivate.validIdPattern
      const invalidIdPattern = loaderPrivate.invalidIdPattern

      expect(validIdPattern.test('abc123')).toBe(true)
      expect(validIdPattern.test('ABC123')).toBe(false) // Uppercase not allowed
      expect(validIdPattern.test('abc_123')).toBe(false) // Underscore not allowed

      expect('ABC_123'.replace(invalidIdPattern, '')).toBe('123')
    })

    it('should use default validIdChars when not specified', async () => {
      const defaultDb = new Jsonjsdb({
        dbKey: 'gdf9898fds',
        path: 'test/db',
      })

      expect(defaultDb.config.validIdChars).toBe('a-zA-Z0-9_, -')

      const loaderPrivate = defaultDb.loader as unknown as LoaderPrivate
      expect(loaderPrivate.validIdChars).toBe('a-zA-Z0-9_, -')
    })

    it('should standardize IDs during data loading with custom validIdChars', async () => {
      const customDb = new Jsonjsdb({
        dbKey: 'gdf9898fds',
        path: 'test/db',
        validIdChars: 'a-zA-Z0-9_',
      })

      await customDb.init()

      // The standardizeId method should have been applied
      // Check that loader's standardizeId respects the custom config
      const loaderPrivate = customDb.loader as unknown as LoaderPrivate
      const standardizeId = loaderPrivate.standardizeId.bind(customDb.loader)

      expect(standardizeId('user-123')).toBe('user123') // Hyphen removed
      expect(standardizeId('user,123')).toBe('user123') // Comma removed
      expect(standardizeId('user_123')).toBe('user_123') // Underscore kept
    })

    it('should read validIdChars from HTML config', () => {
      // Create a mock HTML element
      const configDiv = document.createElement('div')
      configDiv.id = 'test-config'
      configDiv.setAttribute('data-path', 'test/db')
      configDiv.setAttribute('data-db-key', 'gdf9898fds')
      configDiv.setAttribute('data-valid-id-chars', '0-9a-z')
      document.body.appendChild(configDiv)

      const htmlDb = new Jsonjsdb('#test-config')

      expect(htmlDb.config.validIdChars).toBe('0-9a-z')

      const loaderPrivate = htmlDb.loader as unknown as LoaderPrivate
      expect(loaderPrivate.validIdChars).toBe('0-9a-z')

      // Cleanup
      document.body.removeChild(configDiv)
    })

    it('should handle HTML config with camelCase dataset attribute', () => {
      // Create a mock HTML element
      const configDiv = document.createElement('div')
      configDiv.id = 'test-config-camel'
      configDiv.setAttribute('data-path', 'test/db')
      configDiv.setAttribute('data-db-key', 'gdf9898fds')
      // Browser automatically converts data-valid-id-chars to dataset.validIdChars
      configDiv.dataset.validIdChars = 'A-Z'
      document.body.appendChild(configDiv)

      const htmlDb = new Jsonjsdb('#test-config-camel')

      expect(htmlDb.config.validIdChars).toBe('A-Z')

      // Cleanup
      document.body.removeChild(configDiv)
    })
  })
})
