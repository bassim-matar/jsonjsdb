import DBrowser from './DBrowser'

interface TableInfo {
  name: string
  last_modif?: string | number
}

interface LoadOption {
  filter?: {
    entity?: string
    variable?: string
    values?: string[]
  }
  aliases?: Array<{ table: string; alias: string }>
  use_cache?: boolean
  version?: number | string
}

declare global {
  interface Window {
    jsonjs: {
      data?: Record<string, unknown[]>
    }
  }
}

export default class Loader {
  private tableIndex = '__table__'
  private metaTables = [
    '__metaFolder__',
    '__metaDataset__',
    '__metaVariable__',
    '__meta_schema__',
  ]
  private cachePrefix = 'db_cache/'

  private browser: DBrowser
  private tableIndexCache?: Record<string, string | number | undefined>
  private lastModifTimestamp?: number
  private metaVariable: Record<string, unknown> = {}

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public db: Record<string, any> = {}

  constructor(browser: DBrowser) {
    window.jsonjs = {}
    this.browser = browser
  }
  async load(
    path: string,
    useCache = false,
    option: LoadOption = {}
  ): Promise<Record<string, unknown>> {
    await this.loadTables(path, useCache)
    this.normalizeSchema()
    if (option.filter?.values?.length && option.filter.values.length > 0) {
      this.filter(option.filter)
    }
    this.createAlias(option.aliases)
    this.createIndex()
    return this.db
  }
  async loadFromCache(tableName: string): Promise<unknown[]> {
    return this.browser.get(this.cachePrefix + tableName) as Promise<unknown[]>
  }
  async saveToCache(
    data: unknown[] | Record<string, unknown>,
    tableName: string
  ): Promise<void> {
    this.browser.set(this.cachePrefix + tableName, data)
  }
  async loadFromFile(
    path: string,
    tableName: string,
    option?: LoadOption
  ): Promise<unknown[]> {
    const script = document.createElement('script')
    let src = path + '/' + tableName + '.json.js?v='
    src += option && option.version ? option.version : Math.random()
    script.src = src
    script.async = false
    return new Promise((resolve, reject) => {
      script.onload = () => {
        if (
          !(tableName in window.jsonjs.data!) ||
          window.jsonjs.data![tableName] === undefined
        ) {
          const errorMsg = `jsonjs.data.${tableName} not found in table ${tableName}`
          console.error(errorMsg)
          reject(new Error(errorMsg))
          return
        }
        let data = window.jsonjs.data![tableName]
        delete window.jsonjs.data![tableName]
        if (data.length > 0 && Array.isArray(data[0])) {
          data = this.arrayToObject(data as unknown[][])
        }
        resolve(data)
        document.querySelectorAll(`script[src="${src}"]`)[0].remove()
        if (option && option.use_cache) {
          this.saveToCache(data, tableName)
        }
      }
      script.onerror = () => {
        const errorMsg = `table "${tableName}" not found in path "${path}"`
        delete window.jsonjs.data![tableName]
        console.error(errorMsg)
        reject(new Error(errorMsg))
        return
      }
      document.head.appendChild(script)
    })
  }
  private arrayToObject(data: unknown[][]): Record<string, unknown>[] {
    const [headers, ...rows] = data
    const headerArray = headers as unknown[]
    const rowArrays = rows as unknown[][]

    return rowArrays.map((row): Record<string, unknown> => {
      const rowArray = row as unknown[]
      return rowArray.reduce<Record<string, unknown>>((acc, item, index) => {
        const key = headerArray[index] as string
        return { ...acc, [key]: item }
      }, {})
    })
  }
  private isInCache(tableName: string, version?: number | string): boolean {
    if (!this.tableIndexCache) return false
    if (!(tableName in this.tableIndexCache)) return false
    if (this.tableIndexCache[tableName] !== version) return false
    return true
  }
  async loadJsonjs(
    path: string,
    tableName: string,
    option?: { use_cache: boolean; version: number | string }
  ): Promise<unknown[]> {
    if (path.slice(-1) === '/') path = path.slice(0, -1)
    if (window.jsonjs === undefined) window.jsonjs = {}
    if (window.jsonjs.data === undefined) window.jsonjs.data = {}
    if (option?.use_cache && this.isInCache(tableName, option.version)) {
      return this.loadFromCache(tableName)
    } else {
      return this.loadFromFile(path, tableName, option)
    }
  }
  async loadTables(path: string, useCache: boolean): Promise<void> {
    let tablesInfo = (await this.loadJsonjs(
      path,
      this.tableIndex
    )) as TableInfo[]
    tablesInfo = this.checkConformity(tablesInfo)
    tablesInfo = this.extractLastModif(tablesInfo)
    if (useCache) {
      this.tableIndexCache = (await this.browser.get(
        this.cachePrefix + this.tableIndex
      )) as Record<string, string | number | undefined>
      const newTableIndexCache = tablesInfo.reduce((acc, item) => {
        return { ...acc, [item.name]: item.last_modif }
      }, {} as Record<string, string | number | undefined>)
      this.saveToCache(newTableIndexCache, this.tableIndex)
    }
    const schema = {
      aliases: [],
      one_to_one: [],
      one_to_many: [],
      many_to_many: [],
    }
    this.db = {
      [this.tableIndex]: tablesInfo,
      __schema__: schema,
      __user_data__: {},
    }
    const promises = []
    const tables = []
    for (const table of tablesInfo) {
      tables.push({ name: table.name })
      promises.push(
        this.loadJsonjs(path, table.name, {
          version: table.last_modif ?? Date.now(),
          use_cache: useCache,
        })
      )
    }
    const tablesData = await Promise.all(promises)
    for (const [i, tableData] of tablesData.entries()) {
      this.db[tables[i].name] = tableData
    }
  }
  getLastModifTimestamp(): number {
    return this.lastModifTimestamp || 0
  }
  extractLastModif(tablesInfo: TableInfo[]): TableInfo[] {
    const tableIndexRow = tablesInfo.filter(
      item => item.name === this.tableIndex
    )
    if (tableIndexRow.length > 0 && tableIndexRow[0].last_modif) {
      this.lastModifTimestamp = tableIndexRow[0].last_modif as number
    }
    return tablesInfo.filter(item => item.name !== this.tableIndex)
  }
  checkConformity(tablesInfo: TableInfo[]): TableInfo[] {
    const validatedTables: TableInfo[] = []
    const allNames: string[] = []
    for (const table of tablesInfo) {
      if (!('name' in table)) {
        console.error('table name not found in meta', table)
        continue
      }
      if (allNames.includes(table.name)) {
        console.error('table name already exists in meta', table)
        continue
      }
      allNames.push(table.name)
      validatedTables.push(table)
    }
    return validatedTables
  }
  normalizeSchema() {
    for (const table of this.db[this.tableIndex]) {
      if (this.db[table.name].length === 0) continue
      for (const variable in this.db[table.name][0]) {
        if (!variable.endsWith('_ids')) continue
        const entityDest = variable.slice(0, -4)
        if (!(entityDest in this.db)) continue
        const relationTable = table.name + '_' + entityDest
        if (!(relationTable in this.db)) {
          this.db[this.tableIndex].push({ name: relationTable })
          this.db[relationTable] = []
        }
        for (const row of this.db[table.name]) {
          if (!row[variable]) continue
          const ids =
            typeof row[variable] === 'string' ? row[variable].split(',') : []
          if (ids.length === 0) continue
          for (const id of ids) {
            this.db[relationTable].push({
              [table.name + '_id']: row.id,
              [entityDest + '_id']: id.trim(),
            })
          }
        }
      }
    }
  }
  filter(filter: { entity?: string; variable?: string; values?: unknown[] }) {
    if (!('entity' in filter) || !filter.entity) return false
    if (!('variable' in filter) || !filter.variable) return false
    if (!('values' in filter) || !filter.values) return false
    if (!(filter.entity in this.db)) return false

    const idToDelete: string[] = []
    for (const item of this.db[filter.entity]) {
      if (filter.values.includes(item[filter.variable])) {
        idToDelete.push(item.id)
      }
    }
    this.db[filter.entity] = this.db[filter.entity].filter(
      (item: Record<string, unknown>) => !idToDelete.includes(item.id as string)
    )
    for (const table of this.db[this.tableIndex]) {
      if (this.db[table.name].length === 0) continue
      if (!(filter.entity + '_id' in this.db[table.name][0])) continue
      const idToDeleteLevel2: string[] = []
      for (const item of this.db[table.name]) {
        if (idToDelete.includes(item[filter.entity + '_id'])) {
          idToDeleteLevel2.push(item.id)
        }
      }
      this.db[table.name] = this.db[table.name].filter(
        (item: Record<string, unknown>) =>
          !idToDelete.includes(item[filter.entity + '_id'] as string)
      )
      for (const tableLevel2 of this.db[this.tableIndex]) {
        if (this.db[tableLevel2.name].length === 0) continue
        if (!(table.name + '_id' in this.db[tableLevel2.name][0])) continue
        this.db[tableLevel2.name] = this.db[tableLevel2.name].filter(
          (item: Record<string, unknown>) =>
            !idToDeleteLevel2.includes(item[table.name + '_id'] as string)
        )
      }
    }
  }
  idToIndex(tableName: string, id: string | number): number | false {
    if (!(tableName in this.db.__index__)) {
      console.error('id_to_index() table not found', tableName)
      return false
    }
    if (this.db.__index__[tableName].id[id] === undefined) {
      console.error('id_to_index() table ', tableName, 'id not found', id)
      return false
    }
    return this.db.__index__[tableName].id[id]
  }
  createAlias(
    initialAliases: Array<{ table: string; alias: string }> | null = null
  ) {
    type AliasDefinition = {
      table: string
      alias: string
    }

    let aliases: AliasDefinition[] = []

    if (initialAliases) {
      aliases = initialAliases.map(({ table, alias }) => ({ table, alias }))
    }

    if ('config' in this.db) {
      for (const row of this.db.config) {
        if (row.id?.startsWith('alias_')) {
          const table = row.value?.split(':')[0]?.trim()
          const alias = row.value?.split(':')[1]?.trim()
          if (table && alias) {
            aliases.push({ table, alias })
          }
        }
      }
    }

    if ('alias' in this.db) {
      aliases = aliases.concat(this.db.alias)
    }

    for (const alias of aliases) {
      const aliasData: Record<string, unknown>[] = []
      if (!(alias.table in this.db)) {
        console.error('create_alias() table not found:', alias.table)
        continue
      }
      for (const row of this.db[alias.table]) {
        const aliasDataRow: Record<string, unknown> = { id: row.id }
        aliasDataRow[alias.table + '_id'] = row.id
        aliasData.push(aliasDataRow)
      }
      this.db[alias.alias] = aliasData
      this.db[this.tableIndex].push({ name: alias.alias, alias: true })
      this.db.__schema__.aliases.push(alias.alias)
    }
  }
  createIndex() {
    this.db.__index__ = {}
    for (const table of this.db[this.tableIndex]) {
      if (!table.name.includes('_')) this.db.__index__[table.name] = {}
    }
    for (const table of this.db[this.tableIndex]) {
      if (!table.name.includes('_') && this.db[table.name][0]) {
        this.addPrimaryKey(table)
        this.processOneToMany(table)
      }
    }
    for (const table of this.db[this.tableIndex]) {
      if (this.metaTables.includes(table.name)) continue
      if (table.name.includes('_') && this.db[table.name][0]) {
        this.processManyToMany(table, 'left')
        this.processManyToMany(table, 'right')
      }
    }
  }
  processManyToMany(table: { name: string }, side: string) {
    const index: Record<string, unknown> = {}
    const tablesName = table.name.split('_')
    if (!(tablesName[0] in this.db.__index__)) {
      console.error('process_many_to_many() table not found', tablesName[0])
      return false
    }
    if (!(tablesName[1] in this.db.__index__)) {
      console.error('process_many_to_many() table not found', tablesName[1])
      return false
    }
    if (side === 'right') tablesName.reverse()
    const tableNameId0 = tablesName[0] + '_id'
    const tableNameId1 = tablesName[1] + '_id'
    for (const row of this.db[table.name]) {
      if (!(row[tableNameId1] in index)) {
        index[row[tableNameId1]] = this.idToIndex(
          tablesName[0],
          row[tableNameId0]
        )
        continue
      }
      if (!Array.isArray(index[row[tableNameId1]])) {
        index[row[tableNameId1]] = [index[row[tableNameId1]]]
      }
      ;(index[row[tableNameId1]] as unknown[]).push(
        this.idToIndex(tablesName[0], row[tableNameId0])
      )
    }
    delete (index as Record<string, unknown>)['null']
    this.db.__index__[tablesName[0]][tableNameId1] = index
    if (side === 'left') {
      this.db.__schema__.many_to_many.push([
        tablesName[0],
        tableNameId1.slice(0, -3),
      ])
    }
  }
  processOneToMany(table: { name: string }) {
    for (const variable in this.db[table.name][0]) {
      if (variable === 'parent_id') {
        this.processSelfOneToMany(table)
        continue
      }
      if (
        variable.endsWith('_id') &&
        variable.slice(0, -3) in this.db.__index__
      ) {
        this.addForeignKey(variable, table)
      }
    }
  }
  processSelfOneToMany(table: { name: string }) {
    const index: Record<string | number, number | number[]> = {}
    for (const [i, row] of Object.entries(this.db[table.name])) {
      const rowRecord = row as Record<string, unknown>
      const parentId = rowRecord.parent_id as string | number
      if (!(parentId in index)) {
        index[parentId] = parseInt(i)
        continue
      }
      if (!Array.isArray(index[parentId])) {
        index[parentId] = [index[parentId] as number]
      }
      ;(index[parentId] as number[]).push(parseInt(i))
    }
    this.db.__index__[table.name].parent_id = index
    this.db.__schema__.one_to_many.push([table.name, table.name])
  }
  addPrimaryKey(table: { name: string }) {
    const index: Record<string | number, number> = {}
    if (!(table.name in this.db)) return false
    if (this.db[table.name].length === 0) return false
    if (!('id' in this.db[table.name][0])) return false
    for (const [i, row] of Object.entries(this.db[table.name])) {
      const rowRecord = row as Record<string, unknown>
      const id = rowRecord.id as string | number
      index[id] = parseInt(i)
    }
    this.db.__index__[table.name].id = index
  }
  addForeignKey(variable: string, table: { name: string }) {
    const index: Record<string, number | number[]> = {}
    for (const [i, row] of Object.entries(this.db[table.name])) {
      const rowRecord = row as Record<string, unknown>
      const foreignKeyValue = rowRecord[variable] as string
      if (!(foreignKeyValue in index)) {
        index[foreignKeyValue] = parseInt(i)
        continue
      }
      if (!Array.isArray(index[foreignKeyValue])) {
        index[foreignKeyValue] = [index[foreignKeyValue] as number]
      }
      ;(index[foreignKeyValue] as number[]).push(parseInt(i))
    }
    delete index['null']
    this.db.__index__[table.name][variable] = index
    if (this.db.__schema__.aliases.includes(table.name)) {
      this.db.__schema__.one_to_one.push([table.name, variable.slice(0, -3)])
    } else {
      this.db.__schema__.one_to_many.push([variable.slice(0, -3), table.name])
    }
  }
  addDbSchema(dbSchema: unknown) {
    if (
      Array.isArray(dbSchema) &&
      dbSchema.length > 0 &&
      Array.isArray(dbSchema[0])
    ) {
      dbSchema = this.arrayToObject(dbSchema as unknown[][])
    }
    this.db.__meta_schema__ = dbSchema
  }
  addMeta(userData?: Record<string, unknown>, schema?: unknown): void {
    this.db.__user_data__ = userData || {}
    const metaDataset: Record<string, Record<string, unknown>> = {}
    const metaFolder: Record<string, Record<string, unknown>> = {}
    this.metaVariable = {}

    if (schema) this.addDbSchema(schema)

    const virtualMetaTables: string[] = []
    const db = this.db
    for (const table of Object.values(db[this.tableIndex])) {
      const tableRecord = table as Record<string, unknown>
      if (!tableRecord.last_modif)
        virtualMetaTables.push(tableRecord.name as string)
    }

    if ('__metaFolder__' in this.db) {
      for (const folder of this.db.__metaFolder__) {
        const folderRecord = folder as Record<string, unknown>
        metaFolder[folderRecord.id as string] = folderRecord
      }
    }
    if ('__metaDataset__' in this.db) {
      for (const dataset of this.db.__metaDataset__) {
        const datasetRecord = dataset as Record<string, unknown>
        metaDataset[datasetRecord.id as string] = datasetRecord
      }
    }
    if ('__metaVariable__' in this.db) {
      for (const variable of this.db.__metaVariable__) {
        const variableRecord = variable as Record<string, unknown>
        this.metaVariable[
          variableRecord.dataset + '---' + variableRecord.variable
        ] = variableRecord
      }
    }
    if ('__meta_schema__' in this.db) {
      for (const row of this.db.__meta_schema__) {
        const rowRecord = row as Record<string, unknown>
        if (!rowRecord.folder) continue
        if (!rowRecord.dataset) {
          rowRecord.id = rowRecord.folder
          metaFolder[rowRecord.id as string] = rowRecord
          continue
        }
        if (!rowRecord.variable) {
          rowRecord.id = rowRecord.dataset
          metaDataset[rowRecord.id as string] = rowRecord
          continue
        }
        rowRecord.id = rowRecord.dataset + '---' + rowRecord.variable
        this.metaVariable[rowRecord.id as string] = rowRecord
      }
    }

    const metaFolderData = {
      id: 'data',
      name: 'data',
      description: (
        (metaFolder as Record<string, unknown>).data as Record<string, unknown>
      )?.description,
      is_in_meta: (metaFolder as Record<string, unknown>).data ? true : false,
      is_in_data: true,
    }
    const metaFolderUserData = {
      id: 'user_data',
      name: 'user_data',
      description: (
        (metaFolder as Record<string, unknown>).user_data as Record<
          string,
          unknown
        >
      )?.description,
      is_in_meta: (metaFolder as Record<string, unknown>).user_data
        ? true
        : false,
      is_in_data: true,
    }
    this.db.metaFolder = [metaFolderData, metaFolderUserData]
    this.db.metaDataset = []
    this.db.metaVariable = []

    const userDataTables = Object.entries(this.db.__user_data__ || {})
    for (const [tableName, tableData] of userDataTables) {
      const tableDataArray = tableData as unknown[]
      if (tableDataArray.length === 0) continue
      const variables = Object.keys(
        tableDataArray[0] as Record<string, unknown>
      )
      this.db.metaDataset.push({
        id: tableName,
        metaFolder_id: 'user_data',
        name: tableName,
        nb_row: tableDataArray.length,
        description: metaDataset[tableName]?.description,
        is_in_meta: metaDataset[tableName] ? true : false,
        is_in_data: true,
      })
      this.addMetaVariables(tableName, tableData as unknown[], variables)
      if (tableName in metaDataset) delete metaDataset[tableName]
    }

    for (const table of this.db[this.tableIndex]) {
      if (table.name.includes(this.tableIndex)) continue
      if (this.metaTables.includes(table.name)) continue
      if (this.db[table.name].length === 0) continue
      if (virtualMetaTables.includes(table.name)) continue
      const variables = Object.keys(this.db[table.name][0])
      this.db.metaDataset.push({
        id: table.name,
        metaFolder_id: 'data',
        name: table.name,
        nb_row: this.db[table.name].length,
        description: metaDataset[table.name]?.description,
        last_update_timestamp: table.last_modif,
        is_in_meta: metaDataset[table.name] ? true : false,
        is_in_data: true,
      })
      this.addMetaVariables(table.name, this.db[table.name], variables)
      if (table.name in metaDataset) delete metaDataset[table.name]
    }

    for (const [variableId, variable] of Object.entries(this.metaVariable)) {
      const variableRecord = variable as Record<string, unknown>
      const datasetId = variableRecord.dataset
      this.db.metaVariable.push({
        id: variableId,
        metaDataset_id: datasetId,
        name: variableRecord.variable,
        description: variableRecord.description,
        is_in_meta: true,
        is_in_data: false,
      })
    }

    for (const [datasetId, dataset] of Object.entries(metaDataset)) {
      const datasetRecord = dataset as Record<string, unknown>
      this.db.metaDataset.push({
        id: datasetId,
        metaFolder_id: datasetRecord.folder,
        name: datasetRecord.dataset,
        nb_row: 0,
        description: datasetRecord?.description,
        is_in_meta: true,
        is_in_data: false,
      })
    }

    this.db.__index__.metaFolder = {}
    this.db.__index__.metaDataset = {}
    this.db.__index__.metaVariable = {}
    this.addPrimaryKey({ name: 'metaFolder' })
    this.addPrimaryKey({ name: 'metaDataset' })
    this.addPrimaryKey({ name: 'metaVariable' })
    this.processOneToMany({ name: 'metaDataset' })
    this.processOneToMany({ name: 'metaVariable' })
  }
  addMetaVariables(
    tableName: string,
    datasetData: unknown[],
    variables: string[]
  ) {
    const datasetArray = datasetData as unknown[]
    const nbValueMax = Math.min(300, Math.floor(datasetArray.length / 5))
    for (const variable of variables) {
      let type = 'other'
      for (const row of datasetData) {
        const rowRecord = row as Record<string, unknown>
        const value = rowRecord[variable]
        if (value === null || value === undefined) continue
        if (typeof value === 'string') {
          type = 'string'
          break
        }
        if (typeof value === 'number' && !isNaN(value)) {
          if (Number.isInteger(value)) {
            type = 'integer'
            break
          } else {
            type = 'float'
            break
          }
        }
        if (typeof value === 'boolean') {
          type = 'boolean'
          break
        }
      }
      let nbMissing = 0
      const distincts = new Set()
      for (const row of datasetData) {
        const rowRecord = row as Record<string, unknown>
        const value = rowRecord[variable]
        if (value === '' || value === null || value === undefined) {
          nbMissing += 1
          continue
        }
        distincts.add(value)
      }
      let values: boolean | Array<{ value: unknown }> = false
      const hasValue = distincts.size < nbValueMax && distincts.size > 0
      if (hasValue) {
        values = []
        for (const value of distincts) {
          values.push({ value })
        }
      }
      const datasetVariableId = tableName + '---' + variable
      this.db.metaVariable.push({
        id: datasetVariableId,
        metaDataset_id: tableName,
        name: variable,
        description: (
          this.metaVariable[datasetVariableId] as Record<string, unknown>
        )?.description,
        type,
        nb_missing: nbMissing,
        nb_distinct: distincts.size,
        nb_duplicate: datasetData.length - distincts.size - nbMissing,
        values,
        values_preview: values ? values.slice(0, 10) : false,
        is_in_meta: this.metaVariable[datasetVariableId] ? true : false,
        is_in_data: true,
      })
      if (datasetVariableId in this.metaVariable)
        delete this.metaVariable[datasetVariableId]
    }
  }
}
