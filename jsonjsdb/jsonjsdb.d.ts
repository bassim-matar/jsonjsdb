declare class DBrowser {
  constructor(browser_key: string, app_name: string, use_encryption: boolean)
  getAll(key: string, callback: (data: any[]) => void): void
  get(key: string): Promise<any>
  set(key: string, data: any, callback?: () => void): void
  clear(): void
}

declare class Loader {
  constructor(browser: DBrowser)
  load_jsonjs(
    path: string,
    table_name: string,
    option?: { use_cache: boolean; version: number | string }
  ): Promise<any>
}

declare class Integrity_checker {
  constructor()
  check(db: {}): {}
}

type ID = string | number
type TABLE = string
type ROW = {}

interface Config {
  path: string
  db_key: string
  browser_key: string
  app_name: string
  use_cache: boolean
  use_encryption: boolean
}

export default class Jsonjsdb {
  constructor(config?: Config)
  browser: DBrowser
  loader: Loader
  integrity_checker: Integrity_checker
  tables: {}
  config: Config
  init(option?: {
    filter: { entity: string; variable: string; values: ID[] }
  }): Promise<Jsonjsdb | false>
  load(file_path: string, name: string): Promise<any>
  get(table: TABLE, id: ID): ROW
  get_all(
    table: TABLE,
    foreign_table_obj?: {},
    option?: { limit: number }
  ): ROW[]
  get_all_childs(table: TABLE, item_id: ID): ROW[]
  foreach(table: TABLE, callback: (row: ROW) => void): void
  table_has_id(table: TABLE, id: ID): boolean
  has_nb(table: TABLE, id: ID, nb_what: string): number
  get_parents(from: TABLE, id: ID): ROW[]
  get_config(id: ID): string | number
  add_meta(user_data: {}): void
  check_integrity(): Promise<{}>
  get_last_modif_timestamp(): number
}
