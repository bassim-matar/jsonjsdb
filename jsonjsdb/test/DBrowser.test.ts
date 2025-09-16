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
})
