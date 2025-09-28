import path from 'path'
import { promises as fs, existsSync } from 'fs'

export type TableRow = Record<string, unknown>
export type Row = unknown[]

// Converts a 2D matrix (first row headers) into list of objects
export function toObjects(data: Row[]): TableRow[] {
  if (!data || data.length === 0) return []
  const headers = data[0] as string[]
  const objects: TableRow[] = []
  for (const row of data.slice(1)) {
    const obj: TableRow = {}
    for (const [index, header] of headers.entries()) {
      obj[header] = row[index]
    }
    objects.push(obj)
  }
  return objects
}

// Converts list of objects to a 2D matrix (first row headers)
export function toMatrix(objects: TableRow[]): Row[] {
  if (!objects || objects.length === 0) return []
  const headers = Object.keys(objects[0])
  const rows: Row[] = [headers]
  for (const obj of objects) {
    const row = headers.map(header => obj[header])
    rows.push(row as unknown[])
  }
  return rows
}

// Reads a jsonjs file and returns list of objects
export async function readJsonjs(filePath: string): Promise<TableRow[]> {
  if (!existsSync(filePath)) return []
  const jsData = await fs.readFile(filePath, 'utf8')
  const jsonString = jsData.slice(jsData.indexOf('\n') + 1)
  const data = JSON.parse(jsonString)
  if (data.length > 0 && Array.isArray(data[0])) {
    return toObjects(data as Row[])
  }
  return data
}

// Helper to write directly to disk
export async function writeJsonjs(
  outputDir: string,
  name: string,
  data: Row[] | TableRow[],
  options: { compact?: boolean; alreadyObjects?: boolean } = {},
): Promise<string> {
  const { compact = false, alreadyObjects = false } = options
  let content = `jsonjs.data['${name}'] = \n`
  if (compact) {
    content += JSON.stringify(data)
  } else if (alreadyObjects) {
    content += JSON.stringify(data, null, 2)
  } else {
    content += JSON.stringify(toObjects(data as Row[]), null, 2)
  }
  const outputFile = path.join(outputDir, `${name}.json.js`)
  await fs.writeFile(outputFile, content, 'utf-8')
  return outputFile
}
