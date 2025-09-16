import { EvolutionEntry } from './compareDatasets'

export const evolutionSchema = [
  {
    column: 'timestamp',
    type: Number,
    value: (row: EvolutionEntry) => row.timestamp,
  },
  {
    column: 'type',
    type: String,
    value: (row: EvolutionEntry) => row.type,
  },
  {
    column: 'entity',
    type: String,
    value: (row: EvolutionEntry) => String(row.entity),
  },
  {
    column: 'entity_id',
    type: String,
    value: (row: EvolutionEntry) => String(row.entity_id || ''),
  },
  {
    column: 'parent_entity_id',
    type: String,
    value: (row: EvolutionEntry) => String(row.parent_entity_id || ''),
  },
  {
    column: 'variable',
    type: String,
    value: (row: EvolutionEntry) => String(row.variable || ''),
  },
  {
    column: 'old_value',
    type: String,
    value: (row: EvolutionEntry) => String(row.old_value || ''),
  },
  {
    column: 'new_value',
    type: String,
    value: (row: EvolutionEntry) => String(row.new_value || ''),
  },
  {
    column: 'name',
    type: String,
    value: (row: EvolutionEntry) => String(row.name || ''),
  },
]
