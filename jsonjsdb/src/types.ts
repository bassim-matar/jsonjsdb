export type IntegrityResult = {
  emptyId: string[]
  duplicateId: Record<string, (string | number)[]>
  parentIdNotFound: Record<string, (string | number)[]>
  parentIdSame: Record<string, (string | number)[]>
  foreignIdNotFound: Record<string, Record<string, (string | number)[]>>
}

export type TableRow = {
  id?: string | number
  parent_id?: string | number | null
  [key: string]: unknown
}

export type Schema = {
  oneToOne: [string, string][]
  oneToMany: string[][]
  manyToMany: [string, string][]
  aliases: string[]
}

// Database index structure types
export type TableIndex = {
  [propertyName: string]: Record<string | number, number | number[]>
}

export type DatabaseIndex = {
  [tableName: string]: TableIndex
}

export type DatabaseMetadata = {
  schema: Schema
  index: DatabaseIndex
  tables: TableInfo[]
  dbSchema?: unknown
}

export type TableInfo = {
  name: string
  last_modif?: string | number
  alias?: boolean
}

export type DatabaseRow = {
  id?: string | number
  parent_id?: string | number | null
  [key: string]: unknown
}

export type TableCollection<
  TEntityTypeMap extends Record<string, DatabaseRow>,
> = {
  [K in keyof TEntityTypeMap]: TEntityTypeMap[K][]
}
