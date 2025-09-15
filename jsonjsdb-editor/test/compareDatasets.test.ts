import { describe, it, expect } from 'vitest'
import { compareDatasets } from '../src/compareDatasets.js'

describe('compareDatasets', () => {
  const mockTimestamp = 1694765432

  describe('Edge cases and filters', () => {
    it('should return empty array for entities starting with "__"', () => {
      const oldData = [{ id: 1, name: 'test' }]
      const newData = [{ id: 2, name: 'test2' }]

      const result = compareDatasets(
        oldData,
        newData,
        mockTimestamp,
        '__meta__'
      )

      expect(result).toEqual([])
    })

    it('should return empty array when both datasets are empty', () => {
      const result = compareDatasets([], [], mockTimestamp, 'user')

      expect(result).toEqual([])
    })

    it('should handle datasets with missing id columns by generating them', () => {
      const oldData = [{ name: 'John', email: 'john@test.com' }]
      const newData = [
        { name: 'John', email: 'john@test.com' },
        { name: 'Jane', email: 'jane@test.com' },
      ]

      const result = compareDatasets(oldData, newData, mockTimestamp, 'user')

      expect(result).toHaveLength(1)
      expect(result[0].type).toBe('add')
      expect(result[0].entity_id).toBe('Jane---jane@test.com')
    })

    it('should throw error when dataset has insufficient columns for ID generation', () => {
      const oldData = [{ name: 'test' }] // Only one column
      const newData = [{ name: 'test' }]

      expect(() => {
        compareDatasets(oldData, newData, mockTimestamp, 'user')
      }).toThrow('Not enough columns to generate id')
    })
  })

  describe('Add operations', () => {
    it('should detect new records', () => {
      const oldData = [{ id: 1, name: 'John', email: 'john@test.com' }]
      const newData = [
        { id: 1, name: 'John', email: 'john@test.com' },
        { id: 2, name: 'Jane', email: 'jane@test.com' },
      ]

      const result = compareDatasets(oldData, newData, mockTimestamp, 'user')

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        timestamp: mockTimestamp,
        type: 'add',
        entity: 'user',
        entity_id: 2,
        parent_entity_id: null,
        variable: null,
        old_value: null,
        new_value: null,
        name: null,
      })
    })

    it('should handle multiple new records', () => {
      const oldData = [{ id: 1, name: 'John' }]
      const newData = [
        { id: 1, name: 'John' },
        { id: 2, name: 'Jane' },
        { id: 3, name: 'Bob' },
      ]

      const result = compareDatasets(oldData, newData, mockTimestamp, 'user')

      expect(result).toHaveLength(2)
      expect(result.every(entry => entry.type === 'add')).toBe(true)
      expect(result.map(entry => entry.entity_id)).toEqual([2, 3])
    })

    it('should detect additions when old dataset is empty', () => {
      const oldData = []
      const newData = [
        { id: 1, name: 'John' },
        { id: 2, name: 'Jane' },
      ]

      const result = compareDatasets(oldData, newData, mockTimestamp, 'user')

      expect(result).toHaveLength(2)
      expect(result.every(entry => entry.type === 'add')).toBe(true)
    })
  })

  describe('Delete operations', () => {
    it('should detect deleted records', () => {
      const oldData = [
        { id: 1, name: 'John', company_id: 5 },
        { id: 2, name: 'Jane', company_id: 3 },
      ]
      const newData = [{ id: 1, name: 'John', company_id: 5 }]

      const result = compareDatasets(oldData, newData, mockTimestamp, 'user')

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        timestamp: mockTimestamp,
        type: 'delete',
        entity: 'user',
        entity_id: 2,
        parent_entity_id: 3, // First _id field found
        variable: null,
        old_value: null,
        new_value: null,
        name: 'Jane', // name field if exists
      })
    })

    it('should handle records without parent_id or name', () => {
      const oldData = [
        { id: 1, email: 'john@test.com' },
        { id: 2, email: 'jane@test.com' },
      ]
      const newData = [{ id: 1, email: 'john@test.com' }]

      const result = compareDatasets(oldData, newData, mockTimestamp, 'user')

      expect(result).toHaveLength(1)
      expect(result[0].parent_entity_id).toBe(null)
      expect(result[0].name).toBe(null)
    })

    it('should detect deletions when new dataset is empty', () => {
      const oldData = [
        { id: 1, name: 'John' },
        { id: 2, name: 'Jane' },
      ]
      const newData = []

      const result = compareDatasets(oldData, newData, mockTimestamp, 'user')

      expect(result).toHaveLength(2)
      expect(result.every(entry => entry.type === 'delete')).toBe(true)
    })
  })

  describe('Update operations', () => {
    it('should detect field modifications', () => {
      const oldData = [{ id: 1, name: 'John', email: 'john@old.com', age: 25 }]
      const newData = [
        { id: 1, name: 'Johnny', email: 'john@new.com', age: 25 },
      ]

      const result = compareDatasets(oldData, newData, mockTimestamp, 'user')

      expect(result).toHaveLength(2) // name and email changes

      const nameUpdate = result.find(entry => entry.variable === 'name')
      const emailUpdate = result.find(entry => entry.variable === 'email')

      expect(nameUpdate).toEqual({
        timestamp: mockTimestamp,
        type: 'update',
        entity: 'user',
        entity_id: 1,
        parent_entity_id: null,
        variable: 'name',
        old_value: 'John',
        new_value: 'Johnny',
        name: null,
      })

      expect(emailUpdate).toEqual({
        timestamp: mockTimestamp,
        type: 'update',
        entity: 'user',
        entity_id: 1,
        parent_entity_id: null,
        variable: 'email',
        old_value: 'john@old.com',
        new_value: 'john@new.com',
        name: null,
      })
    })

    it('should ignore changes between null, undefined, and empty string', () => {
      const oldData = [{ id: 1, name: 'John', description: null, notes: '' }]
      const newData = [{ id: 1, name: 'John', description: '', notes: null }]

      const result = compareDatasets(oldData, newData, mockTimestamp, 'user')

      expect(result).toHaveLength(0)
    })

    it('should detect changes from/to null values', () => {
      const oldData = [{ id: 1, name: 'John', description: null }]
      const newData = [{ id: 1, name: 'John', description: 'New description' }]

      const result = compareDatasets(oldData, newData, mockTimestamp, 'user')

      expect(result).toHaveLength(1)
      expect(result[0].old_value).toBe(null)
      expect(result[0].new_value).toBe('New description')
    })

    it('should handle new and removed fields', () => {
      const oldData = [{ id: 1, name: 'John', old_field: 'value' }]
      const newData = [{ id: 1, name: 'John', new_field: 'new_value' }]

      const result = compareDatasets(oldData, newData, mockTimestamp, 'user')

      expect(result).toHaveLength(2)

      const removedField = result.find(entry => entry.variable === 'old_field')
      const addedField = result.find(entry => entry.variable === 'new_field')

      expect(removedField.old_value).toBe('value')
      expect(removedField.new_value).toBe(null)

      expect(addedField.old_value).toBe(null)
      expect(addedField.new_value).toBe('new_value')
    })
  })

  describe('Mixed operations', () => {
    it('should handle add, delete, and update operations together', () => {
      const oldData = [
        { id: 1, name: 'John', email: 'john@old.com' },
        { id: 2, name: 'Jane', email: 'jane@test.com' },
        { id: 3, name: 'Bob', email: 'bob@test.com' },
      ]
      const newData = [
        { id: 1, name: 'Johnny', email: 'john@new.com' }, // Updated
        { id: 3, name: 'Bob', email: 'bob@test.com' }, // Unchanged
        { id: 4, name: 'Alice', email: 'alice@test.com' }, // Added
        // Jane (id: 2) was deleted
      ]

      const result = compareDatasets(oldData, newData, mockTimestamp, 'user')

      // Should have: 1 add + 1 delete + 2 updates (name and email for John)
      expect(result).toHaveLength(4)

      const addEntry = result.find(entry => entry.type === 'add')
      const deleteEntry = result.find(entry => entry.type === 'delete')
      const updateEntries = result.filter(entry => entry.type === 'update')

      expect(addEntry.entity_id).toBe(4)
      expect(deleteEntry.entity_id).toBe(2)
      expect(updateEntries).toHaveLength(2)
      expect(updateEntries.every(entry => entry.entity_id === 1)).toBe(true)
    })
  })

  describe('Data type handling', () => {
    it('should handle different data types', () => {
      const oldData = [
        { id: 1, name: 'John', age: 25, active: true, score: 95.5 },
      ]
      const newData = [
        { id: 1, name: 'John', age: 26, active: false, score: 97.2 },
      ]

      const result = compareDatasets(oldData, newData, mockTimestamp, 'user')

      expect(result).toHaveLength(3) // age, active, score changes

      const ageUpdate = result.find(entry => entry.variable === 'age')
      const activeUpdate = result.find(entry => entry.variable === 'active')
      const scoreUpdate = result.find(entry => entry.variable === 'score')

      expect(ageUpdate.old_value).toBe(25)
      expect(ageUpdate.new_value).toBe(26)
      expect(activeUpdate.old_value).toBe(true)
      expect(activeUpdate.new_value).toBe(false)
      expect(scoreUpdate.old_value).toBe(95.5)
      expect(scoreUpdate.new_value).toBe(97.2)
    })

    it('should handle string and number IDs', () => {
      const oldData = [
        { id: 'user_1', name: 'John' },
        { id: 123, name: 'Jane' },
      ]
      const newData = [
        { id: 'user_1', name: 'Johnny' },
        { id: 123, name: 'Jane' },
        { id: 'user_2', name: 'Bob' },
      ]

      const result = compareDatasets(oldData, newData, mockTimestamp, 'user')

      expect(result).toHaveLength(2) // 1 update + 1 add

      const updateEntry = result.find(entry => entry.type === 'update')
      const addEntry = result.find(entry => entry.type === 'add')

      expect(updateEntry.entity_id).toBe('user_1')
      expect(addEntry.entity_id).toBe('user_2')
    })
  })

  describe('Helper function: get_first_parent_id', () => {
    it('should return first _id field found', () => {
      // We need to access the helper function through the module
      // Since it's not exported, we'll test it indirectly through the delete operation
      const oldData = [
        { id: 1, name: 'John', company_id: 5, department_id: 10 },
      ]
      const newData = []

      const result = compareDatasets(oldData, newData, mockTimestamp, 'user')

      expect(result[0].parent_entity_id).toBe(5) // Should be company_id, first _id field
    })

    it('should return null when no _id fields exist', () => {
      const oldData = [{ id: 1, name: 'John', email: 'john@test.com' }]
      const newData = []

      const result = compareDatasets(oldData, newData, mockTimestamp, 'user')

      expect(result[0].parent_entity_id).toBe(null)
    })
  })
})
