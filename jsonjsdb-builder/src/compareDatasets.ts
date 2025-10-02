type TableRow = Record<string, unknown>

export type EvolutionEntry = {
  timestamp: number
  type: 'add' | 'delete' | 'update'
  entity: string
  entityId: string | number
  parentEntityId: string | number | null
  variable: string | null
  oldValue: unknown
  newValue: unknown
  name: string | null
}

function addIdIfMissing(dataset: TableRow[]) {
  if (dataset.length === 0) return
  if ('id' in dataset[0]) return
  const keys = Object.keys(dataset[0])
  if (keys.length < 2) {
    throw new Error('Not enough columns to generate id')
  }
  const [key1, key2] = keys
  for (const item of dataset) {
    item.id = `${item[key1]}---${item[key2]}`
  }
}

function getFirstParentId(obj: TableRow): string | number | null {
  for (const key of Object.keys(obj)) {
    if (key.endsWith('_id') || key.endsWith('Id')) {
      const value = obj[key]
      return typeof value === 'string' || typeof value === 'number'
        ? value
        : null
    }
  }
  return null
}

export function compareDatasets(
  datasetOld: TableRow[],
  datasetNew: TableRow[],
  timestamp: number,
  entity: string,
): EvolutionEntry[] {
  const newEvoEntries: EvolutionEntry[] = []

  if (entity.startsWith('__')) return newEvoEntries
  if (datasetOld.length === 0 && datasetNew.length === 0) return newEvoEntries

  addIdIfMissing(datasetOld)
  addIdIfMissing(datasetNew)

  const mapOld = new Map<string | number, TableRow>(
    datasetOld.map(item => [item.id as string | number, item]),
  )
  const mapNew = new Map<string | number, TableRow>(
    datasetNew.map(item => [item.id as string | number, item]),
  )

  let variables: string[] = []
  if (datasetOld.length === 0) variables = Object.keys(datasetNew[0])
  else if (datasetNew.length === 0) variables = Object.keys(datasetOld[0])
  else
    variables = Array.from(
      new Set([...Object.keys(datasetOld[0]), ...Object.keys(datasetNew[0])]),
    )

  const idsOld = new Set<string | number>(mapOld.keys())
  const idsNew = new Set<string | number>(mapNew.keys())

  const idsAdded = [...idsNew].filter(id => !idsOld.has(id))
  const idsRemoved = [...idsOld].filter(id => !idsNew.has(id))
  const commonIds = [...idsOld].filter(id => idsNew.has(id))

  const modifications: {
    entityId: string | number
    variable: string
    oldValue: unknown
    newValue: unknown
  }[] = []

  for (const entityId of commonIds) {
    const objOld = mapOld.get(entityId)!
    const objNew = mapNew.get(entityId)!
    for (const variable of variables) {
      if (variable === 'id') continue
      const oldValue = variable in objOld ? objOld[variable] : null
      const newValue = variable in objNew ? objNew[variable] : null
      if (oldValue === newValue) continue
      if (
        (oldValue === null || oldValue === undefined || oldValue === '') &&
        (newValue === null || newValue === undefined || newValue === '')
      )
        continue
      modifications.push({
        entityId: entityId,
        variable,
        oldValue: oldValue,
        newValue: newValue,
      })
    }
  }

  for (const entityId of idsAdded) {
    newEvoEntries.push({
      timestamp,
      type: 'add',
      entity,
      entityId: entityId,
      parentEntityId: null,
      variable: null,
      oldValue: null,
      newValue: null,
      name: null,
    })
  }

  for (const entityId of idsRemoved) {
    const objOld = mapOld.get(entityId)!
    newEvoEntries.push({
      timestamp,
      type: 'delete',
      entity,
      entityId: entityId,
      parentEntityId: getFirstParentId(objOld),
      variable: null,
      oldValue: null,
      newValue: null,
      name: (objOld.name as string) || null,
    })
  }

  for (const mod of modifications) {
    newEvoEntries.push({
      timestamp,
      type: 'update',
      entity,
      entityId: mod.entityId,
      parentEntityId: null,
      variable: mod.variable,
      oldValue: mod.oldValue,
      newValue: mod.newValue,
      name: null,
    })
  }

  return newEvoEntries
}
