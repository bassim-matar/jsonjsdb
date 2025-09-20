[![NPM Version](https://img.shields.io/npm/v/jsonjsdb)](https://www.npmjs.com/package/jsonjsdb)
![npm bundle size](https://img.shields.io/bundlephobia/minzip/jsonjsdb)
[![NPM License](https://img.shields.io/npm/l/jsonjsdb)](LICENSE)
[![CI](<https://github.com/bassim-matar/jsonjsdb/workflows/CI%20-%20Core%20(jsonjsdb)/badge.svg>)](https://github.com/bassim-matar/jsonjsdb/actions/workflows/ci-core.yml)

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
    - [`load()`](#loadfile_path-name)
  - [Data Retrieval](#data-retrieval)
    - [`get()`](#gettable-id)
    - [`get_all()`](#get_alltable-foreign_table_obj-option)
    - [`get_all_childs()`](#get_all_childstable-item_id)
  - [Utility Methods](#utility-methods)
    - [`foreach()`](#foreachtable-callback)
    - [`table_has_id()`](#table_has_idtable-id)
    - [`has_nb()`](#has_nbtable-id-nb_what)
    - [`get_parents()`](#get_parentsfrom-id)
    - [`get_config()`](#get_configid)
- [📄 License](#-license)

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

The more readable format:

```json
[
  {
    "column_1": 1,
    "column_2": "row 1",
    "column_3": "foo"
  },
  {
    "column_1": 2,
    "column_2": "row 2",
    "column_3": "bar"
  }
]
```

#### List of lists

The more compact format:

```json
[
  ["column_1", "column_2", "column_3"],
  [1, "row 1", "foo"],
  [2, "row 2", "bar"]
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

## API Reference

### Constructor

#### `new Jsonjsdb(config?)`

Creates a new Jsonjsdb instance.

```js
// Default configuration
const db = new Jsonjsdb()

// Custom configuration object
const db = new Jsonjsdb({ path: 'data/db', appName: 'myapp' })

// HTML configuration selector
const db = new Jsonjsdb('#my-config')
```

**Parameters:**

- `config` (optional): Configuration object or string selector for HTML configuration element

**Returns:** Jsonjsdb instance

---

### Data Loading

#### `init(option?)`

Initializes the database by loading all tables.

```js
const db = new Jsonjsdb()
const result = await db.init()
console.log('Database initialized:', result === db) // true
```

**Parameters:**

- `option` (optional): Configuration options for initialization

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

#### `tableHasId(table, id)`

Checks if a table contains a specific ID.

```js
if (db.tableHasId('user', 123)) {
  console.log('User exists')
}
```

**Parameters:**

- `table`: Name of the table to check
- `id`: ID to look for

**Returns:** boolean

#### `hasNb(table, id, nb_what)`

Counts how many records reference a specific ID in another table.

```js
// Count how many posts reference user 123
const postCount = db.hasNb('user', 123, 'post')
console.log(`User has ${postCount} posts`)
```

**Parameters:**

- `table`: The table name to use for foreign key (table + "\_id")
- `id`: ID of the referenced item
- `nbWhat`: Table name where to count references

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

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.
