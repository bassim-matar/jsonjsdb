[![NPM Version](https://img.shields.io/npm/v/jsonjsdb_editor)](https://www.npmjs.com/package/jsonjsdb_editor)
![npm bundle size](https://img.shields.io/bundlephobia/minzip/jsonjsdb_editor)
[![NPM License](https://img.shields.io/npm/l/jsonjsdb_editor)](../LICENSE)

# Jsonjsdb_editor

Jsonjsdb_editor is a tool to transform relationnal tables into a jsonjs database
(see [https://github.com/bassim-matar/jsonjsdb](https://github.com/bassim-matar/jsonjsdb)).

For now it works only with xlsx files as a source, where each file contains one table.

## basic examples

### simple update

First argument is the path to the source db folder containing the xlsx files.
Second argument is the path to the jsonjsdb folder.

```js
import Jsonjsdb_editor from "../../../dist/jsonjsdb_editor.js"

const editor = new Jsonjsdb_editor("db", "app_db")
editor.update_db()
```

### inside a vite config file

The Jsonjsdb_watcher is used to watch and update the jsonjsdb.
Any time a source db file is updated, the jsonjsdb will be updated and the vite app will reload.

The jsonjsdb_add_config will add the jsonjsdb_config file to the index.html at serve and build time.

```js
import { Jsonjsdb_watcher, jsonjsdb_add_config } from "jsonjsdb_editor"

await Jsonjsdb_watcher.watch("db", "public/data/db")

export default defineConfig({
  plugins: [
    Jsonjsdb_watcher.reload(),
    jsonjsdb_add_config("public/data/jsonjsdb_config.html"),
  ],
})
```
