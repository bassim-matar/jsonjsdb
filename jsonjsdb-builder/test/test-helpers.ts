import { promises as fs } from 'fs'
import { existsSync } from 'fs'
import path from 'path'

/**
 * Validates that a JsonjsDB file content is valid (accepts both quote formats)
 */
export function validateJsonjsFile(
  content: string,
  tableName: string,
): boolean {
  try {
    const prefixes = [
      `jsonjs.data['${tableName}'] = `,
      `jsonjs.data["${tableName}"] = `,
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
 * Parses JsonjsDB file content and returns the data as matrix (array of arrays)
 */
export function parseJsonjsFile(
  content: string,
  tableName: string,
): unknown[][] {
  const expectedPrefix = `jsonjs.data['${tableName}'] = `
  if (!content.startsWith(expectedPrefix)) {
    throw new Error(`Invalid JsonjsDB file format for table: ${tableName}`)
  }

  let jsonContent = content.slice(expectedPrefix.length).trim()

  // Convert JavaScript single quotes to JSON double quotes
  // This handles Prettier formatting the fixture files
  jsonContent = jsonContent.replace(/'([^']*)'/g, '"$1"')

  // Remove trailing commas (not valid in JSON but Prettier adds them)
  jsonContent = jsonContent.replace(/,(\s*[\]}])/g, '$1')

  return JSON.parse(jsonContent)
} /**
 * Converts matrix format to objects (for comparison)
 */
export function matrixToObjects(
  matrix: unknown[][],
): Record<string, unknown>[] {
  if (!matrix || matrix.length === 0) return []
  const headers = matrix[0] as string[]
  const objects: Record<string, unknown>[] = []
  for (const row of matrix.slice(1)) {
    const obj: Record<string, unknown> = {}
    for (const [index, header] of headers.entries()) {
      obj[header] = row[index]
    }
    objects.push(obj)
  }
  return objects
}

/**
 * Compares two datasets ignoring order
 */
export function compareDatasets(
  dataset1: Record<string, unknown>[],
  dataset2: Record<string, unknown>[],
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
  expectedTables: string[],
): boolean {
  try {
    let data: Record<string, unknown>[]

    // Check if it's a .json.js file (starts with jsonjs.data)
    if (content.startsWith("jsonjs.data['__table__']")) {
      const matrix = parseJsonjsFile(content, '__table__')
      data = matrixToObjects(matrix)
    } else {
      // It's a plain .json file
      data = JSON.parse(content)
    }

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
 * All files including evolution.xlsx are copied to ensure test isolation
 */
export async function createTempTestExcelPath(
  tempDir: string,
): Promise<string> {
  const originalPath = getTestExcelPath()
  const tempExcelPath = path.join(tempDir, 'excel')

  // Create temp excel directory
  await fs.mkdir(tempExcelPath, { recursive: true })

  // Copy all Excel files to temp directory (including evolution.xlsx)
  // Each test works on its own copy to avoid modifying the original fixtures
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
      const matrix = parseJsonjsFile(content, tableName)
      results[tableName] = matrixToObjects(matrix)
    }
  }

  return results
}
