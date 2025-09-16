import { describe, it, expect } from 'vitest'
import DBrowser from '../src/DBrowser'

describe('DBrowser', () => {
  const testBrowserKey = 'test-browser-key'
  const testAppName = 'test-app-dbrowser'

  describe('Constructor', () => {
    it('should create instance without encryption', () => {
      const instance = new DBrowser('', testAppName, false)
      expect(instance).toBeInstanceOf(DBrowser)
    })

    it('should create instance with encryption when browser key is provided', () => {
      const instance = new DBrowser(testBrowserKey, testAppName, true)
      expect(instance).toBeInstanceOf(DBrowser)
    })

    it('should disable encryption when browser key is empty', () => {
      const instance = new DBrowser('', testAppName, true)
      expect(instance).toBeInstanceOf(DBrowser)
    })
  })

  describe('Method existence', () => {
    it('should have all required methods', () => {
      const instance = new DBrowser(testBrowserKey, testAppName, false)
      expect(typeof instance.get).toBe('function')
      expect(typeof instance.set).toBe('function')
      expect(typeof instance.getAll).toBe('function')
      expect(typeof instance.clear).toBe('function')
    })
  })

  describe('Basic synchronous operations', () => {
    it('should call set without throwing errors', () => {
      const instance = new DBrowser('', testAppName, false)
      expect(() => {
        instance.set('test-key', 'test-value')
      }).not.toThrow()
    })

    it('should call set with callback without throwing errors', () => {
      const instance = new DBrowser('', testAppName, false)
      const callback = () => {}
      expect(() => {
        instance.set('test-key', 'test-value', callback)
      }).not.toThrow()
    })

    it('should call clear without throwing errors', () => {
      const instance = new DBrowser('', testAppName, false)
      expect(() => {
        instance.clear()
      }).not.toThrow()
    })
  })

  describe('Encryption enabled operations', () => {
    it('should call set with encryption without throwing errors', () => {
      const instance = new DBrowser(testBrowserKey, testAppName, true)
      expect(() => {
        instance.set('test-key', { data: 'test' })
      }).not.toThrow()
    })

    it('should handle different data types with encryption', () => {
      const instance = new DBrowser(testBrowserKey, testAppName, true)

      expect(() => {
        instance.set('string', 'test string')
        instance.set('number', 123)
        instance.set('boolean', true)
        instance.set('object', { key: 'value' })
        instance.set('null', null)
        instance.set('undefined', undefined)
      }).not.toThrow()
    })
  })

  describe('getAll operations', () => {
    it('should call getAll without throwing errors', () => {
      const instance = new DBrowser('', testAppName, false)
      const callback = () => {}
      expect(() => {
        instance.getAll('test-prefix', callback)
      }).not.toThrow()
    })

    it('should call getAll with encryption without throwing errors', () => {
      const instance = new DBrowser(testBrowserKey, testAppName, true)
      const callback = () => {}
      expect(() => {
        instance.getAll('test-prefix', callback)
      }).not.toThrow()
    })
  })

  describe('Simple async operations', () => {
    it('should return a promise from get method', () => {
      const instance = new DBrowser('', testAppName, false)
      const result = instance.get('test-key')
      expect(result).toBeInstanceOf(Promise)
    })

    it('should return a promise from get method with encryption', () => {
      const instance = new DBrowser(testBrowserKey, testAppName, true)
      const result = instance.get('test-key')
      expect(result).toBeInstanceOf(Promise)
    })
  })

  describe('Instance properties', () => {
    it('should maintain different instances with different configurations', () => {
      const instance1 = new DBrowser('', 'app1', false)
      const instance2 = new DBrowser('key', 'app2', true)
      const instance3 = new DBrowser('', 'app3', true)

      expect(instance1).toBeInstanceOf(DBrowser)
      expect(instance2).toBeInstanceOf(DBrowser)
      expect(instance3).toBeInstanceOf(DBrowser)

      expect(instance1).not.toBe(instance2)
      expect(instance2).not.toBe(instance3)
    })
  })

  describe('Data storage and retrieval', () => {
    it('should store and retrieve an array of objects without encryption', async () => {
      const instance = new DBrowser('', testAppName, false)
      const testData = [
        { id: 1, name: 'John', email: 'john@example.com' },
        { id: 2, name: 'Jane', email: 'jane@example.com' },
        { id: 3, name: 'Bob', email: 'bob@example.com' },
      ]
      const testKey = 'users-list'

      // Store the array directly (should be stored as-is without stringify)
      instance.set(testKey, testData)

      // Retrieve and verify the data is exactly what we stored
      const retrieved = await instance.get(testKey)
      expect(retrieved).toEqual(testData)
      expect(Array.isArray(retrieved)).toBe(true)
      expect(retrieved).toHaveLength(3)
      expect((retrieved as typeof testData)[0]).toEqual({
        id: 1,
        name: 'John',
        email: 'john@example.com',
      })
    })

    it('should store and retrieve an array of objects with encryption', async () => {
      const instance = new DBrowser(testBrowserKey, testAppName, true)
      const testData = [
        { id: 1, name: 'Alice', age: 25 },
        { id: 2, name: 'Charlie', age: 30 },
        { id: 3, name: 'Diana', age: 28 },
      ]
      const testKey = 'encrypted-users'

      // Store the array (will be automatically stringified and encrypted)
      instance.set(testKey, testData)

      // Retrieve and verify
      const retrieved = await instance.get(testKey)
      expect(retrieved).toEqual(testData)
      expect(Array.isArray(retrieved)).toBe(true)
      expect(retrieved).toHaveLength(3)
      expect((retrieved as typeof testData)[1]).toEqual({
        id: 2,
        name: 'Charlie',
        age: 30,
      })
    })

    it('should handle empty array storage and retrieval', async () => {
      const instance = new DBrowser('', testAppName, false)
      const testData: unknown[] = []
      const testKey = 'empty-array'

      // Store the empty array directly
      instance.set(testKey, testData)

      const retrieved = await instance.get(testKey)
      expect(retrieved).toEqual([])
      expect(Array.isArray(retrieved)).toBe(true)
      expect(retrieved).toHaveLength(0)
    })
  })
})
