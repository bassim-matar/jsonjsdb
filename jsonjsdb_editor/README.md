[![NPM Version](https://img.shields.io/npm/v/jsonjsdb_editor)](https://www.npmjs.com/package/jsonjsdb_editor)
[![NPM License](https://img.shields.io/npm/l/jsonjsdb_editor)](../LICENSE)

# Jsonjsdb Editor

A development tool for converting relational database tables into jsonjs format compatible with [jsonjsdb](../jsonjsdb).

Currently supports Excel (.xlsx) files as source, where each file represents one database table.

## Installation

```bash
npm install jsonjsdb_editor
```

## Table of Contents

- [Basic Usage](#basic-usage)
- [Vite Integration](#vite-integration)
- [API Reference](#api-reference)
- [File Structure](#file-structure)

## Basic Usage

### Simple Database Update

Convert Excel files to jsonjs format:

```js
import Jsonjsdb_editor from 'jsonjsdb_editor'

const editor = new Jsonjsdb_editor()
await editor.set_output_db('app_db') // Output directory
await editor.update_db('db') // Source Excel files directory
```

**Parameters:**

- `app_db`: Target directory for generated jsonjs files
- `db`: Source directory containing .xlsx files

## Vite Integration

### Development Workflow

Integrate with Vite for automatic database updates during development:

```js
import { defineConfig } from 'vite'
import FullReload from 'vite-plugin-full-reload'
import { Jsonjsdb_watcher, jsonjsdbAddConfig } from 'jsonjsdb_editor'

// Setup database watcher
await Jsonjsdb_watcher.set_db('app_db')
await Jsonjsdb_watcher.watch('db')
await Jsonjsdb_watcher.update_preview('preview', 'data')

export default defineConfig({
  plugins: [
    jsonjsdbAddConfig('data/jsonjsdb_config.html'),
    process.env.NODE_ENV &&
      FullReload(Jsonjsdb_watcher.get_table_index_file_path()),
  ],
})
```

**Features:**

- **Auto-reload**: Automatically updates jsonjs files when Excel sources change
- **Config injection**: Adds jsonjsdb configuration to your HTML
- **Hot reload**: Triggers browser refresh on database changes
