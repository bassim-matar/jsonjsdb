export default class Integrity_checker {
  private _table_index = "__table__";
  private tables: string[] = [];
  private tables_ids: Record<string, (string | number)[]> = {};
  private result: Record<string, any>;
  
  constructor() {
    this.tables = []
    this.tables_ids = {}
    this.result = {
      empty_id: [],
      duplicate_id: {},
      parent_id_not_found: {},
      parent_id_same: {},
      foreign_id_not_found: {},
    }
  }

  check(db: Record<string, any>): Record<string, any> {
    this.tables = []
    this.tables_ids = {}
    this.result = {
      empty_id: [],
      duplicate_id: {},
      parent_id_not_found: {},
      parent_id_same: {},
      foreign_id_not_found: {},
    }

    const tableDefinitions = db[this._table_index] as any[]
    for (const table of tableDefinitions) {
      this.tables.push(table.name)
      const tableData = db[table.name] as any[]
      this.tables_ids[table.name] = tableData.map(row => row.id)
    }

    for (const table of this.tables) {
      this._check_empty_id(table)
      this._check_duplicate_id(table)
      this._check_parent_id_same(db, table)
      this._check_parent_id_not_found(db, table)
      this._check_foreign_id(db, table)
    }
    return this.result as Record<string, any>
  }

  private _check_empty_id(table: string): void {
    const ids = this.tables_ids[table]
    if (ids.includes(null as any) || ids.includes("")) {
      this.result.empty_id.push(table)
    }
  }

  private _check_duplicate_id(table: string): void {
    const ids = this.tables_ids[table]
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
      this.result.duplicate_id[table] = duplicates
    }
  }

  private _check_parent_id_same(db: Record<string, any>, table: string): void {
    const tableData = db[table] as any[]
    if (tableData.length === 0) return
    if (!(Object.keys(tableData[0]).includes("parent_id"))) return
    
    const parent_id_same: (string | number)[] = []
    for (const row of tableData) {
      if (row.id === row.parent_id) {
        parent_id_same.push(row.id)
      }
    }
    if (parent_id_same.length > 0) {
      this.result.parent_id_same[table] = parent_id_same
    }
  }

  private _check_parent_id_not_found(db: Record<string, any>, table: string): void {
    const tableData = db[table] as any[]
    if (tableData.length === 0) return
    if (!(Object.keys(tableData[0]).includes("parent_id"))) return
    
    const parent_id_not_found: (string | number)[] = []
    for (const row of tableData) {
      if ([null, ""].includes(row.parent_id as any)) continue
      if (!this.tables_ids[table].includes(row.parent_id as string | number)) {
        parent_id_not_found.push(row.parent_id as string | number)
      }
    }
    if (parent_id_not_found.length > 0) {
      this.result.parent_id_not_found[table] = parent_id_not_found
    }
  }

  private _check_foreign_id(db: Record<string, any>, table: string): void {
    const tableData = db[table] as any[]
    if (tableData.length === 0) return

    const foreign_tables: string[] = []
    for (const variable in tableData[0]) {
      if (
        variable !== "parent_id" &&
        variable.endsWith("_id") &&
        this.tables.includes(variable.slice(0, -3))
      ) {
        foreign_tables.push(variable.slice(0, -3))
      }
    }

    const foreign_id_not_found: Record<string, (string | number)[]> = {}
    for (const foreign_table of foreign_tables) {
      const foreign_var = foreign_table + "_id"
      const foreign_table_id_not_found: (string | number)[] = []
      
      for (const row of tableData) {
        if ([null, ""].includes(row[foreign_var] as any)) continue
        if (!this.tables_ids[foreign_table].includes(row[foreign_var] as string | number)) {
          foreign_table_id_not_found.push(row[foreign_var] as string | number)
        }
      }
      if (foreign_table_id_not_found.length > 0) {
        foreign_id_not_found[foreign_var] = foreign_table_id_not_found
      }
    }
    if (Object.keys(foreign_id_not_found).length > 0) {
      this.result.foreign_id_not_found[table] = foreign_id_not_found
    }
  }
}
