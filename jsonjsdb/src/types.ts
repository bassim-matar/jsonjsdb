export interface IntegrityResult {
  emptyId: string[]
  duplicateId: Record<string, (string | number)[]>
  parentIdNotFound: Record<string, (string | number)[]>
  parentIdSame: Record<string, (string | number)[]>
  foreignIdNotFound: Record<string, Record<string, (string | number)[]>>
}

export interface TableRow {
  id?: string | number
  parent_id?: string | number | null
  [key: string]: unknown
}

export interface Schema {
  oneToOne: [string, string][]
  oneToMany: string[][]
  manyToMany: [string, string][]
  aliases: string[]
}

// Database index structure types
export interface TableIndex {
  [propertyName: string]: Record<string | number, number | number[]>
}

export interface DatabaseIndex {
  [tableName: string]: TableIndex
}

export interface DatabaseMetadata {
  schema: Schema
  index: DatabaseIndex
  tables: TableInfo[]
  dbSchema?: unknown
}

export interface TableInfo {
  name: string
  last_modif?: string | number
  alias?: boolean
}
