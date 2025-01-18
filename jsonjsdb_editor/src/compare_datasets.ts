type TableRow = Record<string, any>

export interface EvolutionEntry {
  timestamp: number
  type: "add" | "delete" | "update"
  entity: string
  entity_id: string | number
  parent_entity_id: string | number | null
  variable: string | null
  old_value: any | null
  new_value: any | null
  name: string | null
}

function add_id_if_missing(dataset: TableRow[]) {
  if (dataset.length === 0) return
  if ("id" in dataset[0]) return
  const keys = Object.keys(dataset[0])
  if (keys.length < 2) {
    throw new Error("Not enough columns to generate id")
  }
  const [key1, key2] = keys
  for (const item of dataset) {
    item.id = `${item[key1]}---${item[key2]}`
  }
}

function get_first_parent_id(obj: TableRow): string | number | null {
  for (const key of Object.keys(obj)) {
    if (key.endsWith("_id")) return obj[key]
  }
  return null
}

export function compare_datasets(
  dataset_old: TableRow[],
  dataset_new: TableRow[],
  timestamp: number,
  entity: string
): EvolutionEntry[] {
  const new_evo_entries: EvolutionEntry[] = []

  if (entity.startsWith("__")) return new_evo_entries
  if (dataset_old.length === 0 && dataset_new.length === 0)
    return new_evo_entries

  add_id_if_missing(dataset_old)
  add_id_if_missing(dataset_new)

  const map_old = new Map<string | number, TableRow>(
    dataset_old.map(item => [item.id, item])
  )
  const map_new = new Map<string | number, TableRow>(
    dataset_new.map(item => [item.id, item])
  )

  let variables: string[] = []
  if (dataset_old.length === 0) variables = Object.keys(dataset_new[0])
  else if (dataset_new.length === 0) variables = Object.keys(dataset_old[0])
  else
    variables = Array.from(
      new Set([...Object.keys(dataset_old[0]), ...Object.keys(dataset_new[0])])
    )

  const ids_old = new Set<string | number>(map_old.keys())
  const ids_new = new Set<string | number>(map_new.keys())

  const ids_added = [...ids_new].filter(id => !ids_old.has(id))
  const ids_removed = [...ids_old].filter(id => !ids_new.has(id))
  const common_ids = [...ids_old].filter(id => ids_new.has(id))

  const modifications: {
    entity_id: string | number
    variable: string
    old_value: any | null
    new_value: any | null
  }[] = []

  for (const entity_id of common_ids) {
    const obj_old = map_old.get(entity_id)!
    const obj_new = map_new.get(entity_id)!
    for (const variable of variables) {
      if (variable === "id") continue
      const old_value = variable in obj_old ? obj_old[variable] : null
      const new_value = variable in obj_new ? obj_new[variable] : null
      if (old_value === new_value) continue
      if (
        [null, undefined, ""].includes(old_value) &&
        [null, undefined, ""].includes(new_value)
      )
        continue
      modifications.push({ entity_id, variable, old_value, new_value })
    }
  }

  for (const entity_id of ids_added) {
    new_evo_entries.push({
      timestamp,
      type: "add",
      entity,
      entity_id,
      parent_entity_id: null,
      variable: null,
      old_value: null,
      new_value: null,
      name: null,
    })
  }

  for (const entity_id of ids_removed) {
    const obj_old = map_old.get(entity_id)!
    new_evo_entries.push({
      timestamp,
      type: "delete",
      entity,
      entity_id,
      parent_entity_id: get_first_parent_id(obj_old),
      variable: null,
      old_value: null,
      new_value: null,
      name: obj_old.name || null,
    })
  }

  for (const mod of modifications) {
    new_evo_entries.push({
      timestamp,
      type: "update",
      entity,
      entity_id: mod.entity_id,
      parent_entity_id: null,
      variable: mod.variable,
      old_value: mod.old_value,
      new_value: mod.new_value,
      name: null,
    })
  }

  return new_evo_entries
}
