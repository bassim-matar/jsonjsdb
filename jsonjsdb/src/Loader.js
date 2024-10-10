export default class Loader {
  _meta_tables = ["__metaFolder__", "__metaDataset__", "__metaVariable__"]
  _cache_prefix = "db_cache/"

  constructor(browser) {
    window.jsonjs = {}
    this.browser = browser
  }
  async load(path, use_cache = false, option = {}) {
    await this.load_tables(path, use_cache)
    this._normalize_schema()
    if (option.filter?.values?.length > 0) {
      this._filter(option.filter)
    }
    this._create_alias()
    this._create_index()
    return this.db
  }
  async _load_from_cache(table_name) {
    return this.browser.get(this._cache_prefix + table_name)
  }
  async _save_to_cache(data, table_name) {
    this.browser.set(this._cache_prefix + table_name, data)
  }
  async _load_from_file(path, table_name, option) {
    const script = document.createElement("script")
    let src = path + "/" + table_name + ".json.js?v="
    src += option.version ? option.version : Math.random()
    script.src = src
    script.async = false
    return new Promise((resolve, reject) => {
      script.onload = () => {
        if (
          !(table_name in jsonjs.data) ||
          jsonjs.data[table_name] === undefined
        ) {
          const error_msg = `jsonjs.data.${table_name} not found in table ${table_name}`
          console.error(error_msg)
          reject(new Error(error_msg))
          return
        }
        let data = jsonjs.data[table_name]
        jsonjs.data[table_name] = undefined
        if (data.length > 0 && Array.isArray(data[0])) {
          data = this._array_to_object(data)
        }
        resolve(data)
        document.querySelectorAll(`script[src="${src}"]`)[0].remove()
        if (option.use_cache) {
          this._save_to_cache(data, table_name)
        }
      }
      script.onerror = () => {
        const error_msg = `table "${table_name}" not found in path "${path}"`
        jsonjs.data[table_name] = undefined
        console.error(error_msg)
        reject(new Error(error_msg))
        return
      }
      document.head.appendChild(script)
    })
  }
  _array_to_object(data) {
    data = data.map(row => {
      return row.reduce((acc, item, index) => {
        const key = data[0][index]
        return { ...acc, [key]: item }
      }, {})
    })
    data.shift()
    return data
  }
  _is_in_cache(table_name, version) {
    if (!this.meta_cache) return false
    if (!(table_name in this.meta_cache)) return false
    if (this.meta_cache[table_name] !== version) return false
    return true
  }
  async load_jsonjs(path, table_name, option = {}) {
    if (path.slice(-1) === "/") path = path.slice(0, -1)
    if (jsonjs === undefined) jsonjs = {}
    if (jsonjs.data === undefined) jsonjs.data = {}
    if (option.use_cache && this._is_in_cache(table_name, option.version)) {
      return this._load_from_cache(table_name, option.version)
    } else {
      return this._load_from_file(path, table_name, option)
    }
  }
  async load_tables(path, use_cache) {
    const meta = await this.load_jsonjs(path, "__meta__")
    if (use_cache) {
      this.meta_cache = await this.browser.get(this._cache_prefix + "__meta__")
      const new_meta_cache = meta.reduce((acc, item) => {
        return { ...acc, [item.name]: item.last_modif }
      }, {})
      this._save_to_cache(new_meta_cache, "__meta__")
    }
    const schema = {
      aliases: [],
      one_to_one: [],
      one_to_many: [],
      many_to_many: [],
    }
    this.db = {
      __meta__: meta,
      __schema__: schema,
      __user_data__: {},
    }
    const promises = []
    const tables = []
    for (const table of meta) {
      tables.push({ name: table.name })
      promises.push(
        this.load_jsonjs(path, table.name, {
          version: table.last_modif,
          use_cache,
        })
      )
    }
    const tables_data = await Promise.all(promises)
    for (const [i, table_data] of tables_data.entries()) {
      this.db[tables[i].name] = table_data
    }
  }
  _normalize_schema() {
    for (const table of this.db.__meta__) {
      if (this.db[table.name].length === 0) continue
      for (const variable in this.db[table.name][0]) {
        if (!variable.endsWith("_ids")) continue
        const entity_dest = variable.slice(0, -4)
        if (!(entity_dest in this.db)) continue
        const relation_table = table.name + "_" + entity_dest
        if (!(relation_table in this.db)) {
          this.db.__meta__.push({ name: relation_table })
          this.db[relation_table] = []
        }
        for (const row of this.db[table.name]) {
          if (!row[variable]) continue
          const ids = row[variable].split(",")
          for (const id of ids) {
            this.db[relation_table].push({
              [table.name + "_id"]: row.id,
              [entity_dest + "_id"]: id.trim(),
            })
          }
        }
      }
    }
  }
  _filter(filter) {
    if (!("entity" in filter)) return false
    if (!("variable" in filter)) return false
    if (!filter.entity in this.db) return false
    const id_to_delete = []
    for (const item of this.db[filter.entity]) {
      if (filter.values.includes(item[filter.variable])) {
        id_to_delete.push(item.id)
      }
    }
    this.db[filter.entity] = this.db[filter.entity].filter(
      item => !id_to_delete.includes(item.id)
    )
    for (const table of this.db.__meta__) {
      if (this.db[table.name].length === 0) continue
      if (!this.db[table.name][0].hasOwnProperty(filter.entity + "_id"))
        continue
      const id_to_delete_level_2 = []
      for (const item of this.db[table.name]) {
        if (id_to_delete.includes(item[filter.entity + "_id"])) {
          id_to_delete_level_2.push(item.id)
        }
      }
      this.db[table.name] = this.db[table.name].filter(
        item => !id_to_delete.includes(item[filter.entity + "_id"])
      )
      for (const table_level_2 of this.db.__meta__) {
        if (this.db[table_level_2.name].length === 0) continue
        if (!this.db[table_level_2.name][0].hasOwnProperty(table.name + "_id"))
          continue
        this.db[table_level_2.name] = this.db[table_level_2.name].filter(
          item => !id_to_delete_level_2.includes(item[table.name + "_id"])
        )
      }
    }
  }
  _id_to_index(table_name, id) {
    if (!(table_name in this.db.__index__)) {
      console.error("id_to_index() table not found", table_name)
      return false
    }
    if (this.db.__index__[table_name].id[id] === undefined) {
      console.error("id_to_index() table ", table_name, "id not found", id)
      return false
    }
    return this.db.__index__[table_name].id[id]
  }
  _create_alias() {
    if (!("alias" in this.db)) return false
    const aliases = this.db.alias
    for (const alias of aliases) {
      const alias_data = []
      if (!(alias.table in this.db)) {
        console.error("create_alias() table not found:", alias.table)
        continue
      }
      for (const row of this.db[alias.table]) {
        const alias_data_row = { id: row.id }
        alias_data_row[alias.table + "_id"] = row.id
        alias_data.push(alias_data_row)
      }
      this.db[alias.alias] = alias_data
      this.db.__meta__.push({ name: alias.alias, alias: true })
      this.db.__schema__.aliases.push(alias.alias)
    }
  }
  _create_index() {
    this.db.__index__ = {}
    for (const table of this.db.__meta__) {
      if (!table.name.includes("_")) this.db.__index__[table.name] = {}
    }
    for (const table of this.db.__meta__) {
      if (!table.name.includes("_") && this.db[table.name][0]) {
        this._add_primary_key(table)
        this._process_one_to_many(table)
      }
    }
    for (const table of this.db.__meta__) {
      if (this._meta_tables.includes(table.name)) continue
      if (table.name.includes("_") && this.db[table.name][0]) {
        this._process_many_to_many(table, "left")
        this._process_many_to_many(table, "right")
      }
    }
  }
  _process_many_to_many(table, side) {
    const index = {}
    const tables_name = table.name.split("_")
    if (!(tables_name[0] in this.db.__index__)) {
      console.error("process_many_to_many() table not found", tables_name[0])
      return false
    }
    if (!(tables_name[1] in this.db.__index__)) {
      console.error("process_many_to_many() table not found", tables_name[1])
      return false
    }
    if (side === "right") tables_name.reverse()
    const table_name_id_0 = tables_name[0] + "_id"
    const table_name_id_1 = tables_name[1] + "_id"
    for (const [i, row] of Object.entries(this.db[table.name])) {
      if (!(row[table_name_id_1] in index)) {
        index[row[table_name_id_1]] = this._id_to_index(
          tables_name[0],
          row[table_name_id_0]
        )
        continue
      }
      if (!Array.isArray(index[row[table_name_id_1]])) {
        index[row[table_name_id_1]] = [index[row[table_name_id_1]]]
      }
      index[row[table_name_id_1]].push(
        this._id_to_index(tables_name[0], row[table_name_id_0])
      )
    }
    delete index[null]
    this.db.__index__[tables_name[0]][table_name_id_1] = index
    if (side === "left") {
      this.db.__schema__.many_to_many.push([
        tables_name[0],
        table_name_id_1.slice(0, -3),
      ])
    }
  }
  _process_one_to_many(table) {
    for (const variable in this.db[table.name][0]) {
      if (variable === "parent_id") {
        this._process_self_one_to_many(table)
        continue
      }
      if (
        variable.endsWith("_id") &&
        variable.slice(0, -3) in this.db.__index__
      ) {
        this._add_foreign_key(variable, table)
      }
    }
  }
  _process_self_one_to_many(table) {
    const index = {}
    for (const [i, row] of Object.entries(this.db[table.name])) {
      if (!(row.parent_id in index)) {
        index[row.parent_id] = parseInt(i)
        continue
      }
      if (!Array.isArray(index[row.parent_id])) {
        index[row.parent_id] = [index[row.parent_id]]
      }
      index[row.parent_id].push(parseInt(i))
    }
    this.db.__index__[table.name].parent_id = index
    this.db.__schema__.one_to_many.push([table.name, table.name])
  }
  _add_primary_key(table) {
    const index = {}
    if (!(table.name in this.db)) return false
    if (this.db[table.name].length === 0) return false
    if (!("id" in this.db[table.name][0])) return false
    for (const [i, row] of Object.entries(this.db[table.name])) {
      index[row.id] = parseInt(i)
    }
    this.db.__index__[table.name].id = index
  }
  _add_foreign_key(variable, table) {
    const index = {}
    for (const [i, row] of Object.entries(this.db[table.name])) {
      if (!(row[variable] in index)) {
        index[row[variable]] = parseInt(i)
        continue
      }
      if (!Array.isArray(index[row[variable]])) {
        index[row[variable]] = [index[row[variable]]]
      }
      index[row[variable]].push(parseInt(i))
    }
    delete index[null]
    this.db.__index__[table.name][variable] = index
    if (this.db.__schema__.aliases.includes(table.name)) {
      this.db.__schema__.one_to_one.push([table.name, variable.slice(0, -3)])
    } else {
      this.db.__schema__.one_to_many.push([variable.slice(0, -3), table.name])
    }
  }
  add_meta(user_data = {}) {
    this.db.__user_data__ = user_data
    const metaDataset = {}
    const metaFolder = {}

    if ("__metaFolder__" in this.db) {
      for (const folder of this.db.__metaFolder__) {
        metaFolder[folder.id] = folder
      }
    }
    if ("__metaDataset__" in this.db) {
      for (const dataset of this.db.__metaDataset__) {
        metaDataset[dataset.id] = dataset
      }
    }
    this.metaVariable = {}
    if ("__metaVariable__" in this.db) {
      for (const variable of this.db.__metaVariable__) {
        this.metaVariable[variable.dataset + "---" + variable.variable] =
          variable
      }
    }

    const metaFolder_data = {
      id: "data",
      name: "data",
      description: metaFolder.data?.description,
      nb_dataset: 0,
      nb_variable: 0,
    }
    const metaFolder_user_data = {
      id: "user_data",
      name: "user_data",
      description: metaFolder.user_data?.description,
      nb_dataset: 0,
      nb_variable: 0,
    }
    this.db.metaFolder = [metaFolder_data, metaFolder_user_data]
    this.db.metaDataset = []
    this.db.metaVariable = []

    const user_data_tables = Object.entries(this.db.__user_data__)
    for (const [table_name, table_data] of user_data_tables) {
      if (table_data.length === 0) continue
      const variables = Object.keys(table_data[0])
      this.db.metaDataset.push({
        id: table_name,
        metaFolder_id: "user_data",
        name: table_name,
        nb_variable: variables.length,
        nb_row: table_data.length,
        description: metaDataset[table_name]?.description,
      })
      this._add_meta_variables(table_name, table_data, variables)
      metaFolder_user_data.nb_dataset += 1
      metaFolder_user_data.nb_variable += variables.length
    }
    for (const table of this.db.__meta__) {
      if (table.name.includes("__meta__")) continue
      if (this._meta_tables.includes(table.name)) continue
      if (this.db[table.name].length === 0) continue
      const variables = Object.keys(this.db[table.name][0])
      this.db.metaDataset.push({
        id: table.name,
        metaFolder_id: "data",
        name: table.name,
        nb_variable: variables.length,
        nb_row: this.db[table.name].length,
        description: metaDataset[table.name]?.description,
      })
      this._add_meta_variables(table.name, this.db[table.name], variables)
      metaFolder_data.nb_dataset += 1
      metaFolder_data.nb_variable += variables.length
    }
    this.db.__index__.metaFolder = {}
    this.db.__index__.metaDataset = {}
    this.db.__index__.metaVariable = {}
    this._add_primary_key({ name: "metaFolder" })
    this._add_primary_key({ name: "metaDataset" })
    this._add_primary_key({ name: "metaVariable" })
    this._process_one_to_many({ name: "metaDataset" })
    this._process_one_to_many({ name: "metaVariable" })
  }
  _add_meta_variables(table_name, dataset_data, variables) {
    const nb_value_max = Math.min(300, parseInt(dataset_data.length / 5))
    for (const variable of variables) {
      let type = "other"
      for (const row of dataset_data) {
        const value = row[variable]
        if (value === null || value === undefined) continue
        if (typeof value === "string") {
          type = "string"
          break
        }
        if (typeof value === "number" && !isNaN(value)) {
          if (Number.isInteger(value)) {
            type = "integer"
            break
          } else {
            type = "float"
            break
          }
        }
        if (typeof value === "boolean") {
          type = "boolean"
          break
        }
      }
      let nb_missing = 0
      const distincts = new Set()
      for (const row of dataset_data) {
        const value = row[variable]
        if (value === "" || value === null || value === undefined) {
          nb_missing += 1
          continue
        }
        distincts.add(value)
      }
      let values = false
      const has_value = distincts.size < nb_value_max && distincts.size > 0
      if (has_value) {
        values = []
        for (const value of distincts) {
          values.push({ value })
        }
      }
      const dataset_variable_id = table_name + "---" + variable
      this.db.metaVariable.push({
        id: dataset_variable_id,
        metaDataset_id: table_name,
        name: variable,
        description: this.metaVariable[dataset_variable_id]?.description,
        type,
        nb_missing,
        nb_distinct: distincts.size,
        nb_duplicate: dataset_data.length - distincts.size - nb_missing,
        values,
        values_preview: values ? values.slice(0, 10) : false,
      })
    }
  }
}
