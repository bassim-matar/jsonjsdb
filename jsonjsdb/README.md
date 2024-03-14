[![NPM Version](https://img.shields.io/npm/v/jsonjsdb)](https://www.npmjs.com/package/jsonjsdb)
![npm bundle size](https://img.shields.io/bundlephobia/minzip/jsonjsdb)
[![NPM License](https://img.shields.io/npm/l/jsonjsdb)](../LICENSE)

# Jsonjsdb

A client side relational database for static Single Page Application (SPA).
Jsonjsdb allows to load and query data when running on the local file system (file://). 
No server needed.

## Usage and limitation

### When (not) to use
Jsonjsdb doesn't work for live or interactive data.
It is like on a static website, users can't interact with each other or update the database.
With this important limitation, Jsonjsdb works for static SPA,
where the database is updated in batch periodically.
Another limitation is the database size that can't be too big
because it's entirely loaded in memory when initialized. 
In some tests with a modern computer and browser, 
the database maximum size that can be handled is around 100mb to 200mb.

### Why it can be useful
- It's portable. The exact same app can run on a server, 
on a shared drive or a personal computer,
and can be installed just by drag and drop the app folder anywhere.
- It's easy to setup, to run and to maintain. 
Focus on the client side code without having to deal with complexe server backend and database.
- It's cheap to deploy, especialy in a corporate setting 
where security concerns make integrating a new app a heavy process.

## Basic example

Include the lib in the html head :
```html
<script src="/dist/Jsonjsdb.min.js"></script>
```

or as an esm/es6 module :
```js
import Jsonjsdb from "jsonjsdb"
```

Use it in your js script :
```js
const db = new Jsonjsdb()
db.init().then(() => {
  const users = db.get_all("user")
  console.log(users)
})
```

## Database structure and management
The relational database has some requirements in his structure :
- The database is contained in a folder, named by default *db*. 
This folder is in the same folder than the html file (entry point). 
There is a parameter to use a different folder name or to put it in a subfolder if needed.
- The db folder contains some tables, represented by files with the extension *.json.js*. 
Each jsonjs file is a table.
- The db folder contains a file named *\_\_meta__.json.js*. It list all the table names.

### The jsonjs file

The jsonjs file starts with the javascript instansiation of the json data, 
generaly on the first line.

```js
jsonjs.data.my_table_name = 
```
or
```js
jsonjs.data['my_table_name'] = 
```

After that, generaly on the second line, is the the json data, 
always representing a simple table with columns and rows. 
The data can be minified or not and currently work with two possible structures:

#### List of objects
The more readable one.
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
  },
]
```

#### List of lists
The more compact one
```json
[
  ["column_1", "column_2", "column_3"],
  [1, "row 1", "foo"],
  [2, "row 2", "bar"],
]
```

### Table and column naming
To make the database relational, some special naming is required:
- Table name and file name are identical
- Table name use camelCase
- Underscore in table name are reserved for junction table, 
for example: *myTable_yourTable*
- The primary key is a column named *id*.
- Foreign keys are columns named by the foreign table with suffix *_id*, 
for example yourTable_id

## API Overview

| Method | Description | Parameters | Returns |
| --- | --- | --- | --- |
| `constructor()` | Creates a new `Jsonjsdb` instance. | `config` (optional): Configuration options for the database. | An instance of `Jsonjsdb`. |
| `init()` | Initializes the database with the specified options. | `option` (optional): Options for initializing the database. | A promise that resolves with the initialized database, or false if initialization failed. |
| `get()` | Gets the data associated with the specified ID in the specified table. | `table`: The name of the table to get data from.<br>`id`: The ID of the data to get. | The data associated with the ID, or null if no such data exists. |
| `get_all()` | Gets a list of all rows associated with the specified table. | `table`: The name of the table to get data from.<br>`foreign_table_obj` (optional): object with foreign table as key and foreign id (or foreign object with id) as value. <br>`option` (optional): option object where you can set max row limit. | A list of rows from a table |
| `get_all_childs()` | Gets all childs recursively from a row. | `table`: The name of the tabl.<br>`item_id`: id of the parent row. | A list of rows from a table |
| `foreach()` | Apply a transformation to each row of the table | `table`: The name of the table. <br>`callback`: a function to run on each row | Nothing |
| `table_has_id()` | Checks if the specified table contains the specified ID. | `table`: The name of the table to check.<br>`id`: The ID to look for. | True if the table contains the ID, false otherwise. |
| `has_nb()` | Counts the specified items from the specified table. | `table`: The table to count from.<br>`id`: The ID of the item to count.<br>`nb_what`: What to count. | The count of the specified items. |
| `get_parents()` | Gets the parents of the specified item in the specified table. | `from`: The table to get from.<br>`id`: The ID of the item to get parents for. | An array of the parents of the specified item. |
