export default class Integrity_checker {
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
  check(db) {
    for (const table of db.__meta__) {
      this.tables.push(table.name)
      this.tables_ids[table.name] = db[table.name].map(row => row.id)
    }
    for (const table of this.tables) {
      this._check_empty_id(table)
      this._check_duplicate_id(table)
      this._check_parent_id_same(db, table)
      this._check_parent_id_not_found(db, table)
      this._check_foreign_id(db, table)
    }
    return this.result
  }
  _check_empty_id(table) {
    const ids = this.tables_ids[table]
    if (ids.includes(null) || ids.includes("")) {
      this.result.empty_id.push(table)
    }
  }
  _check_duplicate_id(table) {
    const ids = this.tables_ids[table]
    if (ids.length === 0) return
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
  _check_parent_id_same(db, table) {
    if (!(Object.keys(db[table][0]).includes("parent_id"))) return
    const parent_id_same = []
    for (const row of db[table]) {
      if (row.id === row.parent_id) {
        parent_id_same.push(row.id)
      }
    }
    if (parent_id_same.length > 0) {
      this.result.parent_id_same[table] = parent_id_same
    }
  }
  _check_parent_id_not_found(db, table) {
    if (!(Object.keys(db[table][0]).includes("parent_id"))) return
    const parent_id_not_found = []
    for (const row of db[table]) {
      if ([null, ""].includes(row.parent_id)) continue
      if (!this.tables_ids[table].includes(row.parent_id)) {
        parent_id_not_found.push(row.parent_id)
      }
    }
    if (parent_id_not_found.length > 0) {
      this.result.parent_id_not_found[table] = parent_id_not_found
    }
  }
  _check_foreign_id(db, table) {
    const foreign_tables = []
    for (const variable in db[table][0]) {
      if (
        variable !== "parent_id" &&
        variable.endsWith("_id") &&
        this.tables.includes(variable.slice(0, -3))
      ) {
        foreign_tables.push(variable.slice(0, -3))
      }
    }
    const foreign_id_not_found = {}
    for (const foreign_table of foreign_tables) {
      const foreign_var = foreign_table + "_id"
      const foreign_table_id_not_found = []
      for (const row of db[table]) {
        if ([null, ""].includes(row[foreign_var])) continue
        if (!this.tables_ids[foreign_table].includes(row[foreign_var])) {
          foreign_table_id_not_found.push(row[foreign_var])
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
