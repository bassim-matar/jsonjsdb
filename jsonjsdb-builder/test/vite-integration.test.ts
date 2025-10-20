import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { promises as fs } from 'fs'
import { existsSync } from 'fs'
import path from 'path'
import { JsonjsdbBuilder, initJsonjsdbBuilder } from '../src/index.js'
import { createTempTestExcelPath } from './test-helpers.js'

describe('Vite Integration', () => {
  const baseFixturesDir = path.join(process.cwd(), 'test/fixtures')
  let testDir: string
  let outputDbDir: string
  let testExcelPath: string
  let configPath: string

  beforeEach(async () => {
    testDir = await fs.mkdtemp(path.join(baseFixturesDir, 'temp-vite-'))
    outputDbDir = path.join(testDir, 'output_db')
    testExcelPath = await createTempTestExcelPath(testDir)
    configPath = path.join(testDir, 'config.html')
    await fs.writeFile(
      configPath,
      '<script>window.JSONJSDB_CONFIG = {}</script>',
    )
  })

  afterEach(async () => {
    if (testDir && existsSync(testDir)) {
      await fs.rm(testDir, { recursive: true, force: true })
    }
  })

  describe('configPath option', () => {
    it('should accept configPath in constructor', async () => {
      const builder = new JsonjsdbBuilder({ configPath })
      await builder.setOutputDb(outputDbDir)
      await builder.updateDb(testExcelPath)

      const plugin = builder.getVitePlugin() as { name: string }
      expect(plugin).toBeDefined()
      expect(plugin.name).toBe('jsonjsdbAddConfig')
    })

    it('should throw error if configPath not provided', async () => {
      const builder = new JsonjsdbBuilder()
      await builder.setOutputDb(outputDbDir)

      expect(() => builder.getVitePlugin()).toThrow(
        'Config path must be provided either in constructor or getVitePlugin()',
      )
    })

    it('should allow override configPath in getVitePlugin', async () => {
      const builder = new JsonjsdbBuilder({ configPath: 'default.html' })
      await builder.setOutputDb(outputDbDir)

      const plugin = builder.getVitePlugin(configPath) as { name: string }
      expect(plugin).toBeDefined()
      expect(plugin.name).toBe('jsonjsdbAddConfig')
    })
  })

  describe('getVitePlugin', () => {
    it('should return a valid Vite plugin', async () => {
      const builder = new JsonjsdbBuilder({ configPath })
      await builder.setOutputDb(outputDbDir)

      const plugin = builder.getVitePlugin() as {
        name: string
        transformIndexHtml: unknown
      }
      expect(plugin).toBeDefined()
      expect(plugin.name).toBe('jsonjsdbAddConfig')
      expect(plugin.transformIndexHtml).toBeDefined()
    })

    it('should inject config content into HTML', async () => {
      const builder = new JsonjsdbBuilder({ configPath })
      await builder.setOutputDb(outputDbDir)

      const plugin = builder.getVitePlugin() as {
        transformIndexHtml: {
          handler: (html: string, ctx: unknown) => Promise<string>
        }
      }
      const transform = plugin.transformIndexHtml

      if (typeof transform === 'object' && transform.handler) {
        const result = await transform.handler('<html><body></body></html>', {})
        expect(result).toContain('<html><body></body></html>')
        expect(result).toContain('<script>window.JSONJSDB_CONFIG = {}</script>')
      }
    })
  })

  describe('getVitePlugins', () => {
    it('should return array of plugins including FullReload', async () => {
      const builder = new JsonjsdbBuilder({ configPath })
      await builder.setOutputDb(outputDbDir)
      await builder.updateDb(testExcelPath)

      const plugins = builder.getVitePlugins()
      expect(Array.isArray(plugins)).toBe(true)
      expect(plugins.length).toBe(2)
      const firstPlugin = plugins[0] as { name: string }
      expect(firstPlugin.name).toBe('jsonjsdbAddConfig')
    })
  })

  describe('initJsonjsdbBuilder', () => {
    it('should initialize builder with all options', async () => {
      const previewPath = path.join(testDir, 'preview_source')
      await fs.mkdir(previewPath, { recursive: true })

      const builder = await initJsonjsdbBuilder({
        dbPath: outputDbDir,
        dbSourcePath: testExcelPath,
        previewPath,
        configPath,
      })

      expect(builder).toBeInstanceOf(JsonjsdbBuilder)
      expect(builder.getOutputDb()).toBe(path.resolve(outputDbDir))
      expect(existsSync(path.join(outputDbDir, '__table__.json.js'))).toBe(true)
    })

    it('should handle optional paths', async () => {
      const builder = await initJsonjsdbBuilder({
        dbPath: outputDbDir,
        dbSourcePath: testExcelPath,
        configPath,
      })

      expect(builder).toBeInstanceOf(JsonjsdbBuilder)
      expect(existsSync(path.join(outputDbDir, '__table__.json.js'))).toBe(true)
    })

    it('should support compact option', async () => {
      const builder = await initJsonjsdbBuilder(
        {
          dbPath: outputDbDir,
          dbSourcePath: testExcelPath,
          configPath,
        },
        { compact: true },
      )

      expect(builder).toBeInstanceOf(JsonjsdbBuilder)
    })

    it('should watch in development mode', async () => {
      const builder = await initJsonjsdbBuilder(
        {
          dbPath: outputDbDir,
          dbSourcePath: testExcelPath,
          configPath,
        },
        { isDevelopment: true },
      )

      expect(builder).toBeInstanceOf(JsonjsdbBuilder)
    })

    it('should return builder with working getVitePlugins', async () => {
      const builder = await initJsonjsdbBuilder({
        dbPath: outputDbDir,
        dbSourcePath: testExcelPath,
        configPath,
      })

      const plugins = builder.getVitePlugins()
      expect(Array.isArray(plugins)).toBe(true)
      expect(plugins.length).toBe(2)
    })
  })
})
