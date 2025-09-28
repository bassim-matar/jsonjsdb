import type {
  IntegrityResult,
  TableDefinition,
  TableRow,
  Database,
} from './types'

export default class IntegrityChecker {
  private tableIndex = '__table__'
  private tables: string[] = []
  private tablesIds: Record<string, (string | number)[]> = {}
  private result: IntegrityResult

  constructor() {
    this.tables = []
    this.tablesIds = {}
    this.result = {
      emptyId: [],
      duplicateId: {},
      parentIdNotFound: {},
      parentIdSame: {},
      foreignIdNotFound: {},
    }
  }

  check(db: Database): IntegrityResult {
    this.tables = []
    this.tablesIds = {}
    this.result = {
      emptyId: [],
      duplicateId: {},
      parentIdNotFound: {},
      parentIdSame: {},
      foreignIdNotFound: {},
    }

    const tableDefinitions = db[this.tableIndex] as TableDefinition[]
    for (const table of tableDefinitions) {
      this.tables.push(table.name)
      const tableData = db[table.name] as TableRow[]
      this.tablesIds[table.name] = tableData.map(row => row.id)
    }

    for (const table of this.tables) {
      this.checkEmptyId(table)
      this.checkDuplicateId(table)
      this.checkParentIdSame(db, table)
      this.checkParentIdNotFound(db, table)
      this.checkForeignId(db, table)
    }
    return this.result
  }

  private checkEmptyId(table: string): void {
    const ids = this.tablesIds[table]
    // If every row yielded an undefined value, we interpret that as: no 'id' field exists at all.
    // In that case the table must NOT be flagged for emptyId.
    if (ids.length > 0 && ids.every(id => id === undefined)) return

    const hasEmptyId = ids.some(
      id => id === null || id === '' || id === undefined,
    )
    if (hasEmptyId) this.result.emptyId.push(table)
  }

  private checkDuplicateId(table: string): void {
    const ids = this.tablesIds[table]
    const set = new Set(ids)
    let duplicates = ids.filter(item => {
      if (set.has(item)) {
        set.delete(item)
      } else {
        return item
      }
    })
    duplicates = Array.from(new Set(duplicates))
    if (duplicates.length > 0) {
      this.result.duplicateId[table] = duplicates
    }
  }

  private checkParentIdSame(db: Database, table: string): void {
    const tableData = db[table] as TableRow[]
    if (tableData.length === 0) return
    if (!Object.keys(tableData[0]).includes('parent_id')) return

    const parentIdSame: (string | number)[] = []
    for (const row of tableData) {
      if (row.id === row.parent_id) {
        parentIdSame.push(row.id)
      }
    }
    if (parentIdSame.length > 0) {
      this.result.parentIdSame[table] = parentIdSame
    }
  }

  private checkParentIdNotFound(db: Database, table: string): void {
    const tableData = db[table] as TableRow[]
    if (tableData.length === 0) return
    if (!Object.keys(tableData[0]).includes('parent_id')) return

    const parentIdNotFound: (string | number)[] = []
    for (const row of tableData) {
      if (row.parent_id === null || row.parent_id === '') continue
      if (!this.tablesIds[table].includes(row.parent_id as string | number)) {
        parentIdNotFound.push(row.parent_id as string | number)
      }
    }
    if (parentIdNotFound.length > 0) {
      this.result.parentIdNotFound[table] = parentIdNotFound
    }
  }

  private checkForeignId(db: Database, table: string): void {
    const tableData = db[table] as TableRow[]
    if (tableData.length === 0) return

    const foreignTables: string[] = []
    for (const variable in tableData[0]) {
      if (
        variable !== 'parent_id' &&
        variable.endsWith('_id') &&
        this.tables.includes(variable.slice(0, -3))
      ) {
        foreignTables.push(variable.slice(0, -3))
      }
    }

    const foreignIdNotFound: Record<string, (string | number)[]> = {}
    for (const foreignTable of foreignTables) {
      const foreignVar = foreignTable + '_id'
      const foreignTableIdNotFound: (string | number)[] = []

      for (const row of tableData) {
        if (row[foreignVar] === null || row[foreignVar] === '') continue
        if (
          !this.tablesIds[foreignTable].includes(
            row[foreignVar] as string | number,
          )
        ) {
          foreignTableIdNotFound.push(row[foreignVar] as string | number)
        }
      }
      if (foreignTableIdNotFound.length > 0) {
        foreignIdNotFound[foreignVar] = foreignTableIdNotFound
      }
    }
    if (Object.keys(foreignIdNotFound).length > 0) {
      this.result.foreignIdNotFound[table] = foreignIdNotFound
    }
  }
}
