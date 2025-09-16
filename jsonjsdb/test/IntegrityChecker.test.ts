import { describe, it, expect, beforeEach } from 'vitest'
import IntegrityChecker from '../src/IntegrityChecker'

describe('IntegrityChecker', () => {
  let checker: IntegrityChecker

  beforeEach(() => {
    checker = new IntegrityChecker()
  })

  describe('Constructor', () => {
    it('should create instance with default state', () => {
      expect(checker).toBeInstanceOf(IntegrityChecker)
    })
  })

  describe('check() - Empty database', () => {
    it('should return empty results for empty database', () => {
      const db = {
        __table__: [],
      }

      const result = checker.check(db)

      expect(result).toEqual({
        empty_id: [],
        duplicate_id: {},
        parent_id_not_found: {},
        parent_id_same: {},
        foreign_id_not_found: {},
      })
    })
  })

  describe('check() - Empty ID detection', () => {
    it('should detect empty string IDs', () => {
      const db = {
        __table__: [{ name: 'user' }],
        user: [
          { id: 1, name: 'John' },
          { id: '', name: 'Jane' },
          { id: 3, name: 'Bob' },
        ],
      }

      const result = checker.check(db)

      expect(result.empty_id).toContain('user')
    })

    it('should detect null IDs', () => {
      const db = {
        __table__: [{ name: 'user' }],
        user: [
          { id: 1, name: 'John' },
          { id: null, name: 'Jane' },
          { id: 3, name: 'Bob' },
        ],
      }

      const result = checker.check(db)

      expect(result.empty_id).toContain('user')
    })

    it('should not flag valid IDs', () => {
      const db = {
        __table__: [{ name: 'user' }],
        user: [
          { id: 1, name: 'John' },
          { id: 2, name: 'Jane' },
          { id: 'uuid-123', name: 'Bob' },
        ],
      }

      const result = checker.check(db)

      expect(result.empty_id).not.toContain('user')
    })

    it('should ignore tables where no row has an id field at all', () => {
      const db = {
        __table__: [{ name: 'user' }],
        user: [{ name: 'John' }, { name: 'Jane' }, { name: 'Bob' }],
      }

      const result = checker.check(
        db as { __table__: { name: string }[]; user: { name: string }[] }
      )

      expect(result.empty_id).not.toContain('user')
      expect(result.duplicate_id.user).toBeUndefined()
    })
  })

  describe('check() - Duplicate ID detection', () => {
    it('should detect duplicate IDs', () => {
      const db = {
        __table__: [{ name: 'user' }],
        user: [
          { id: 1, name: 'John' },
          { id: 2, name: 'Jane' },
          { id: 1, name: 'Bob' },
          { id: 3, name: 'Alice' },
          { id: 2, name: 'Charlie' },
        ],
      }

      const result = checker.check(db)

      expect(result.duplicate_id.user).toContain(1)
      expect(result.duplicate_id.user).toContain(2)
      expect(result.duplicate_id.user).not.toContain(3)
    })

    it('should not flag unique IDs', () => {
      const db = {
        __table__: [{ name: 'user' }],
        user: [
          { id: 1, name: 'John' },
          { id: 2, name: 'Jane' },
          { id: 3, name: 'Bob' },
        ],
      }

      const result = checker.check(db)

      expect(result.duplicate_id.user).toBeUndefined()
    })
  })

  describe('check() - Parent ID same detection', () => {
    it('should detect when parent_id equals id', () => {
      const db = {
        __table__: [{ name: 'category' }],
        category: [
          { id: 1, name: 'Electronics', parent_id: null },
          { id: 2, name: 'Phones', parent_id: 1 },
          { id: 3, name: 'Self-referencing', parent_id: 3 },
        ],
      }

      const result = checker.check(db)

      expect(result.parent_id_same.category).toContain(3)
      expect(result.parent_id_same.category).not.toContain(1)
      expect(result.parent_id_same.category).not.toContain(2)
    })

    it('should handle tables without parent_id column', () => {
      const db = {
        __table__: [{ name: 'user' }],
        user: [
          { id: 1, name: 'John' },
          { id: 2, name: 'Jane' },
        ],
      }

      const result = checker.check(db)

      expect(result.parent_id_same.user).toBeUndefined()
    })
  })

  describe('check() - Parent ID not found detection', () => {
    it('should detect invalid parent_id references', () => {
      const db = {
        __table__: [{ name: 'category' }],
        category: [
          { id: 1, name: 'Electronics', parent_id: null },
          { id: 2, name: 'Phones', parent_id: 1 },
          { id: 3, name: 'Invalid', parent_id: 999 },
        ],
      }

      const result = checker.check(db)

      expect(result.parent_id_not_found.category).toContain(999)
      expect(result.parent_id_not_found.category).not.toContain(1)
    })

    it('should ignore null and empty parent_id values', () => {
      const db = {
        __table__: [{ name: 'category' }],
        category: [
          { id: 1, name: 'Electronics', parent_id: null },
          { id: 2, name: 'Phones', parent_id: '' },
          { id: 3, name: 'Tablets', parent_id: 1 },
        ],
      }

      const result = checker.check(db)

      expect(result.parent_id_not_found.category).toBeUndefined()
    })
  })

  describe('check() - Foreign ID detection', () => {
    it('should detect invalid foreign key references', () => {
      const db = {
        __table__: [{ name: 'user' }, { name: 'post' }],
        user: [
          { id: 1, name: 'John' },
          { id: 2, name: 'Jane' },
        ],
        post: [
          { id: 1, title: 'Post 1', user_id: 1 },
          { id: 2, title: 'Post 2', user_id: 999 },
          { id: 3, title: 'Post 3', user_id: 2 },
        ],
      }

      const result = checker.check(db)

      expect(result.foreign_id_not_found.post).toBeDefined()
      expect(result.foreign_id_not_found.post.user_id).toContain(999)
      expect(result.foreign_id_not_found.post.user_id).not.toContain(1)
      expect(result.foreign_id_not_found.post.user_id).not.toContain(2)
    })

    it('should ignore null and empty foreign key values', () => {
      const db = {
        __table__: [{ name: 'user' }, { name: 'post' }],
        user: [{ id: 1, name: 'John' }],
        post: [
          { id: 1, title: 'Post 1', user_id: 1 },
          { id: 2, title: 'Post 2', user_id: null },
          { id: 3, title: 'Post 3', user_id: '' },
        ],
      }

      const result = checker.check(db)

      expect(result.foreign_id_not_found.post).toBeUndefined()
    })

    it('should ignore parent_id in foreign key detection', () => {
      const db = {
        __table__: [{ name: 'category' }],
        category: [
          { id: 1, name: 'Electronics', parent_id: null },
          { id: 2, name: 'Phones', parent_id: 1 },
        ],
      }

      const result = checker.check(db)

      // parent_id should not be treated as a foreign key
      expect(result.foreign_id_not_found.category).toBeUndefined()
    })
  })

  describe('check() - Complex scenarios', () => {
    it('should handle multiple tables with multiple issues', () => {
      const db = {
        __table__: [{ name: 'user' }, { name: 'post' }, { name: 'comment' }],
        user: [
          { id: 1, name: 'John' },
          { id: '', name: 'Invalid User' }, // Empty ID
          { id: 1, name: 'Duplicate John' }, // Duplicate ID
        ],
        post: [
          { id: 1, title: 'Post 1', user_id: 1 },
          { id: 2, title: 'Post 2', user_id: 999 }, // Invalid foreign key
        ],
        comment: [
          { id: 1, text: 'Comment 1', post_id: 1, user_id: 1 },
          { id: 2, text: 'Comment 2', post_id: 999, user_id: 1 }, // Invalid post_id
          { id: 3, text: 'Comment 3', post_id: 1, user_id: 888 }, // Invalid user_id
        ],
      }

      const result = checker.check(db)

      // Check empty IDs
      expect(result.empty_id).toContain('user')

      // Check duplicate IDs
      expect(result.duplicate_id.user).toContain(1)

      // Check foreign key violations
      expect(result.foreign_id_not_found.post.user_id).toContain(999)
      expect(result.foreign_id_not_found.comment.post_id).toContain(999)
      expect(result.foreign_id_not_found.comment.user_id).toContain(888)
    })

    it('should handle valid database with no issues', () => {
      const db = {
        __table__: [{ name: 'user' }, { name: 'post' }],
        user: [
          { id: 1, name: 'John' },
          { id: 2, name: 'Jane' },
        ],
        post: [
          { id: 1, title: 'Post 1', user_id: 1 },
          { id: 2, title: 'Post 2', user_id: 2 },
        ],
      }

      const result = checker.check(db)

      expect(result.empty_id).toHaveLength(0)
      expect(Object.keys(result.duplicate_id)).toHaveLength(0)
      expect(Object.keys(result.parent_id_not_found)).toHaveLength(0)
      expect(Object.keys(result.parent_id_same)).toHaveLength(0)
      expect(Object.keys(result.foreign_id_not_found)).toHaveLength(0)
    })
  })

  describe('check() - Edge cases', () => {
    it('should handle empty tables', () => {
      const db = {
        __table__: [{ name: 'user' }],
        user: [],
      }

      const result = checker.check(db)

      expect(result.empty_id).not.toContain('user')
      expect(result.duplicate_id.user).toBeUndefined()
    })

    it('should handle string and number IDs consistently', () => {
      const db = {
        __table__: [{ name: 'user' }, { name: 'post' }],
        user: [
          { id: '1', name: 'John' },
          { id: 2, name: 'Jane' },
        ],
        post: [
          { id: 1, title: 'Post 1', user_id: '1' },
          { id: 2, title: 'Post 2', user_id: 2 },
        ],
      }

      const result = checker.check(db)

      // Should not report foreign key violations for string vs number IDs
      expect(result.foreign_id_not_found.post).toBeUndefined()
    })
  })
})
