import { promises as fs } from 'fs'
import { existsSync } from 'fs'
import path from 'path'

/**
 * Validates that a JsonjsDB file content is valid (accepts both quote formats)
 */
export function validateJsonjsFile(
  content: string,
  tableName: string
): boolean {
  try {
    const prefixes = [
      `jsonjs.data['${tableName}'] = \n`,
      `jsonjs.data["${tableName}"] = \n`,
    ]

    const prefix = prefixes.find(p => content.startsWith(p))
    if (!prefix) return false

    const jsonContent = content.slice(prefix.length)
    return Array.isArray(JSON.parse(jsonContent))
  } catch {
    return false
  }
}

/**
 * Parses JsonjsDB file content and returns the data
 */
export function parseJsonjsFile(
  content: string,
  tableName: string
): Record<string, unknown>[] {
  const expectedPrefix = `jsonjs.data['${tableName}'] = \n`
  if (!content.startsWith(expectedPrefix)) {
    throw new Error(`Invalid JsonjsDB file format for table: ${tableName}`)
  }

  const jsonContent = content.slice(expectedPrefix.length)
  return JSON.parse(jsonContent)
}

/**
 * Compares two datasets ignoring order
 */
export function compareDatasets(
  dataset1: Record<string, unknown>[],
  dataset2: Record<string, unknown>[]
): boolean {
  if (dataset1.length !== dataset2.length) return false

  const sortFn = (a: Record<string, unknown>, b: Record<string, unknown>) => {
    const key1 = a.id || a.name || JSON.stringify(a)
    const key2 = b.id || b.name || JSON.stringify(b)
    return String(key1).localeCompare(String(key2))
  }

  const sorted1 = [...dataset1].sort(sortFn)
  const sorted2 = [...dataset2].sort(sortFn)

  return JSON.stringify(sorted1) === JSON.stringify(sorted2)
}

/**
 * Validates that a metadata file contains expected tables
 */
export function validateMetadataFile(
  content: string,
  expectedTables: string[]
): boolean {
  try {
    const data = parseJsonjsFile(content, '__table__')
    const tableNames = data
      .map((item: Record<string, unknown>) => item.name as string)
      .filter((name: string) => name !== '__table__')

    return expectedTables.every(table => tableNames.includes(table))
  } catch {
    return false
  }
}

/**
 * Gets the path to test Excel files
 */
export function getTestExcelPath(): string {
  return path.join(process.cwd(), 'test/fixtures/excel')
}

/**
 * Creates a temporary copy of Excel files for testing to avoid modifying originals
 * (especially evolution.xlsx which gets written to during tests)
 */
export async function createTempTestExcelPath(
  tempDir: string
): Promise<string> {
  const originalPath = getTestExcelPath()
  const tempExcelPath = path.join(tempDir, 'excel')

  // Create temp excel directory
  await fs.mkdir(tempExcelPath, { recursive: true })

  // Copy all Excel files to temp directory
  const files = await fs.readdir(originalPath)
  for (const file of files) {
    if (file.endsWith('.xlsx')) {
      const srcPath = path.join(originalPath, file)
      const destPath = path.join(tempExcelPath, file)
      await fs.copyFile(srcPath, destPath)
    }
  }

  return tempExcelPath
}

/**
 * Reads expected results from fixtures (excludes evolution which has timestamps)
 */
export async function getExpectedResults(): Promise<
  Record<string, Record<string, unknown>[]>
> {
  const referenceDir = path.join(process.cwd(), 'test/fixtures/expected')

  if (!existsSync(referenceDir)) {
    throw new Error(`Reference results not found: ${referenceDir}`)
  }

  const results: Record<string, Record<string, unknown>[]> = {}
  const files = await fs.readdir(referenceDir)

  for (const file of files) {
    if (
      file.endsWith('.json.js') &&
      !['__table__.json.js', 'evolution.json.js'].includes(file)
    ) {
      const tableName = file.replace('.json.js', '')
      const filePath = path.join(referenceDir, file)
      const content = await fs.readFile(filePath, 'utf-8')
      results[tableName] = parseJsonjsFile(content, tableName)
    }
  }

  return results
}
