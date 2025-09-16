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
})
