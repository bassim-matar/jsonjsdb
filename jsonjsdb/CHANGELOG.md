# jsonjsdb

## 0.3.14 (2025-05-15)
- added : param to set db_schema in add_meta() 

## 0.3.13 (2025-05-14)
- fixed : typo in add_meta()

## 0.3.12 (2025-05-14)
- fixed : remove from schema only metaDataset from user_data 

## 0.3.11 (2025-05-14)
- fixed : metaDataset duplicate entry in schema

## 0.3.10 (2025-05-14)
- added : metadata only in schema but not in data

## 0.3.9 (2024-10-29)
- added : show error and filter for duplicate table name in meta

## 0.3.8 (2024-10-16)
- added : get alias from config file

## 0.3.7 (2024-10-16)
- added : get_last_modif_timestamp() type

## 0.3.6 (2024-10-16)

- added : timestamp last modification from __meta__ file

## 0.3.5 (2024-10-15)

- added : one __meta_schema__.json.js file to replace other meta schema files

## 0.3.4 (2024-10-14)

- fixed : again Loader._normalize_schema() with no ids found

## 0.3.3 (2024-10-13)

- fixed : Loader._normalize_schema() with no ids found

## 0.3.2 (2024-10-13)

- added : last_update_timestamp to metaDataset

## 0.3.1 (2024-10-13)

- removed : metaDataset virtual (created at load time) from meta schema

## 0.3.0 (2024-10-11)

- added : Loader \_normalize_schema() method to normalize schema
