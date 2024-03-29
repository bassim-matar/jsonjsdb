import Jsonjsdb_editor from "../../../dist/jsonjsdb_editor.js"

const editor = new Jsonjsdb_editor()
await editor.set_output_db("app_db")
await editor.update_db("db")
