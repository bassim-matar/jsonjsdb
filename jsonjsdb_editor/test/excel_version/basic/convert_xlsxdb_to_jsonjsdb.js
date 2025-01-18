import { Jsonjsdb_editor, Jsonjsdb_watcher } from "../../../dist/index.js"

// const editor = new Jsonjsdb_editor({readable: true})
// await editor.set_output_db("app_db")
// await editor.update_db("db")

await Jsonjsdb_watcher.set_db("app_db")
await Jsonjsdb_watcher.watch("db", true)
