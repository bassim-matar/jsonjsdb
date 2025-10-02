import path from 'path'
import { promises as fs, existsSync } from 'fs'
import readExcel from 'read-excel-file/node'
import writeXlsxFile from 'write-excel-file/node'
import chokidar from 'chokidar'
import { evolutionSchema } from './evolutionSchema'
import { compareDatasets, EvolutionEntry } from './compareDatasets'
import {
  toObjects,
  toMatrix,
  readJsonjs,
  writeJsonjs,
  TableRow,
  Row,
} from './TableSerializer'

const tableIndex = '__table__'

type MetadataObj = Record<string, number>
type Path = string
type Extension = 'xlsx'

type MetadataItem = {
  name: string
  last_modif: number
}

export class JsonjsdbBuilder {
  private inputDb: Path
  private outputDb: Path
  private compact: boolean
  private extension: Extension
  private tableIndexFilename: string = `${tableIndex}.json.js`
  private tableIndexFile: Path
  private updateDbTimestamp: number
  private newEvoEntries: EvolutionEntry[]

  constructor(option: { compact?: boolean } = {}) {
    this.inputDb = ''
    this.outputDb = ''
    this.tableIndexFile = ''
    this.compact = option.compact ?? false
    this.extension = 'xlsx'
    this.updateDbTimestamp = 0
    this.newEvoEntries = []
  }

  public async updateDb(inputDb: Path): Promise<void> {
    this.setInputDb(inputDb)
    if (!existsSync(this.inputDb)) {
      console.error(`Jsonjsdb: input db folder doesn't exist: ${this.inputDb}`)
      return
    }

    this.updateDbTimestamp = Math.round(Date.now() / 1000)
    const [inputMetadata, outputMetadata] = await Promise.all([
      this.getInputMetadata(this.inputDb),
      this.getOutputMetadata(),
    ])
    await this.deleteOldFiles(inputMetadata)
    await this.updateTables(inputMetadata, outputMetadata)
    await this.saveEvolution(inputMetadata)
    await this.saveMetadata(inputMetadata, outputMetadata)
  }

  public watchDb(inputDb: Path): void {
    this.setInputDb(inputDb)
    chokidar
      .watch(this.inputDb, {
        ignored: /(^|[/\\])~$/,
        persistent: true,
        ignoreInitial: true,
      })
      .on('all', (event, path) => {
        if (path.includes('evolution.xlsx')) return false
        this.updateDb(inputDb)
      })

    console.log('Jsonjsdb watching changes in', this.inputDb)
  }

  public async setOutputDb(outputDb: Path): Promise<void> {
    this.outputDb = await this.ensureOutputDb(path.resolve(outputDb))
    this.tableIndexFile = path.join(this.outputDb, this.tableIndexFilename)
  }

  public getOutputDb(): Path {
    return this.outputDb
  }

  public getTableIndexFile(): Path {
    return this.tableIndexFile
  }

  public async updatePreview(
    subfolder: string,
    sourcePreview: Path,
  ): Promise<void> {
    const sourcePath = path.resolve(sourcePreview)
    const outputPath = path.join(this.outputDb, subfolder)
    if (!existsSync(outputPath)) await fs.mkdir(outputPath)
    const files = await fs.readdir(sourcePath)
    for (const fileName of files) {
      if (!fileName.endsWith(`.${this.extension}`)) continue
      if (fileName.startsWith('~$')) continue
      const filePath = path.join(sourcePath, fileName)
      const tableData = await readExcel(filePath)
      const name = fileName.split('.')[0]
      await writeJsonjs(outputPath, name, tableData, {
        compact: this.compact,
      })
    }
  }

  public async updateMdDir(mdDir: string, sourceDir: Path) {
    if (!existsSync(sourceDir)) return
    const files = await fs.readdir(sourceDir)
    for (const file of files) {
      if (!file.endsWith('.md')) continue
      const fileContent = await fs.readFile(path.join(sourceDir, file), 'utf8')
      const outFileName = file.split('.md')[0]
      const outDir = path.join(this.outputDb, mdDir)
      if (!existsSync(outDir)) await fs.mkdir(outDir, { recursive: true })
      const outFilePath = path.join(outDir, `${outFileName}.json.js`)
      const json = JSON.stringify([{ content: fileContent }])
      const jsonjs = `jsonjs.data["${outFileName}"] = \n` + json
      await fs.writeFile(outFilePath, jsonjs, 'utf8')
    }
  }

  private setInputDb(inputDb: Path): void {
    this.inputDb = path.resolve(inputDb)
  }
  private async getInputMetadata(folderPath: Path): Promise<MetadataItem[]> {
    try {
      const files = await fs.readdir(folderPath)
      const fileModifTimes = []
      for (const fileName of files) {
        if (!fileName.endsWith(`.${this.extension}`)) continue
        if (fileName.startsWith('~$')) continue
        const filePath = path.join(folderPath, fileName)
        const stats = await fs.stat(filePath)
        const name = fileName.split('.')[0]
        fileModifTimes.push({
          name,
          last_modif: Math.round(stats.mtimeMs / 1000),
        })
      }
      return fileModifTimes
    } catch (error) {
      console.error('Jsonjsdb: get_files_lastModif error:', error)
      return []
    }
  }

  private async getOutputMetadata(): Promise<MetadataItem[]> {
    let tablesMetadata = []
    if (existsSync(this.tableIndexFile)) {
      const fileContent = await fs.readFile(this.tableIndexFile, 'utf-8')
      try {
        const lines = fileContent.split('\n')
        lines.shift()
        tablesMetadata = JSON.parse(lines.join('\n'))
      } catch (e) {
        console.error(`Jsonjsdb: error reading ${this.tableIndexFile}: ${e}`)
      }
    }
    return tablesMetadata
  }

  private metadataListToObject(list: MetadataItem[]): MetadataObj {
    return list.reduce((acc: MetadataObj, row) => {
      acc[row.name] = row.last_modif
      return acc
    }, {})
  }

  private async ensureOutputDb(outputDb: Path): Promise<Path> {
    if (!existsSync(outputDb)) {
      await fs.mkdir(outputDb)
      return outputDb
    }
    const items = await fs.readdir(outputDb, { withFileTypes: true })
    const files = items.filter(
      item => item.isFile() && item.name.endsWith('.json.js'),
    ).length
    if (files > 0) return outputDb
    const folders = items.filter(item => item.isDirectory())
    if (folders.length !== 1) return outputDb
    return (outputDb = path.join(outputDb, folders[0].name))
  }

  private async deleteOldFiles(
    inputMetadata: MetadataItem[],
  ): Promise<boolean> {
    const deletePromises = []
    const inputMetadataObj = this.metadataListToObject(inputMetadata)
    const outputFiles = await fs.readdir(this.outputDb)
    for (const fileName of outputFiles) {
      const table = fileName.split('.')[0]
      if (!fileName.endsWith(`.json.js`)) continue
      if (fileName === `${tableIndex}.json.js`) continue
      if (table in inputMetadataObj) continue
      if (table === 'evolution') continue
      const filePath = path.join(this.outputDb, fileName)
      console.log(`Jsonjsdb: deleting ${table}`)
      deletePromises.push(fs.unlink(filePath))
    }
    await Promise.all(deletePromises)
    return deletePromises.length > 0
  }

  private async saveMetadata(
    inputMetadata: MetadataItem[],
    outputMetadata: MetadataItem[],
  ): Promise<void> {
    outputMetadata = outputMetadata.filter(row => row.name !== tableIndex)
    if (JSON.stringify(inputMetadata) === JSON.stringify(outputMetadata)) return
    let content = `jsonjs.data['${tableIndex}'] = \n`
    inputMetadata.push({
      name: tableIndex,
      last_modif: Math.round(Date.now() / 1000),
    })
    content += JSON.stringify(inputMetadata, null, 2)
    await fs.writeFile(this.tableIndexFile, content, 'utf-8')
  }

  private async updateTables(
    inputMetadata: MetadataItem[],
    outputMetadata: MetadataItem[],
  ): Promise<boolean> {
    const outputMetadataObj = this.metadataListToObject(outputMetadata)
    const updatePromises = []
    for (const row of inputMetadata) {
      const isInOutput = row.name in outputMetadataObj
      if (isInOutput && outputMetadataObj[row.name] >= row.last_modif) continue
      if (row.name === 'evolution') continue
      updatePromises.push(this.updateTable(row.name))
    }
    this.newEvoEntries = []
    await Promise.all(updatePromises)
    return updatePromises.length > 0
  }

  private async saveEvolution(inputMetadata: MetadataItem[]): Promise<void> {
    const evolutionFileJsonjs = path.join(this.outputDb, `evolution.json.js`)
    const evolutionFile = path.join(this.inputDb, `evolution.xlsx`)
    if (this.newEvoEntries.length > 0) {
      let evolution: TableRow[] = []
      if (existsSync(evolutionFile)) {
        const evolutionRaw = await readExcel(evolutionFile)
        evolution = toObjects(evolutionRaw as Row[])
      }
      evolution.push(
        ...this.newEvoEntries.map(entry => entry as unknown as TableRow),
      )
      const evolutionList = toMatrix(evolution as TableRow[])
      await writeJsonjs(this.outputDb, 'evolution', evolutionList, {
        compact: this.compact,
      })
      await writeXlsxFile(evolution, {
        schema: evolutionSchema,
        filePath: evolutionFile,
      })
    }

    if (existsSync(evolutionFileJsonjs)) {
      let evoFound = false
      for (const inputMetadataRow of inputMetadata) {
        if (inputMetadataRow.name === 'evolution') {
          evoFound = true
          if (this.newEvoEntries.length > 0) {
            inputMetadataRow.last_modif = this.updateDbTimestamp
          }
        }
      }
      if (!evoFound) {
        inputMetadata.push({
          name: 'evolution',
          last_modif: this.updateDbTimestamp,
        })
      }
    }
  }

  private async updateTable(table: string): Promise<void> {
    const inputFile = path.join(this.inputDb, `${table}.xlsx`)
    const tableData = await readExcel(inputFile)
    await this.addNewEvoEntries(table, tableData)
    await writeJsonjs(this.outputDb, table, tableData, {
      compact: this.compact,
    })
    console.log(`Jsonjsdb updating ${table}`)
  }

  private async addNewEvoEntries(
    table: string,
    tableData: Row[],
  ): Promise<void> {
    const oldTableData = await readJsonjs(
      path.join(this.outputDb, `${table}.json.js`),
    )
    const newEvoEntries = compareDatasets(
      oldTableData,
      toObjects(tableData),
      this.updateDbTimestamp,
      table,
    )
    this.newEvoEntries.push(...newEvoEntries)
  }
}
