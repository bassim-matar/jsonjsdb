[![NPM Version](https://img.shields.io/npm/v/jsonjsdb)](https://www.npmjs.com/package/jsonjsdb)
![npm bundle size](https://img.shields.io/bundlephobia/minzip/jsonjsdb)
[![NPM License](https://img.shields.io/npm/l/jsonjsdb)](LICENSE)
[![CI](https://github.com/bassim-matar/jsonjsdb/workflows/CI/badge.svg)](https://github.com/bassim-matar/jsonjsdb/actions/workflows/ci.yml)

# Jsonjsdb - Core Library

> 📖 For project overview, use cases, and limitations, see the [main documentation](../README.md)

A client-side relational database solution for static Single Page Applications. This library enables offline data storage and querying when running applications on the local file system without server infrastructure.

## Table of Contents

- [Installation](#installation)
- [Basic Example](#basic-example)
- [Database Structure and Management](#database-structure-and-management)
  - [Configuration](#configuration)
  - [The jsonjs File](#the-jsonjs-file)
    - [List of objects](#list-of-objects)
    - [List of lists](#list-of-lists)
  - [Table and Column Naming](#table-and-column-naming)
- [API Reference](#api-reference)
  - [Constructor](#constructor)
    - [`new Jsonjsdb()`](#new-jsonjsdbconfig)
  - [Data Loading](#data-loading)
    - [`init()`](#initoption)
    - [`load()`](#loadfilePath-name)
  - [Data Retrieval](#data-retrieval)
    - [`get()`](#gettable-id)
    - [`getAll()`](#getalltable-foreigntableobj-option)
    - [`getAllChilds()`](#getallchildstable-itemid)
  - [Utility Methods](#utility-methods)
    - [`foreach()`](#foreachtable-callback)
    - [`exists()`](#existstable-id)
    - [`countRelated()`](#countrelatedtable-id-relatedtable)
    - [`getParents()`](#getparentsfrom-id)
    - [`getConfig()`](#getconfigid)
    - [`getSchema()`](#getschema)
  - [Properties](#properties)
    - [`use`](#use)
    - [`useRecursive`](#userecursive)
  - [TypeScript Support](#typescript-support)
- [License](#license)

## Installation

Install via npm:

```bash
npm install jsonjsdb
```

Or include directly in your HTML:

```html
<script src="/dist/Jsonjsdb.min.js"></script>
```

## Basic Example

### ES6/Module Usage (Recommended)

```js
import Jsonjsdb from 'jsonjsdb'

const db = new Jsonjsdb()
await db.init()

// Get all users
const users = db.getAll('user')
console.log(users)

// Get specific user
const user = db.get('user', 123)
console.log(user)
```

### Script Tag Usage

Include the library in your HTML:

```html
<script src="/dist/Jsonjsdb.min.js"></script>
```

Then use it in your JavaScript:

```js
const db = new Jsonjsdb()
db.init().then(() => {
  const users = db.getAll('user')
  console.log(users)
})
```

## Database structure and management

The relational database has specific structural requirements:

- By default, the database is contained in a folder named _db_.
  This folder should be located in the same directory as the HTML file (entry point).
- The database folder can be customized using the configuration parameters (see Configuration section below).
- The db folder contains tables represented by files with the _.json.js_ extension.
  Each jsonjs file represents a table.
- The db folder contains a file named _\_\_table\_\_.json.js_ that lists all table names.

### Configuration

By default, the application uses a configuration automatically embedded in your HTML file:

```html
<div
  id="jsonjsdb-config"
  style="display:none;"
  data-app-name="dtnr"
  data-path="data/db"
  data-db-key="R63CYikswPqAu3uCBnsV"
></div>
```

**Parameters:**

- **data-app-name**: Application identifier (keep as `"dtnr"`)
- **data-path**: Path to your database folder (usually `"data/db"`)
- **data-db-key**: Unique key for your data instance (generate new one if needed)
- **data-valid-id-chars** (optional): Valid characters for IDs. Default is `"a-zA-Z0-9_, -"` (alphanumeric, underscore, comma, space, and hyphen). Invalid characters will be removed automatically

You can customize this configuration by passing the ID of the HTML div containing the configuration:

```js
const db = new Jsonjsdb('#jsonjsdb-config')
```

### The jsonjs file

The jsonjs file begins with the JavaScript instantiation of the JSON data,
typically on the first line.

```js
jsonjs.data.my_table_name =
```

or

```js
jsonjs.data['my_table_name'] =
```

Following this, typically on the second line, is the JSON data,
which always represents a simple table structure with columns and rows.
The data can be minified or formatted and currently supports two possible structures:

#### List of objects

The more readable format (shown here with snake_case, which will be transformed to camelCase at runtime):

```json
[
  {
    "id": 1,
    "user_name": "John Doe",
    "email_address": "john@example.com"
  },
  {
    "id": 2,
    "user_name": "Jane Smith",
    "email_address": "jane@example.com"
  }
]
```

#### List of lists

The more compact format (column headers will be transformed to camelCase at runtime):

```json
[
  ["id", "user_name", "email_address"],
  [1, "John Doe", "john@example.com"],
  [2, "Jane Smith", "jane@example.com"]
]
```

### Table and column naming

To implement relational database functionality, specific naming conventions are required:

- Table names and file names must be identical
- Table names should use camelCase convention
- Underscores in table names are reserved for junction tables,
  for example: _myTable_yourTable_
- The primary key must be a column named _id_
- Foreign keys are columns named after the foreign table with the suffix _\_id_,
  for example: _yourTable_id_

**Column Naming and Automatic Transformation:**

- In `.json.js` files (storage format), column names can use either `snake_case` or `camelCase`
- Column names are **automatically transformed to camelCase** when data is loaded into memory
- This allows compatibility with database exports, Excel files, and SQL conventions while maintaining JavaScript idiomatic naming at runtime
- Example: A column named `user_name` in the file becomes `userName` in JavaScript objects
- Foreign key columns like `user_id` become `userId` when accessed in code

```js
// In file: user.json.js
;[{ id: 1, first_name: 'John', last_name: 'Doe', parent_id: null }]

// In JavaScript after loading:
const user = db.get('user', 1)
console.log(user.firstName) // "John" (camelCase)
console.log(user.lastName) // "Doe"
console.log(user.parentId) // null
```

**ID Standardization:**

All ID values (in `id`, `*_id`, and `*_ids` columns) are automatically cleaned to ensure data consistency:

- Leading and trailing whitespace is removed (trimmed)
- Invalid characters are removed based on `validIdChars` configuration (see Configuration section above)
- Internal spaces are preserved (e.g., in comma-separated lists like `"tag1, tag2"`)
- Example: `" user@123 "` → `"user123"`, `"tag 1, tag 2"` → `"tag1, tag2"` (spaces after commas are kept)

## API Reference

### Constructor

#### `new Jsonjsdb(config?)`

Creates a new Jsonjsdb instance.

```js
// Default configuration
const db = new Jsonjsdb()

// Custom configuration object
const db = new Jsonjsdb({
  path: 'data/db',
  appName: 'myapp',
  validIdChars: 'a-zA-Z0-9_, -', // optional, this is the default
})

// HTML configuration selector
const db = new Jsonjsdb('#my-config')
```

**Parameters:**

- `config` (optional): Configuration object or string selector for HTML configuration element
  - `path`: Path to database folder
  - `appName`: Application name
  - `validIdChars`: Valid characters for IDs
  - Other options...

**Returns:** Jsonjsdb instance

---

### Data Loading

#### `init(option?)`

Initializes the database by loading all tables.

```js
const db = new Jsonjsdb()
const result = await db.init()
console.log('Database initialized:', result === db) // true

await db.init()
```

**Parameters:**

- `option` (optional): Configuration options for initialization
  - `filter`: Filter options
  - `aliases`: Table aliases
  - Other options...

**Returns:** Promise<Jsonjsdb> - Returns the database instance

#### `load(filePath, name)`

Loads a specific jsonjs file.

```js
const data = await db.load('custom_table.json.js', 'custom_table')
```

**Parameters:**

- `filePath`: Path to the jsonjs file (relative to db path)
- `name`: Name for the loaded data

**Returns:** Promise<any>

---

### Data Retrieval

#### `get(table, id)`

Gets a single row by ID from the specified table.

```js
const user = db.get('user', 123)
console.log(user) // { id: 123, name: "John", email: "john@example.com" }
```

**Parameters:**

- `table`: Name of the table
- `id`: ID of the row to retrieve

**Returns:** Object | undefined

#### `getAll(table, foreignTableObj?, option?)`

Gets all rows from a table, optionally filtered by foreign key relationships.

```js
// Get all users
const users = db.getAll('user')

// Get users with specific company_id
const companyUsers = db.getAll('user', { company: 5 })

// Limit results
const limitedUsers = db.getAll('user', null, { limit: 10 })
```

**Parameters:**

- `table`: Name of the table
- `foreignTableObj` (optional): Filter by foreign key { table_name: id_or_object }
- `option` (optional): Options object with limit property

**Returns:** Array of objects

#### `getAllChilds(table, itemId)`

Gets all child records recursively from a row (uses parent_id relationship).

```js
// Get all children of category 1
const children = db.getAllChilds('category', 1)
```

**Parameters:**

- `table`: Name of the table
- `itemId`: ID of the parent row

**Returns:** Array of objects

---

### Utility Methods

#### `foreach(table, callback)`

Applies a function to each row of the table.

```js
db.foreach('user', user => {
  user.full_name = `${user.first_name} ${user.last_name}`
})
```

**Parameters:**

- `table`: Name of the table
- `callback`: Function to apply to each row

**Returns:** void

#### `exists(table, id)`

Checks if a record with a specific ID exists in a table.

```js
if (db.exists('user', 123)) {
  console.log('User exists')
}
```

**Parameters:**

- `table`: Name of the table to check
- `id`: ID to look for

**Returns:** boolean

#### `countRelated(table, id, relatedTable)`

Counts how many records in a related table reference a specific ID.

```js
// Count how many posts reference user 123
const postCount = db.countRelated('user', 123, 'post')
console.log(`User has ${postCount} posts`)
```

**Parameters:**

- `table`: The table containing the record to count relations for
- `id`: ID of the record to count relations for
- `relatedTable`: Table name where to count references (looks for foreign key table + "\_id")

**Returns:** number

#### `getParents(from, id)`

Gets all parent records recursively using parent_id relationship.

```js
const parents = db.getParents('category', 5)
console.log(parents) // Array of parent categories (from immediate parent to root)
```

**Parameters:**

- `from`: Table to get parents from
- `id`: ID of the item to get parents for

**Returns:** Array of objects (in reverse order, from immediate parent to root)

#### `getConfig(id)`

Gets a configuration value from the config table.

```js
const setting = db.getConfig('max_items')
```

**Parameters:**

- `id`: Configuration key

**Returns:** any | undefined

#### `getSchema()`

Gets a copy of the database schema information.

```js
const schema = db.getSchema()
console.log(schema) // Complete schema structure with table definitions
```

**Parameters:** None

**Returns:** Schema object (deep clone of the metadata schema)

## Properties

### `use`

A computed property that returns an object indicating which tables are being used (non-empty tables without underscores).

```js
const usedTables = db.use
console.log(usedTables) // { user: true, post: true, ... }

// Check if a specific table is in use
if (db.use.user) {
  console.log('User table is being used')
}
```

### `useRecursive`

A computed property that returns an object indicating which tables have recursive relationships (contain `parent_id` field).

```js
const recursiveTables = db.useRecursive
console.log(recursiveTables) // { category: true, comment: true, ... }

// Check if a table supports hierarchical data
if (db.useRecursive.category) {
  console.log('Category table supports parent-child relationships')
}
```

## TypeScript Support

Jsonjsdb provides full TypeScript support with generic typing for your database tables. You can specify the types of your entities using the `TEntityTypeMap` generic parameter.

### Defining Your Entity Types

```typescript
import Jsonjsdb from 'jsonjsdb'

// Define your entity types
interface User {
  id: number
  name: string
  email: string
  company_id?: number
}

interface Company {
  id: number
  name: string
  website?: string
}

// Define your database schema type map
type MyDatabaseSchema = {
  user: User
  company: Company
}

// Create a typed database instance
const db = new Jsonjsdb<MyDatabaseSchema>()
await db.init()
```

### Benefits of TypeScript Typing

With proper typing, you get:

- **Intellisense and autocompletion** for table names and entity properties
- **Type safety during development** with static analysis in your IDE/editor

```typescript
// TypeScript knows 'user' is a valid table name
const user = db.get('user', 123) // user is typed as User | undefined

// TypeScript knows the properties of User
console.log(user?.name, user?.email)

// Get all users with type safety
const users = db.getAll('user') // users is typed as User[]

// Properties maintain their types
if (db.use.user) {
  // TypeScript knows 'user' is a valid key
  console.log('User table is being used')
}
```

## License

MIT License - see [LICENSE](LICENSE) for details.
