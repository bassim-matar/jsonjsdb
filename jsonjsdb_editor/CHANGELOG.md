# jsonjsdb_editor

## 0.3.0 (2025-09-02)
- change : rename `__meta__` to `__table__`
- change : improve documentation

## 0.2.10 (2025-01-29)

- fixed : jsonjsdb_editor : dont stringify null values in history

## 0.2.9 (2025-01-26)

- fixed : jsonjsdb_editor : again dont update evolution timestamp if no change

## 0.2.8 (2025-01-21)

- fixed : jsonjsdb_editor : dont update evolution timestamp if no change

## 0.2.7 (2025-01-18)

- changed : make jsonjsdb_editor use xlsx state for history so we can edit it manually

## 0.2.6 (2025-01-18)

- changed : rename history to evolution

## 0.2.5 (2025-01-15)

- fixed : prevent adding entry when old and new value are both null or empty

## 0.2.4 (2025-01-12)

- fixed : history file was not included if no change

## 0.2.3 (2025-01-08)

- changed : replace column parent_ids by parent_entity_id by getting only the first column with suffix "_id"

## 0.2.2 (2025-01-07)

- added : name and parent_ids to history entries of type delete

## 0.2.1 (2024-12-28)

- fixed : compare_datasets method skip entity starting with "__"
- refactored : use vite to bundle the lib and move compare_datasets in a separate file

## 0.2.0 (2024-12-27)

- added : compare_datasets method to add history of changes

## 0.1.18 (2024-11-31)

- changed : improve update_md_files

## 0.1.17 (2024-10-31)

- added : update_md_files method to update md files into the db

## 0.1.16 (2024-10-17)

- changed : update main last modification timestamp only if change has been made

## 0.1.15 (2024-10-16)

- added : __meta__ row in __meta__ table to have the global timestamp of last modification
