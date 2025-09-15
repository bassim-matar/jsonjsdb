import path from 'path'
import { promises as fs, existsSync } from 'fs'
import readExcel from 'read-excel-file/node'
import writeXlsxFile from 'write-excel-file/node'
import chokidar from 'chokidar'
import { type PluginOption } from 'vite'
import { compareDatasets, EvolutionEntry } from './compareDatasets'

const tableIndex = '__table__'

type MetadataObj = Record<string, number>
type TableRow = Record<string, unknown>
type Path = string
type Extension = 'xlsx'
type Row = unknown[]

interface MetadataItem {
  name: string
  last_modif: number
}

const schema = [
  {
    column: 'timestamp',
    type: Number,
    value: (row: EvolutionEntry) => row.timestamp,
  },
  {
    column: 'type',
    type: String,
    value: (row: EvolutionEntry) => row.type,
  },
  {
    column: 'entity',
    type: String,
    value: (row: EvolutionEntry) => String(row.entity),
  },
  {
    column: 'entity_id',
    type: String,
    value: (row: EvolutionEntry) => String(row.entity_id || ''),
  },
  {
    column: 'parent_entity_id',
    type: String,
    value: (row: EvolutionEntry) => String(row.parent_entity_id || ''),
  },
  {
    column: 'variable',
    type: String,
    value: (row: EvolutionEntry) => String(row.variable || ''),
  },
  {
    column: 'old_value',
    type: String,
    value: (row: EvolutionEntry) => String(row.old_value || ''),
  },
  {
    column: 'new_value',
    type: String,
    value: (row: EvolutionEntry) => String(row.new_value || ''),
  },
  {
    column: 'name',
    type: String,
    value: (row: EvolutionEntry) => String(row.name || ''),
  },
]

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

    this.updateDbTimestamp = Date.now()
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

  public async updatePreview(
    subfolder: string,
    sourcePreview: Path
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
      this.writeTable(tableData, outputPath, name)
    }
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
      item => item.isFile() && item.name.endsWith('.json.js')
    ).length
    if (files > 0) return outputDb
    const folders = items.filter(item => item.isDirectory())
    if (folders.length !== 1) return outputDb
    return (outputDb = path.join(outputDb, folders[0].name))
  }

  private async deleteOldFiles(
    inputMetadata: MetadataItem[]
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
    outputMetadata: MetadataItem[]
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
    outputMetadata: MetadataItem[]
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
        evolution = this.convertToListOfObjects(evolutionRaw as Row[])
      }
      evolution.push(
        ...this.newEvoEntries.map(entry => entry as unknown as TableRow)
      )
      const evolutionList = this.convertToListOfLists(evolution)
      this.writeTable(evolutionList, this.outputDb, 'evolution')
      await writeXlsxFile(evolution, { schema, filePath: evolutionFile })
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
    await this.writeTable(tableData, this.outputDb, table)
    console.log(`Jsonjsdb updating ${table}`)
  }

  private async addNewEvoEntries(
    table: string,
    tableData: Row[]
  ): Promise<void> {
    const oldTableData = await this.readJsonjs(
      path.join(this.outputDb, `${table}.json.js`)
    )
    const newEvoEntries = compareDatasets(
      oldTableData,
      this.convertToListOfObjects(tableData),
      this.updateDbTimestamp,
      table
    )
    this.newEvoEntries.push(...newEvoEntries)
  }

  private async writeTable(
    tableData: Row[],
    outputPath: Path,
    name: string
  ): Promise<void> {
    let content = `jsonjs.data['${name}'] = \n`
    if (this.compact) {
      content += JSON.stringify(tableData)
    } else {
      const tableDataObj = this.convertToListOfObjects(tableData)
      content += JSON.stringify(tableDataObj, null, 2)
    }
    const outputFile = path.join(outputPath, `${name}.json.js`)
    await fs.writeFile(outputFile, content, 'utf-8')
  }

  private convertToListOfObjects(data: Row[]): TableRow[] {
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

  private convertToListOfLists(objects: TableRow[]): Row[] {
    if (objects.length === 0) return []
    const headers = Object.keys(objects[0])
    const rows: Row[] = [headers]
    for (const obj of objects) {
      const row = headers.map(header => obj[header])
      rows.push(row as unknown[])
    }
    return rows
  }

  private async readJsonjs(path: Path): Promise<TableRow[]> {
    if (!existsSync(path)) return []
    const jsData = await fs.readFile(path, 'utf8')
    const jsonString = jsData.slice(jsData.indexOf('\n') + 1)
    const data = JSON.parse(jsonString)
    if (data.length > 0 && Array.isArray(data[0])) {
      return this.convertToListOfObjects(data)
    }
    return data
  }
}

class JsonjsdbWatcherClass {
  private outputDb: Path
  private jdbBuilder: JsonjsdbBuilder
  constructor() {
    this.outputDb = ''
    this.jdbBuilder = new JsonjsdbBuilder()
  }
  isDev() {
    return process.env.NODE_ENV === 'development'
  }
  async setDb(outputDb: Path) {
    await this.jdbBuilder.setOutputDb(outputDb)
    this.outputDb = this.jdbBuilder.getOutputDb()
  }
  async watch(inputDb: Path, evenProd: boolean = false) {
    await this.jdbBuilder.updateDb(inputDb)
    if (this.isDev() || evenProd) this.jdbBuilder.watchDb(inputDb)
  }
  async updatePreview(subfolder: string, sourcePreview: Path) {
    await this.jdbBuilder.updatePreview(subfolder, sourcePreview)
  }
  getTableIndexFilePath() {
    return this.jdbBuilder.getTableIndexFile()
  }
  async updateMdFiles(mdDir: string, sourceDir: Path) {
    if (!existsSync(sourceDir)) return
    const files = await fs.readdir(sourceDir)
    for (const file of files) {
      if (!file.endsWith('.md')) continue
      const fileContent = await fs.readFile(`${sourceDir}/${file}`, 'utf8')
      const outFileName = file.split('.md')[0]
      const outFilePath = `${this.outputDb}/${mdDir}/${outFileName}.json.js`
      const json = JSON.stringify([{ content: fileContent }])
      const jsonjs = `jsonjs.data["${outFileName}"] = \n` + json
      await fs.writeFile(outFilePath, jsonjs, 'utf8')
    }
  }
}
export const jsonjsdbWatcher = new JsonjsdbWatcherClass()

export function jsonjsdbAddConfig(config: Path): PluginOption {
  return {
    name: 'jsonjsdbAddConfig',
    transformIndexHtml: {
      order: 'post',
      handler: async (html: string) => {
        return html + '\n' + (await fs.readFile(config, 'utf8'))
      },
    },
  }
}
