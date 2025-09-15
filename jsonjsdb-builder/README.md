[![NPM Version](https://img.shields.io/npm/v/jsonjsdb-builder)](https://www.npmjs.com/package/jsonjsdb-builder)
[![NPM License](https://img.shields.io/npm/l/jsonjsdb-builder)](../LICENSE)

# Jsonjsdb Builder

A development tool for converting relational database tables into jsonjs format compatible with [jsonjsdb](../jsonjsdb).

Currently supports Excel (.xlsx) files as source, where each file represents one database table.

## Installation

```bash
npm install jsonjsdb-builder
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
import JsonjsdbBuilder from 'jsonjsdb-builder'

const builder = new JsonjsdbBuilder()
await builder.setOutputDb('app_db') // Output directory
await builder.updateDb('db') // Source Excel files directory
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
import { jsonjsdbWatcher, jsonjsdbAddConfig } from 'jsonjsdb-builder'

// Setup database watcher
await jsonjsdbWatcher.setDb('app_db')
await jsonjsdbWatcher.watch('db')
await jsonjsdbWatcher.updatePreview('preview', 'data')

export default defineConfig({
  plugins: [
    jsonjsdbAddConfig('data/jsonjsdb_config.html'),
    process.env.NODE_ENV && FullReload(jsonjsdbWatcher.getTableIndexFilePath()),
  ],
})
```

**Features:**

- **Auto-reload**: Automatically updates jsonjs files when Excel sources change
- **Config injection**: Adds jsonjsdb configuration to your HTML
- **Hot reload**: Triggers browser refresh on database changes
