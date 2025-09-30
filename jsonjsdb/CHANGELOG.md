# jsonjsdb

## 0.7.2 (2025-09-30)

- add: escapeHtml to prevent XSS attacks when rendering data in HTML context
- fix: tables type and and checkIntegrity method in Jsonjsdb class

## 0.7.1 (2025-09-29)

- add: support for undefined values in ForeignTableObj interface
- add: comprehensive tests for countRelated() methods
- change: make DatabaseRow.id optional to support tables without id
- change: rename `tableHasId()` to `exists()` for better API clarity
- change: rename `hasNb()` to `countRelated()` for professional naming

### 0.7.0 (2025-09-28)

- add: generic type, getSchema method and "use" prop for existing entities
- refactor: use metadata property for metadata tables so the tables property is kept for actual data tables

## 0.6.6 (2025-09-20)

- fix: remove git tag creation and push from release workflow

## 0.6.5 (2025-09-20)

- add: ci/cd github action for automated test and releases

## 0.6.4 (2025-09-16)

- fix: IntegrityChecker empty ID detection logic (build issue)

## 0.6.3 (2025-09-16)

- fix: IntegrityChecker empty ID detection logic

## 0.6.2 (2025-09-16)

- fix: DBrowser set data without stringify

## 0.6.1 (2025-09-16)

- fix: aliases format

## 0.6.0 (2025-09-16)

- add: test for DBrowser and IntegrityChecker
- change: apply strict type checking and standard naming conventions

## 0.5.0 (2025-09-11)

- change: improve alias creation with initial aliases
- change: move from js to ts and from rollup to vite

## 0.4.1 (2025-09-04)

- fix: add_meta second parameter

## 0.4.0 (2025-09-02)

- change: rename `__meta__` to `__table__`
- change: improve documentation

## 0.3.14 (2025-05-15)

- add: param to set db_schema in add_meta()

## 0.3.13 (2025-05-14)

- fix: typo in add_meta()

## 0.3.12 (2025-05-14)

- fix: remove from schema only metaDataset from user_data

## 0.3.11 (2025-05-14)

- fix: metaDataset duplicate entry in schema

## 0.3.10 (2025-05-14)

- add: metadata only in schema but not in data

## 0.3.9 (2024-10-29)

- add: show error and filter for duplicate table name in meta

## 0.3.8 (2024-10-16)

- add: get alias from config file

## 0.3.7 (2024-10-16)

- add: get_last_modif_timestamp() type

## 0.3.6 (2024-10-16)

- add: timestamp last modification from **meta** file

## 0.3.5 (2024-10-15)

- add: one **meta_schema**.json.js file to replace other meta schema files

## 0.3.4 (2024-10-14)

- fix: again Loader.\_normalize_schema() with no ids found

## 0.3.3 (2024-10-13)

- fix: Loader.\_normalize_schema() with no ids found

## 0.3.2 (2024-10-13)

- add: last_update_timestamp to metaDataset

## 0.3.1 (2024-10-13)

- remove: metaDataset virtual (created at load time) from meta schema

## 0.3.0 (2024-10-11)

- add: Loader \_normalize_schema() method to normalize schema
