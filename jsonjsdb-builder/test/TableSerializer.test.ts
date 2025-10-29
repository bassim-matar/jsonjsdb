import { describe, it, expect, afterAll } from 'vitest'
import {
  jsonjsdbToObjects,
  jsonjsdbToMatrix,
  jsonjsdbWrite as jsonjsdbWriteFile,
  jsonjsdbRead,
} from '../src/index.js'
import { promises as fs } from 'fs'
import path from 'path'
import { validateJsonjsFile, parseJsonjsFile } from './test-helpers.js'

/**
 * Unit tests for TableSerializer utilities
 */

describe('TableSerializer utilities', () => {
  const tempDirs: string[] = []

  afterAll(async () => {
    // Cleanup created temp directories
    for (const dir of tempDirs) {
      try {
        await fs.rm(dir, { recursive: true, force: true })
      } catch {
        /* ignore */
      }
    }
  })
  it('toObjects should convert matrix to list of objects', () => {
    const matrix = [
      ['id', 'name', 'age'],
      [1, 'Alice', 30],
      [2, 'Bob', 25],
    ]
    const objs = jsonjsdbToObjects(matrix)
    expect(objs).toEqual([
      { id: 1, name: 'Alice', age: 30 },
      { id: 2, name: 'Bob', age: 25 },
    ])
  })

  it('toMatrix should convert list of objects to matrix', () => {
    const objects = [
      { id: 1, name: 'Alice', age: 30 },
      { id: 2, name: 'Bob', age: 25 },
    ]
    const matrix = jsonjsdbToMatrix(objects)
    // First row is headers, order may depend on object key order
    expect(matrix[0]).toEqual(['id', 'name', 'age'])
    expect(matrix.slice(1)).toEqual([
      [1, 'Alice', 30],
      [2, 'Bob', 25],
    ])
  })

  it('write + read should persist and parse data (pretty mode)', async () => {
    const tmpDir = path.join(process.cwd(), 'test/fixtures/temp-serializer')
    await fs.mkdir(tmpDir, { recursive: true })
    tempDirs.push(tmpDir)

    const matrix = [
      ['id', 'value'],
      [1, 'Hello'],
      [2, 'World'],
    ]
    await jsonjsdbWriteFile(tmpDir, 'sample', matrix)

    const filePath = path.join(tmpDir, 'sample.json.js')
    const content = await fs.readFile(filePath, 'utf-8')
    expect(validateJsonjsFile(content, 'sample')).toBe(true)

    const parsed = parseJsonjsFile(content, 'sample')
    expect(parsed).toEqual([
      ['id', 'value'],
      [1, 'Hello'],
      [2, 'World'],
    ])
  })

  it('readJsonjs should return [] for missing file', async () => {
    const missing = await jsonjsdbRead('non_existent_file.json.js')
    expect(missing).toEqual([])
  })

  it('round trip objects -> matrix -> objects is stable', () => {
    const matrix = [
      ['a', 'b'],
      ['x', 1],
      ['y', 2],
    ]
    const objects = jsonjsdbToObjects(matrix)
    const back = jsonjsdbToMatrix(objects)
    expect(jsonjsdbToObjects(back)).toEqual(objects)
  })
})
