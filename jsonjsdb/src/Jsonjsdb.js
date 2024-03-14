import DBrowser from "./DBrowser"
import Loader from "./Loader"
import Integrity_checker from "./Integrity_checker"

export default class Jsonjsdb {
  constructor(config) {
    if (!config) config = {}
    this._set_config(config)
    this.browser = new DBrowser(
      this.config.browser_key,
      this.config.app_name,
      config.use_encryption
    )
    this.loader = new Loader(this.browser)
    this.integrity_checker = new Integrity_checker()
  }
  _set_config(config) {
    this.config = {
      path: "db",
      db_key: false,
      browser_key: false,
      app_name: "jsonjsdb",
      use_cache: false,
      use_encryption: false,
    }

    Object.keys(this.config).forEach(key => {
      if (config[key] !== undefined) {
        this.config[key] = config[key]
      }
    })

    if (window?.location.protocol.startsWith("http")) {
      this.config.use_cache = false
    }
    if (this.config.db_key) {
      this.config.path += "/" + this.config.db_key
    }
  }

  async init(option = {}) {
    try {
      this.tables = await this.loader.load(
        this.config.path,
        this.config.use_cache,
        option
      )
      return this
    } catch (error) {
      console.error(`Jsonjs_db.init() error: ${error}`)
      return false
    }
  }
  async load(file_path, name) {
    file_path = this.config.path + "/" + file_path
    const data = await this.loader.load_jsonjs(file_path, name)
    return data
  }
  get(table, id) {
    try {
      const result = this.tables[table][this.tables.__index__[table].id[id]]
      if (!result) {
        console.error(`table ${table}, id not found: ${id}`)
      }
      return result
    } catch (error) {
      if (!this.tables[table]) {
        console.error(`table ${table} not found`)
      } else if (!this.tables.__index__[table]) {
        console.error(`table ${table} not found in __index__`)
      } else if (!("id" in this.tables.__index__[table])) {
        console.error(`table ${table}, props "id" not found in __index__`)
      } else {
        console.error(`error not handled`)
      }
      return
    }
  }
  get_all(table, foreign_table_obj, option = {}) {
    if (!(table in this.tables)) return []
    if (!foreign_table_obj) {
      if (option.limit) {
        return this.tables[table].slice(0, option.limit)
      }
      return this.tables[table]
    }
    let [foreign_table, foreign_value] = Object.entries(foreign_table_obj)[0]
    if (typeof foreign_value === "object") foreign_value = foreign_value.id
    let foreign_key = foreign_table + "_id"
    if (foreign_table === table) foreign_key = "parent_id"
    const index_all = this.tables.__index__[table][foreign_key]
    if (!index_all || !(foreign_value in index_all)) return []
    const indexes = index_all[foreign_value]
    if (!Array.isArray(indexes)) {
      if (!this.tables[table][indexes]) {
        console.error("get_all() table", table, "has an index undefined")
        return []
      }
      return [this.tables[table][indexes]]
    }
    const variables = []
    for (const index of indexes) {
      if (option.limit && variables.length > option.limit) break
      if (!this.tables[table][index]) {
        console.error("get_all() table", table, "has an index undefined")
        continue
      }
      variables.push(this.tables[table][index])
    }
    return variables
  }
  get_all_childs(table, item_id) {
    if (!(table in this.tables)) return []
    let all = []
    if (!item_id) {
      console.error("get_all_childs()", table, "id", item_id)
      return all
    }
    const childs = this.get_all(table, { [table]: item_id })
    all = all.concat(childs)
    for (const child of childs) {
      if (item_id === child.id) {
        const msg = "infinite loop for id"
        console.error("get_all_childs()", table, msg, item_id)
        return all
      }
      const new_childs = this.get_all_childs(table, child.id)
      all = all.concat(new_childs)
    }
    return all
  }
  foreach(table, callback) {
    const rows = this.get_all(table)
    for (const row of rows) callback(row)
  }
  table_has_id(table, id) {
    if (!this.tables[table]) return false
    if (!this.tables.__index__[table]) return false
    if (!this.tables.__index__[table].id) return false
    return id in this.tables.__index__[table].id
  }
  get_config(id) {
    if (!("config" in this.tables)) return
    const index = this.tables.__index__["config"].id
    if (!index) return
    if (!(id in index)) return
    const row = this.tables["config"][index[id]]
    return row["value"]
  }
  has_nb(table, id, nb_what) {
    if (!(nb_what in this.tables.__index__)) return 0
    const index = this.tables.__index__[nb_what][table + "_id"]
    if (!index) return 0
    if (!(id in index)) return 0
    if (!Array.isArray(index[id])) return 1
    return index[id].length
  }
  get_parents(from, id) {
    if (!id || id === null) return []
    let parent = this.get(from, id)
    const parents = []
    const iteration_max = 30
    let iteration_num = 0
    while (iteration_num < iteration_max) {
      iteration_num += 1
      if ([0, "", null].includes(parent.parent_id)) return parents.reverse()
      const parent_before = parent
      parent = this.get(from, parent.parent_id)
      if (!parent) {
        console.error(
          "get_parents() type",
          from,
          "cannot find id",
          parent_before.parent_id
        )
        return []
      }
      parents.push(parent)
    }
    console.error("get_parents()", from, id, "iteration_max reached")
    return []
  }
  add_meta(user_data) {
    this.loader.add_meta(user_data)
  }
  async check_integrity() {
    await this.loader.load_tables(this.config.path, false)
    this.db = this.loader.db
    return this.integrity_checker.check(this.db)
  }
}
