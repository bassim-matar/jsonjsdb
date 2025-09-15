import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { promises as fs } from 'fs'
import { existsSync } from 'fs'
import path from 'path'
import { JsonjsdbBuilder } from '../src/index.js'
import {
  validateJsonjsFile,
  validateMetadataFile,
  getTestExcelPath,
  getExpectedResults,
  compareDatasets,
  parseJsonjsFile,
} from './test-helpers.js'

describe('JsonjsdbBuilder E2E Tests', () => {
  const testDir = path.join(process.cwd(), 'test/fixtures/temp')
  const outputDbDir = path.join(testDir, 'output_db')
  const testExcelPath = getTestExcelPath()

  beforeEach(async () => {
    if (existsSync(testDir)) {
      await fs.rm(testDir, { recursive: true, force: true })
    }
    await fs.mkdir(testDir, { recursive: true })
  })

  afterEach(async () => {
    if (existsSync(testDir)) {
      await fs.rm(testDir, { recursive: true, force: true })
    }
  })

  async function setupBuilder(options?: {
    compact?: boolean
  }): Promise<JsonjsdbBuilder> {
    const builder = new JsonjsdbBuilder(options)
    await builder.setOutputDb(outputDbDir)
    return builder
  }

  async function assertBasicFiles(): Promise<void> {
    expect(existsSync(path.join(outputDbDir, '__table__.json.js'))).toBe(true)
    expect(existsSync(path.join(outputDbDir, 'user.json.js'))).toBe(true)
    expect(existsSync(path.join(outputDbDir, 'tag.json.js'))).toBe(true)
  }

  describe('Core conversion functionality', () => {
    it('should convert Excel files to JsonjsDB format with proper validation', async () => {
      const builder = await setupBuilder()
      await builder.updateDb(testExcelPath)

      await assertBasicFiles()

      // Validate file formats
      const [userContent, tagContent, metadataContent] = await Promise.all([
        fs.readFile(path.join(outputDbDir, 'user.json.js'), 'utf-8'),
        fs.readFile(path.join(outputDbDir, 'tag.json.js'), 'utf-8'),
        fs.readFile(path.join(outputDbDir, '__table__.json.js'), 'utf-8'),
      ])

      expect(validateJsonjsFile(userContent, 'user')).toBe(true)
      expect(validateJsonjsFile(tagContent, 'tag')).toBe(true)
      expect(validateMetadataFile(metadataContent, ['user', 'tag'])).toBe(true)
    })

    it('should generate content matching expected results', async () => {
      const builder = await setupBuilder()
      await builder.updateDb(testExcelPath)

      const expectedResults = await getExpectedResults()

      for (const tableName of Object.keys(expectedResults)) {
        const generatedContent = await fs.readFile(
          path.join(outputDbDir, `${tableName}.json.js`),
          'utf-8'
        )
        const generatedData = parseJsonjsFile(generatedContent, tableName)
        const expectedData = expectedResults[tableName]

        expect(compareDatasets(generatedData, expectedData)).toBe(true)
      }
    })
  })

  describe('Configuration options', () => {
    it('should work with compact mode', async () => {
      const builder = await setupBuilder({ compact: true })
      await builder.updateDb(testExcelPath)

      expect(builder.getOutputDb()).toBe(path.resolve(outputDbDir))
      await assertBasicFiles()
    })

    it('should create output directory if it does not exist', async () => {
      const nonExistentDir = path.join(testDir, 'non_existent')
      const builder = new JsonjsdbBuilder()
      await builder.setOutputDb(nonExistentDir)

      expect(existsSync(nonExistentDir)).toBe(true)
    })
  })

  describe('Metadata and evolution tracking', () => {
    it('should handle metadata correctly', async () => {
      const builder = await setupBuilder()
      await builder.updateDb(testExcelPath)

      const tableIndexFile = builder.getTableIndexFile()
      expect(tableIndexFile.endsWith('__table__.json.js')).toBe(true)

      const metadataContent = await fs.readFile(tableIndexFile, 'utf-8')
      expect(validateMetadataFile(metadataContent, ['user', 'tag'])).toBe(true)

      // Check specific content
      expect(metadataContent).toContain('"name": "user"')
      expect(metadataContent).toContain('"name": "tag"')
      expect(metadataContent).toContain('"name": "__table__"')
    })

    it('should handle multiple updates correctly', async () => {
      const builder = await setupBuilder()

      // First conversion
      await builder.updateDb(testExcelPath)
      await assertBasicFiles()

      // Second conversion (should handle no changes gracefully)
      await builder.updateDb(testExcelPath)
      await assertBasicFiles()
    })
  })
})
