// Type definitions for jsonjsdb

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
  add_meta(user_data: Record<string, any>, schema?: any): void
  get_last_modif_timestamp(): number
}

declare class Integrity_checker {
  constructor()
  check(db: Record<string, any>): Record<string, any>
}

export type ID = string | number
export type TABLE = string
export type ROW = Record<string, any>

export interface Config {
  path?: string
  db_key?: string
  browser_key?: string
  app_name?: string
  use_cache?: boolean
  use_encryption?: boolean
}

export interface FilterOption {
  entity: string
  variable: string
  values: ID[]
}

export interface InitOption {
  filter?: FilterOption
}

export interface GetAllOption {
  limit?: number
}

export default class Jsonjsdb {
  constructor(config?: Config | string)
  
  readonly browser: DBrowser
  readonly loader: Loader
  readonly integrity_checker: Integrity_checker
  readonly tables: Record<string, any>
  readonly config: Required<Config>
  
  init(option?: InitOption): Promise<Jsonjsdb | false>
  load(file_path: string, name: string): Promise<any>
  get(table: TABLE, id: ID): ROW | undefined
  get_all(
    table: TABLE,
    foreign_table_obj?: Record<string, any>,
    option?: GetAllOption
  ): ROW[]
  get_all_childs(table: TABLE, item_id: ID): ROW[]
  foreach(table: TABLE, callback: (row: ROW) => void): void
  table_has_id(table: TABLE, id: ID): boolean
  has_nb(table: TABLE, id: ID, nb_what: string): number
  get_parents(from: TABLE, id: ID): ROW[]
  get_config(id: ID): string | number | undefined
  add_meta(user_data: Record<string, any>, schema?: any): void
  check_integrity(): Promise<Record<string, any>>
  get_last_modif_timestamp(): number
}
