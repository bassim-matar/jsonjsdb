[![NPM Version](https://img.shields.io/npm/v/jsonjsdb-builder)](https://www.npmjs.com/package/jsonjsdb-builder)
[![NPM License](https://img.shields.io/npm/l/jsonjsdb-builder)](LICENSE)
[![CI](https://github.com/bassim-matar/jsonjsdb/workflows/CI/badge.svg)](https://github.com/bassim-matar/jsonjsdb/actions/workflows/ci.yml)

# Jsonjsdb Builder

A development tool for converting relational database tables into jsonjs format compatible with [jsonjsdb](../jsonjsdb).

Currently supports Excel (.xlsx) files as source, where each file represents one database table.

## Installation

```bash
npm install jsonjsdb-builder
```

## Table of Contents

- [Basic Usage](#basic-usage)
- [Markdown Import](#markdown-import)
- [Preview Generation](#preview-generation)
- [Vite Integration](#vite-integration)
- [Low-level Utilities](#low-level-utilities)
- [API Reference](#api-reference)
- [File Structure](#file-structure)
- [License](#license)

## Basic Usage

### Simple Database Update

Convert Excel files to jsonjs format:

```js
import JsonjsdbBuilder from 'jsonjsdb-builder'

const builder = new JsonjsdbBuilder()
await builder.setOutputDb('app_db') // Output directory
await builder.updateDb('db') // Source Excel files directory
```

**Parameters:**

- `app_db`: Target directory for generated jsonjs files
- `db`: Source directory containing .xlsx files

## Markdown Import

Import a folder of Markdown files and expose them as jsonjs tables:

```js
import { JsonjsdbBuilder } from 'jsonjsdb-builder'

const builder = new JsonjsdbBuilder()
await builder.setOutputDb('app_db')
await builder.updateMdDir('markdown', 'content_md')
// Generates app_db/markdown/<file>.json.js
```

The generated format is: `jsonjs.data["<name>"] = [{ "content": "..." }]`.

## Preview Generation

Generate a lightweight preview (simple read of Excel files into a subfolder):

```js
await builder.updatePreview('preview', 'db')
// Reads each .xlsx from /db and writes to /app_db/preview
```

## Vite Integration

Configure a simple watcher and auto-reload in your Vite setup:

```js
import { defineConfig } from 'vite'
import { initJsonjsdbBuilder } from 'jsonjsdb-builder'

const builder = await initJsonjsdbBuilder(
  {
    dbPath: 'public/data/db',
    dbSourcePath: 'public/data/db-source',
    previewPath: 'public/data/dataset',
    mdPath: 'public/data/md',
    configPath: 'public/data/jsonjsdb-config.html',
  },
  { isDevelopment: process.env.NODE_ENV === 'development' },
)

export default defineConfig({
  plugins: builder.getVitePlugins(),
})
```

This includes:

- Database watching in development mode
- Config injection plugin
- Auto-reload on database changes

## Low-level Utilities

Low-level utility functions are exported for advanced use:

```js
import {
  jsonjsdbToObjects,
  jsonjsdbToMatrix,
  jsonjsdbRead,
  jsonjsdbWrite,
} from 'jsonjsdb-builder'

// Convert 2D matrix -> array of objects
const objects = jsonjsdbToObjects([
  ['id', 'name'],
  [1, 'Alice'],
  [2, 'Bob'],
])

// Directly write a jsonjs file
await jsonjsdbWrite('app_db', 'users', [
  ['id', 'name'],
  [1, 'Alice'],
])
```

## API Reference

### Class: JsonjsdbBuilder

Methods:

- `setOutputDb(dir: string)`: Ensure/create and set the output directory.
- `updateDb(inputDir: string)`: Convert all `.xlsx` files into jsonjs tables and update metadata / evolution log.
- `updateMdDir(subdir: string, sourceDir: string)`: Import a markdown directory as jsonjs tables (key = file basename).
- `updatePreview(subfolder: string, sourceDir: string)`: Perform a simple read of source Excel files into a subfolder (no metadata changes).
- `getOutputDb(): string`: Absolute path of the output directory.
- `getTableIndexFile(): string`: Path of the `__table__.json.js` index file.

Utilities:

- `jsonjsdbToObjects(matrix)`
- `jsonjsdbToMatrix(objects)`
- `jsonjsdbRead(filePath)`
- `jsonjsdbWrite(dir, name, data, options?)`

## File Structure

Typical generated structure inside `outputDb`:

```
app_db/
  __table__.json.js         # Table index + metadata
  user.json.js
  tag.json.js
  evolution.json.js         # Evolution log (only if changes)
  markdown/
    intro.json.js
  preview/
    user.json.js            # copy generated via updatePreview
```

## License

MIT License - see [LICENSE](LICENSE) for details.
