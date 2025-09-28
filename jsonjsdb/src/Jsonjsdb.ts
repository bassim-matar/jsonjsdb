import DBrowser from './DBrowser'
import Loader from './Loader'
import IntegrityChecker from './IntegrityChecker'
import type { IntegrityResult } from './types'

interface JsonjsdbConfig {
  path: string
  dbKey: string | boolean
  browserKey: string | boolean
  appName: string
  useCache: boolean
  useEncryption: boolean
}

type PartialJsonjsdbConfig = Partial<JsonjsdbConfig>

interface DatabaseRow {
  id: string | number
  [key: string]: unknown
}

interface DatabaseIndex {
  [tableName: string]: {
    [fieldName: string]: {
      [value: string | number]: number | number[]
    }
  }
}

interface DatabaseTables {
  __index__: DatabaseIndex
  [tableName: string]: DatabaseRow[] | DatabaseIndex
}

interface InitOption {
  filter?: {
    entity?: string
    variable?: string
    values?: string[]
  }
  aliases?: Array<{ table: string; alias: string }>
  useCache?: boolean
  version?: number | string
  limit?: number
}

interface ForeignTableObj {
  [tableName: string]: string | number | { id: string | number }
}

export default class Jsonjsdb<
  TEntityTypeMap extends Record<string, DatabaseRow> = Record<
    string,
    DatabaseRow
  >,
> {
  defaultConfig: JsonjsdbConfig
  config!: JsonjsdbConfig
  browser: DBrowser
  loader: Loader
  integrityChecker: IntegrityChecker
  tables!: DatabaseTables
  db!: Record<string, unknown>
  private _use: Partial<Record<keyof TEntityTypeMap, boolean>> = {}
  private _useRecursive: Partial<Record<keyof TEntityTypeMap, boolean>> = {}

  constructor(config?: string | PartialJsonjsdbConfig) {
    this.defaultConfig = {
      path: 'db',
      dbKey: false,
      browserKey: false,
      appName: 'jsonjsdb',
      useCache: false,
      useEncryption: false,
    }

    let processedConfig: PartialJsonjsdbConfig = {}
    if (typeof config === 'string') {
      const htmlConfig = this.getHtmlConfig(config)
      processedConfig = htmlConfig || {}
    } else if (config) {
      processedConfig = config
    }

    this.setConfig(processedConfig)
    this.browser = new DBrowser(
      this.config.browserKey as string,
      this.config.appName,
      this.config.useEncryption,
    )
    this.loader = new Loader(this.browser)
    this.integrityChecker = new IntegrityChecker()
  }
  private getHtmlConfig(
    id = '#jsonjsdb-config',
  ): PartialJsonjsdbConfig | false {
    const configElement = document.querySelector(id) as HTMLElement
    if (!configElement) return false

    const { dataset } = configElement
    const config: PartialJsonjsdbConfig = {}

    if (dataset.path) config.path = dataset.path
    if (dataset.dbKey)
      config.dbKey = dataset.dbKey === 'false' ? false : dataset.dbKey
    if (dataset.browserKey)
      config.browserKey =
        dataset.browserKey === 'false' ? false : dataset.browserKey
    if (dataset.appName) config.appName = dataset.appName
    if (dataset.useCache) config.useCache = dataset.useCache === 'true'
    if (dataset.useEncryption)
      config.useEncryption = dataset.useEncryption === 'true'

    return config
  }
  private setConfig(config: PartialJsonjsdbConfig): void {
    this.config = { ...this.defaultConfig, ...config }

    if (window?.location.protocol.startsWith('http')) {
      this.config.useCache = false
    }
    if (this.config.dbKey) {
      this.config.path += '/' + this.config.dbKey
    }
  }

  async init(option: InitOption = {}): Promise<Jsonjsdb<TEntityTypeMap>> {
    this.tables = (await this.loader.load(
      this.config.path,
      this.config.useCache,
      option,
    )) as DatabaseTables
    this.computeUsage()
    return this
  }
  async load(filePath: string, name: string): Promise<unknown[]> {
    filePath = this.config.path + '/' + filePath
    const data = await this.loader.loadJsonjs(filePath, name)
    return data
  }
  get<K extends keyof TEntityTypeMap>(
    table: K,
    id: string | number,
  ): TEntityTypeMap[K] | undefined {
    try {
      const tableStr = String(table)
      const tableData = this.tables[tableStr]
      if (!Array.isArray(tableData)) return undefined

      const indexValue = this.tables.__index__[tableStr].id[id]
      if (typeof indexValue !== 'number') return undefined

      const result = tableData[indexValue] as DatabaseRow
      if (!result) {
        console.error(`table ${String(table)}, id not found: ${id}`)
      }
      return result as TEntityTypeMap[K]
    } catch {
      const tableStr = String(table)
      if (!this.tables[tableStr]) {
        console.error(`table ${tableStr} not found`)
      } else if (!this.tables.__index__[tableStr]) {
        console.error(`table ${tableStr} not found in __index__`)
      } else if (!('id' in this.tables.__index__[tableStr])) {
        console.error(`table ${tableStr}, props "id" not found in __index__`)
      } else {
        console.error(`error not handled`)
      }
      return undefined
    }
  }
  getAll<K extends keyof TEntityTypeMap>(
    table: K,
    foreignTableObj?: ForeignTableObj,
    option: InitOption = {},
  ): TEntityTypeMap[K][] {
    const tableStr = String(table)
    const tableData = this.tables[tableStr]
    if (!Array.isArray(tableData)) return []

    if (!foreignTableObj) {
      if (option.limit) {
        return tableData.slice(0, option.limit) as TEntityTypeMap[K][]
      }
      return tableData as TEntityTypeMap[K][]
    }

    const foreignTableObjStart = Object.entries(foreignTableObj)[0]
    const foreignTable = foreignTableObjStart[0]
    let foreignValue: string | number | { id: string | number } =
      foreignTableObjStart[1]

    if (
      typeof foreignValue === 'object' &&
      foreignValue !== null &&
      'id' in foreignValue
    ) {
      foreignValue = foreignValue.id
    } else {
      foreignValue = foreignValue as string | number
    }

    let foreignKey = foreignTable + '_id'
    if (foreignTable === table) foreignKey = 'parent_id'

    const indexAll = this.tables.__index__[tableStr][foreignKey]
    if (!indexAll || !(foreignValue in indexAll)) return []
    const indexes = indexAll[foreignValue]

    if (!Array.isArray(indexes)) {
      if (typeof indexes !== 'number' || !tableData[indexes]) {
        console.error('get_all() table', tableStr, 'has an index undefined')
        return []
      }
      return [tableData[indexes] as TEntityTypeMap[K]]
    }

    const variables: TEntityTypeMap[K][] = []
    for (const index of indexes) {
      if (option.limit && variables.length >= option.limit) break
      if (!tableData[index]) {
        console.error('get_all() table', tableStr, 'has an index undefined')
        continue
      }
      variables.push(tableData[index] as TEntityTypeMap[K])
    }
    return variables
  }
  getAllChilds<K extends keyof TEntityTypeMap>(
    table: K,
    itemId: string | number,
  ): TEntityTypeMap[K][] {
    const tableStr = String(table)
    const tableData = this.tables[tableStr]
    if (!Array.isArray(tableData)) return []

    let all: TEntityTypeMap[K][] = []
    if (!itemId) {
      console.error('getAllChilds()', tableStr, 'id', itemId)
      return all
    }
    const childs = this.getAll(table, { [tableStr]: itemId })
    all = all.concat(childs)
    for (const child of childs) {
      const childRow = child as DatabaseRow
      if (itemId === childRow.id) {
        const msg = 'infinite loop for id'
        console.error('getAllChilds()', tableStr, msg, itemId)
        return all
      }
      const newChilds = this.getAllChilds(table, childRow.id as string | number)
      all = all.concat(newChilds)
    }
    return all
  }
  foreach<K extends keyof TEntityTypeMap>(
    table: K,
    callback: (row: TEntityTypeMap[K]) => void,
  ): void {
    const rows = this.getAll(table)
    for (const row of rows) callback(row)
  }
  tableHasId(table: string, id: string | number): boolean {
    if (!this.tables[table]) return false
    if (!this.tables.__index__[table]) return false
    if (!this.tables.__index__[table].id) return false
    return id in this.tables.__index__[table].id
  }
  getConfig(id: string | number): string | number | undefined {
    const configTable = this.tables['config']
    if (!Array.isArray(configTable)) return undefined

    const index = this.tables.__index__['config'].id
    if (!index) return undefined
    if (!(id in index)) return undefined

    const indexValue = index[id]
    if (typeof indexValue !== 'number') return undefined

    const row = configTable[indexValue] as DatabaseRow
    return row['value'] as string | number
  }
  hasNb(table: string, id: string | number, nbWhat: string): number {
    if (!(nbWhat in this.tables.__index__)) return 0
    const index = this.tables.__index__[nbWhat][table + '_id']
    if (!index) return 0
    if (!(id in index)) return 0
    const indexValue = index[id]
    if (!Array.isArray(indexValue)) return 1
    return indexValue.length
  }
  getParents<K extends keyof TEntityTypeMap>(
    from: K,
    id: string | number,
  ): TEntityTypeMap[K][] {
    if (!id || id === null) return []
    let parent = this.get(from, id)
    if (!parent) return []

    const parents: TEntityTypeMap[K][] = []
    const iterationMax = 30
    let iterationNum = 0

    while (iterationNum < iterationMax) {
      iterationNum += 1
      const parentRow = parent as DatabaseRow
      const parentId = parentRow.parent_id

      if ([0, '', null].includes(parentId as string | number))
        return parents.reverse()

      const parentBefore = parent
      parent = this.get(from, parentId as string | number)
      if (!parent) {
        const parentBeforeRow = parentBefore as DatabaseRow
        console.error(
          'get_parents() type',
          String(from),
          'cannot find id',
          parentBeforeRow.parent_id,
        )
        return []
      }
      parents.push(parent)
    }
    console.error('get_parents()', String(from), id, 'iteration_max reached')
    return []
  }
  addMeta(userData?: Record<string, unknown>, dbSchema?: string[][]): void {
    this.loader.addMeta(userData, dbSchema)
  }
  getLastModifTimestamp(): number {
    return this.loader.getLastModifTimestamp()
  }

  get use(): Partial<Record<keyof TEntityTypeMap, boolean>> {
    return this._use
  }

  get useRecursive(): Partial<Record<keyof TEntityTypeMap, boolean>> {
    return this._useRecursive
  }

  private computeUsage(): void {
    this._use = {}
    this._useRecursive = {}

    for (const entity in this.tables) {
      const table = this.tables[entity]
      if (!Array.isArray(table)) continue
      if (table.length === 0) continue
      if (entity.includes('_')) continue
      ;(this._use as Record<string, boolean>)[entity] = true

      const firstItem = table[0]
      if (
        firstItem &&
        typeof firstItem === 'object' &&
        'parent_id' in firstItem
      ) {
        ;(this._useRecursive as Record<string, boolean>)[entity] = true
      }
    }
  }

  async checkIntegrity(): Promise<IntegrityResult> {
    await this.loader.loadTables(this.config.path, false)
    this.db = this.loader.db
    return this.integrityChecker.check(
      this.db as Parameters<typeof this.integrityChecker.check>[0],
    )
  }
}
