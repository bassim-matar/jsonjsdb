import path from "path"
import { promises as fs, existsSync } from "fs"
import readExcel from "read-excel-file/node"
import chokidar from "chokidar"
import { compare_datasets, HistoryEntry } from "./compare_datasets"

type MetadataObj = Record<string, number>
type TableRow = Record<string, any>
type Path = string
type Extension = "xlsx"
type Row = any[]

interface MetadataItem {
  name: string
  last_modif: number
}

export class Jsonjsdb_editor {
  private input_db: Path
  private output_db: Path
  private readable: boolean
  private extension: Extension
  private metadata_filename: string = "__meta__.json.js"
  private metadata_file: Path
  private update_db_timestamp: number
  private new_history_entries: HistoryEntry[]

  constructor(option: { readable?: boolean } = {}) {
    this.input_db = ""
    this.output_db = ""
    this.metadata_file = ""
    this.readable = option.readable ?? false
    this.extension = "xlsx"
    this.update_db_timestamp = 0
    this.new_history_entries = []
  }

  public async update_db(input_db: Path): Promise<void> {
    this.set_input_db(input_db)
    if (!existsSync(this.input_db)) {
      console.error(`Jsonjsdb: input db folder doesn't exist: ${this.input_db}`)
      return
    }

    this.update_db_timestamp = Math.round(Date.now() / 1000)

    const [input_metadata, output_metadata] = await Promise.all([
      this.get_input_metadata(this.input_db),
      this.get_output_metadata(),
    ])

    const is_table_deleted = await this.delete_old_files(input_metadata)
    const is_table_updated = await this.update_tables(
      input_metadata,
      output_metadata
    )
    if (!is_table_updated && !is_table_deleted) return
    await this.save_metadata(input_metadata, output_metadata)
  }

  public watch_db(input_db: Path): void {
    this.set_input_db(input_db)
    chokidar
      .watch(this.input_db, {
        ignored: /(^|[\/\\])\~\$/,
        persistent: true,
        ignoreInitial: true,
      })
      .on("all", (event, path) => this.update_db(input_db))

    console.log("Jsonjsdb watching changes in", this.input_db)
  }

  public async update_preview(
    subfolder: string,
    source_preview: Path
  ): Promise<void> {
    const source_path = path.resolve(source_preview)
    const output_path = path.join(this.output_db, subfolder)
    if (!existsSync(output_path)) await fs.mkdir(output_path)
    const files = await fs.readdir(source_path)
    for (const file_name of files) {
      if (!file_name.endsWith(`.${this.extension}`)) continue
      if (file_name.startsWith("~$")) continue
      const file_path = path.join(source_path, file_name)
      const table_data = await readExcel(file_path)
      const name = file_name.split(".")[0]
      this.write_table(table_data, output_path, name)
    }
  }

  public async set_output_db(output_db: Path): Promise<void> {
    this.output_db = await this.ensure_output_db(path.resolve(output_db))
    this.metadata_file = path.join(this.output_db, this.metadata_filename)
  }

  public get_output_db(): Path {
    return this.output_db
  }

  public get_metadata_file(): Path {
    return this.metadata_file
  }

  private set_input_db(input_db: Path): void {
    this.input_db = path.resolve(input_db)
  }
  private async get_input_metadata(folder_path: Path): Promise<MetadataItem[]> {
    try {
      const files = await fs.readdir(folder_path)
      const file_modif_times = []
      for (const file_name of files) {
        if (!file_name.endsWith(`.${this.extension}`)) continue
        if (file_name.startsWith("~$")) continue
        const file_path = path.join(folder_path, file_name)
        const stats = await fs.stat(file_path)
        const name = file_name.split(".")[0]
        const last_modif = Math.round(stats.mtimeMs / 1000)
        file_modif_times.push({ name, last_modif })
      }
      return file_modif_times
    } catch (error) {
      console.error("Jsonjsdb: get_files_last_modif error:", error)
      return []
    }
  }

  private async get_output_metadata(): Promise<MetadataItem[]> {
    let tables_metadata = []
    if (existsSync(this.metadata_file)) {
      const file_content = await fs.readFile(this.metadata_file, "utf-8")
      try {
        const lines = file_content.split("\n")
        lines.shift()
        tables_metadata = JSON.parse(lines.join("\n"))
      } catch (e) {
        console.error(`Jsonjsdb: error reading ${this.metadata_file}: ${e}`)
      }
    }
    return tables_metadata
  }

  private metadata_list_to_object(list: MetadataItem[]): MetadataObj {
    return list.reduce((acc: MetadataObj, row) => {
      acc[row.name] = row.last_modif
      return acc
    }, {})
  }

  private async ensure_output_db(output_db: Path): Promise<Path> {
    if (!existsSync(output_db)) {
      await fs.mkdir(output_db)
      return output_db
    }
    const items = await fs.readdir(output_db, { withFileTypes: true })
    const files = items.filter(
      item => item.isFile() && item.name.endsWith(".json.js")
    ).length
    if (files > 0) return output_db
    const folders = items.filter(item => item.isDirectory())
    if (folders.length !== 1) return output_db
    return (output_db = path.join(output_db, folders[0].name))
  }

  private async delete_old_files(
    input_metadata: MetadataItem[]
  ): Promise<boolean> {
    const delete_promises = []
    const input_metadata_obj = this.metadata_list_to_object(input_metadata)
    const output_files = await fs.readdir(this.output_db)
    for (const file_name of output_files) {
      const table = file_name.split(".")[0]
      if (!file_name.endsWith(`.json.js`)) continue
      if (file_name === "__meta__.json.js") continue
      if (table in input_metadata_obj) continue
      if (table === "history") continue
      const file_path = path.join(this.output_db, file_name)
      console.log(`Jsonjsdb: deleting ${table}`)
      delete_promises.push(fs.unlink(file_path))
    }
    await Promise.all(delete_promises)
    return delete_promises.length > 0
  }

  private async save_metadata(
    input_metadata: MetadataItem[],
    output_metadata: MetadataItem[]
  ): Promise<void> {
    if (JSON.stringify(input_metadata) === JSON.stringify(output_metadata))
      return
    let content = `jsonjs.data['__meta__'] = \n`
    input_metadata.push({
      name: "__meta__",
      last_modif: Math.round(Date.now() / 1000),
    })
    content += JSON.stringify(input_metadata, null, 2)
    await fs.writeFile(this.metadata_file, content, "utf-8")
  }

  private async update_tables(
    input_metadata: MetadataItem[],
    output_metadata: MetadataItem[]
  ): Promise<boolean> {
    const output_metadata_obj = this.metadata_list_to_object(output_metadata)
    const update_promises = []
    for (const { name, last_modif } of input_metadata) {
      const is_in_output = name in output_metadata_obj
      if (is_in_output && output_metadata_obj[name] >= last_modif) continue
      update_promises.push(this.update_table(name))
    }
    this.new_history_entries = []
    await Promise.all(update_promises)
    await this.save_history(input_metadata)
    return update_promises.length > 0
  }

  private async save_history(input_metadata: MetadataItem[]): Promise<void> {
    if (this.new_history_entries.length === 0) return
    const history_file = path.join(this.output_db, `history.json.js`)
    let history: TableRow[] = []
    if (existsSync(history_file)) {
      history = await this.read_jsonjs(history_file)
    }
    history.push(...this.new_history_entries)
    const history_list = this.convert_to_list_of_lists(history)
    this.write_table(history_list, this.output_db, "history")
    let history_found = false
    for (const input_metadata_row of input_metadata) {
      if (input_metadata_row.name === "history") {
        input_metadata_row.last_modif = this.update_db_timestamp
      }
    }
    if (!history_found) {
      input_metadata.push({
        name: "history",
        last_modif: this.update_db_timestamp,
      })
    }
  }

  private async update_table(table: string): Promise<void> {
    const input_file = path.join(this.input_db, `${table}.xlsx`)
    const table_data = await readExcel(input_file)
    await this.add_new_history_entries(table, table_data)
    await this.write_table(table_data, this.output_db, table)
    console.log(`Jsonjsdb updating ${table}`)
  }

  private async add_new_history_entries(
    table: string,
    table_data: Row[]
  ): Promise<void> {
    const old_table_data = await this.read_jsonjs(
      path.join(this.output_db, `${table}.json.js`)
    )
    const new_history_entries = compare_datasets(
      old_table_data,
      this.convert_to_list_of_objects(table_data),
      this.update_db_timestamp,
      table
    )
    this.new_history_entries.push(...new_history_entries)
  }

  private async write_table(
    table_data: Row[],
    output_path: Path,
    name: string
  ): Promise<void> {
    let content = `jsonjs.data['${name}'] = \n`
    if (this.readable) {
      const table_data_obj = this.convert_to_list_of_objects(table_data)
      content += JSON.stringify(table_data_obj, null, 2)
    } else {
      content += JSON.stringify(table_data)
    }
    const output_file = path.join(output_path, `${name}.json.js`)
    await fs.writeFile(output_file, content, "utf-8")
  }

  private convert_to_list_of_objects(data: Row[]): TableRow[] {
    const headers: string[] = data[0]
    const objects: TableRow[] = []
    for (const row of data.slice(1)) {
      const obj: TableRow = {}
      for (const [index, header] of headers.entries()) {
        obj[header] = row[index]
      }
      objects.push(obj)
    }
    return objects
  }

  private convert_to_list_of_lists(objects: TableRow[]): Row[] {
    if (objects.length === 0) return []
    const headers = Object.keys(objects[0])
    const rows = [headers]
    for (const obj of objects) {
      const row = headers.map(header => obj[header])
      rows.push(row)
    }
    return rows
  }

  private async read_jsonjs(path: Path): Promise<TableRow[]> {
    if (!existsSync(path)) return []
    const js_data = await fs.readFile(path, "utf8")
    const json_string = js_data.slice(js_data.indexOf("\n") + 1)
    const data = JSON.parse(json_string)
    if (data.length > 0 && Array.isArray(data[0])) {
      return this.convert_to_list_of_objects(data)
    }
    return data
  }
}

class Jsonjsdb_watcher_class {
  private output_db: Path
  private jdb_editor: Jsonjsdb_editor
  constructor() {
    this.output_db = ""
    this.jdb_editor = new Jsonjsdb_editor()
  }
  is_dev() {
    return process.env.NODE_ENV === "development"
  }
  async set_db(output_db: Path) {
    await this.jdb_editor.set_output_db(output_db)
    this.output_db = this.jdb_editor.get_output_db()
  }
  async watch(input_db: Path, even_prod: boolean = false) {
    await this.jdb_editor.update_db(input_db)
    if (this.is_dev() || even_prod) this.jdb_editor.watch_db(input_db)
  }
  async update_preview(subfolder: string, source_preview: Path) {
    await this.jdb_editor.update_preview(subfolder, source_preview)
  }
  get_db_meta_file_path() {
    return this.jdb_editor.get_metadata_file()
  }
  async update_md_files(md_dir: string, source_dir: Path) {
    if (!existsSync(source_dir)) return
    const files = await fs.readdir(source_dir)
    for (const file of files) {
      if (!file.endsWith(".md")) continue
      const file_content = await fs.readFile(`${source_dir}/${file}`, "utf8")
      const out_file_name = file.split(".md")[0]
      const out_file_path = `${this.output_db}/${md_dir}/${out_file_name}.json.js`
      const json = JSON.stringify([{ content: file_content }])
      const jsonjs = `jsonjs.data["${out_file_name}"] = \n` + json
      await fs.writeFile(out_file_path, jsonjs, "utf8")
    }
  }
}
export const Jsonjsdb_watcher = new Jsonjsdb_watcher_class()

export function jsonjsdb_add_config(config: Path): {} {
  return {
    name: "jsonjsdb_add_config",
    transformIndexHtml: {
      order: "post",
      handler: async (html: string) => {
        return html + "\n" + (await fs.readFile(config, "utf8"))
      },
    },
  }
}
