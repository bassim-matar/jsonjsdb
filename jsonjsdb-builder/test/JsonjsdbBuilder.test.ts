import { describe, it, expect, beforeEach, afterEach, afterAll } from 'vitest'
import { promises as fs } from 'fs'
import { existsSync } from 'fs'
import path from 'path'
import { JsonjsdbBuilder } from '../src/index.js'
import {
  validateJsonjsFile,
  validateMetadataFile,
  createTempTestExcelPath,
  getExpectedResults,
  compareDatasets,
  parseJsonjsFile,
} from './test-helpers.js'

describe('JsonjsdbBuilder E2E Tests', () => {
  const baseFixturesDir = path.join(process.cwd(), 'test/fixtures')
  let testDir: string
  let outputDbDir: string
  let testExcelPath: string
  const createdDirs: string[] = []

  beforeEach(async () => {
    // Create a unique temporary test directory under fixtures to avoid collision
    testDir = await fs.mkdtemp(path.join(baseFixturesDir, 'temp-'))
    createdDirs.push(testDir)
    outputDbDir = path.join(testDir, 'output_db')
    testExcelPath = await createTempTestExcelPath(testDir)
  })

  afterEach(async () => {
    if (testDir && existsSync(testDir)) {
      await fs.rm(testDir, { recursive: true, force: true })
    }
  })

  // Ensure no leftover temp directories (handles edge cases or aborted tests)
  afterAll(async () => {
    for (const dir of createdDirs) {
      if (existsSync(dir)) {
        try {
          await fs.rm(dir, { recursive: true, force: true })
        } catch {
          /* ignore */
        }
      }
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
          'utf-8',
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

    it('should generate evolution with timestamps in seconds format (10 digits)', async () => {
      const builder = await setupBuilder()

      // First update creates initial state
      await builder.updateDb(testExcelPath)

      // Modify data to trigger evolution
      const writeXlsxFile = (await import('write-excel-file/node')).default
      const userExcelPath = path.join(testExcelPath, 'user.xlsx')

      await writeXlsxFile(
        [
          [
            { type: String, value: 'id' },
            { type: String, value: 'name' },
            { type: String, value: 'email' },
          ],
          [
            { type: Number, value: 1 },
            { type: String, value: 'John Updated' },
            { type: String, value: 'john@test.com' },
          ],
          [
            { type: Number, value: 2 },
            { type: String, value: 'Jane' },
            { type: String, value: 'jane@test.com' },
          ],
        ],
        { filePath: userExcelPath },
      )

      // Second update generates evolution
      await builder.updateDb(testExcelPath)

      const evolutionFile = path.join(outputDbDir, 'evolution.json.js')
      expect(existsSync(evolutionFile)).toBe(true)

      const evolutionContent = await fs.readFile(evolutionFile, 'utf-8')
      const evolutionData = parseJsonjsFile(evolutionContent, 'evolution')

      expect(evolutionData.length).toBeGreaterThan(0)

      // Verify all timestamps are in seconds format (10 digits), not milliseconds (13 digits)
      for (const entry of evolutionData) {
        const timestamp = entry.timestamp as number
        expect(typeof timestamp).toBe('number')
        expect(timestamp.toString().length).toBe(10)
      }
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

  describe('Markdown directory processing', () => {
    it('should process markdown files to JsonjsDB format', async () => {
      const builder = await setupBuilder()
      // prepare markdown source directory
      const mdSourceDir = path.join(testDir, 'md_source')
      await fs.mkdir(mdSourceDir, { recursive: true })

      const testMarkdown = '# Test Title\n\nThis is a test markdown file.'
      await fs.writeFile(path.join(mdSourceDir, 'test.md'), testMarkdown)

      const mdOutputSubdir = 'md'
      await builder.updateMdDir(mdOutputSubdir, mdSourceDir)

      const mdOutputDir = path.join(outputDbDir, mdOutputSubdir)
      const outputFile = path.join(mdOutputDir, 'test.json.js')
      expect(existsSync(outputFile)).toBe(true)

      const content = await fs.readFile(outputFile, 'utf-8')
      expect(validateJsonjsFile(content, 'test')).toBe(true)
      expect(content).toContain(
        '"content":"# Test Title\\n\\nThis is a test markdown file."',
      )
    })
  })
})
