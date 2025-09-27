export interface IntegrityResult {
  emptyId: string[]
  duplicateId: Record<string, (string | number)[]>
  parentIdNotFound: Record<string, (string | number)[]>
  parentIdSame: Record<string, (string | number)[]>
  foreignIdNotFound: Record<string, Record<string, (string | number)[]>>
}

export interface TableDefinition {
  name: string
}

export interface TableRow {
  id: string | number
  parent_id?: string | number | null
  [key: string]: string | number | null | undefined
}

export interface Database {
  __table__: TableDefinition[]
  [tableName: string]: TableRow[] | TableDefinition[]
}
