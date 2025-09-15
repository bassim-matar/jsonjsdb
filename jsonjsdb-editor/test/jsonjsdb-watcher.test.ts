import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { promises as fs } from 'fs'
import { existsSync } from 'fs'
import path from 'path'
import { jsonjsdbWatcher } from '../src/index.js'
import { validateJsonjsFile } from './test-helpers.js'

describe('jsonjsdbWatcher E2E Tests', () => {
  const testDir = path.join(process.cwd(), 'test/fixtures/watcher')
  const outputDbDir = path.join(testDir, 'output_db')

  beforeEach(async () => {
    if (existsSync(testDir)) {
      await fs.rm(testDir, { recursive: true, force: true })
    }
  })

  afterEach(async () => {
    if (existsSync(testDir)) {
      await fs.rm(testDir, { recursive: true, force: true })
    }
  })

  describe('Core functionality', () => {
    it('should initialize and set database correctly', async () => {
      await fs.mkdir(testDir, { recursive: true })
      await jsonjsdbWatcher.setDb(outputDbDir)

      expect(existsSync(outputDbDir)).toBe(true)

      const tableIndexFile = jsonjsdbWatcher.getTableIndexFilePath()
      expect(tableIndexFile.endsWith('__table__.json.js')).toBe(true)
    })

    it('should handle environment detection', () => {
      const originalEnv = process.env.NODE_ENV

      process.env.NODE_ENV = 'development'
      expect(jsonjsdbWatcher.isDev()).toBe(true)

      process.env.NODE_ENV = 'production'
      expect(jsonjsdbWatcher.isDev()).toBe(false)

      process.env.NODE_ENV = originalEnv
    })

    it('should process markdown files to JsonjsDB format', async () => {
      await fs.mkdir(testDir, { recursive: true })
      await jsonjsdbWatcher.setDb(outputDbDir)

      const mdSourceDir = path.join(testDir, 'md_source')
      await fs.mkdir(mdSourceDir, { recursive: true })

      const testMarkdown = '# Test Title\n\nThis is a test markdown file.'
      await fs.writeFile(path.join(mdSourceDir, 'test.md'), testMarkdown)

      const mdOutputDir = path.join(outputDbDir, 'md')
      await fs.mkdir(mdOutputDir, { recursive: true })

      await jsonjsdbWatcher.updateMdFiles('md', mdSourceDir)

      const outputFile = path.join(mdOutputDir, 'test.json.js')
      expect(existsSync(outputFile)).toBe(true)

      const content = await fs.readFile(outputFile, 'utf-8')
      expect(validateJsonjsFile(content, 'test')).toBe(true)
      expect(content).toContain(
        '"content":"# Test Title\\n\\nThis is a test markdown file."'
      )
    })
  })
})
