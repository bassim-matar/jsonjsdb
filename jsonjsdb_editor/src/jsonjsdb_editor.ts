import path from "path"
import { promises as fs, existsSync } from "fs"
import readExcel from "read-excel-file/node"
import chokidar from "chokidar"

interface MetadataItem {
  name: string
  last_modif: number
}

type MetadataObj = Record<string, number>

type TableRow = Record<string, any>

export default class Jsonjsdb_editor {
  private input_db: string
  private output_db: string
  private tables_metadata_file: string
  private readable: boolean

  constructor(
    input_db: string,
    output_db: string,
    option: { readable?: boolean } = {}
  ) {
    this.input_db = path.resolve(input_db)
    this.output_db = path.resolve(output_db)
    this.tables_metadata_file = `${this.output_db}/__meta__.json.js`
    this.readable = option.readable ?? false
  }

  public async update_db(): Promise<void> {
    if (!existsSync(this.input_db)) {
      console.error(`input db folder doesn't exist: ${this.input_db}`)
      return
    }

    const [input_metadata, output_metadata] = await Promise.all([
      this.get_input_metadata(this.input_db, "xlsx"),
      this.get_output_metadata(),
      this.ensure_output_db_dir(),
    ])

    await Promise.all([
      this.delete_old_files(input_metadata),
      this.save_metadata(input_metadata),
      this.update_tables(input_metadata, output_metadata),
    ])
  }

  public watch_db(): void {
    chokidar
      .watch(this.input_db, {
        ignored: /(^|[\/\\])\~\$/,
        persistent: true,
        ignoreInitial: true,
      })
      .on("all", (event, path) => this.update_db())

    console.log("Started watching for file changes in", this.input_db)
  }

  private async get_input_metadata(
    folder_path: string,
    extension: string
  ): Promise<MetadataItem[]> {
    try {
      const files = await fs.readdir(folder_path)
      const file_modif_times = []
      for (const file_name of files) {
        if (!file_name.endsWith(`.${extension}`)) continue
        if (file_name.startsWith("~$")) continue
        const file_path = path.join(folder_path, file_name)
        const stats = await fs.stat(file_path)
        const name = file_name.split(".")[0]
        const last_modif = Math.round(stats.mtimeMs / 1000)
        file_modif_times.push({ name, last_modif })
      }
      return file_modif_times
    } catch (error) {
      console.error("get_files_last_modif error:", error)
      return []
    }
  }

  private async get_output_metadata(): Promise<MetadataObj> {
    let tables_metadata_list = []
    if (existsSync(this.tables_metadata_file)) {
      const file_content = await fs.readFile(this.tables_metadata_file, "utf-8")
      try {
        const lines = file_content.split("\n")
        lines.shift()
        tables_metadata_list = JSON.parse(lines.join("\n"))
      } catch (e) {
        console.error(`Error reading ${this.tables_metadata_file}: ${e}`)
      }
    }
    return this.metadata_list_to_object(tables_metadata_list)
  }

  private metadata_list_to_object(list: MetadataItem[]): MetadataObj {
    return list.reduce((acc: MetadataObj, row) => {
      acc[row.name] = row.last_modif
      return acc
    }, {})
  }

  private async ensure_output_db_dir(): Promise<void> {
    if (!existsSync(this.output_db)) {
      await fs.mkdir(this.output_db)
    }
  }

  private async delete_old_files(
    input_metadata: MetadataItem[]
  ): Promise<void> {
    const delete_promises = []
    const input_metadata_obj = this.metadata_list_to_object(input_metadata)
    const output_files = await fs.readdir(this.output_db)
    for (const file_name of output_files) {
      const table = file_name.split(".")[0]
      if (!file_name.endsWith(`.json.js`)) continue
      if (file_name === "__meta__.json.js") continue
      if (table in input_metadata_obj) continue
      const file_path = path.join(this.output_db, file_name)
      console.log(`Deleting ${table}`)
      delete_promises.push(fs.unlink(file_path))
    }
    await Promise.all(delete_promises)
  }

  private async save_metadata(input_metadata: MetadataItem[]): Promise<void> {
    let content = `jsonjs.data['__meta__'] = \n`
    content += JSON.stringify(input_metadata, null, 2)
    return fs.writeFile(this.tables_metadata_file, content, "utf-8")
  }

  private async update_tables(
    input_metadata: MetadataItem[],
    output_metadata: MetadataObj
  ) {
    const update_promises = []
    for (const { name, last_modif } of input_metadata) {
      const is_in_output = name in output_metadata
      if (is_in_output && output_metadata[name] >= last_modif) continue
      update_promises.push(this.update_table(name))
    }
    await Promise.all(update_promises)
  }

  private async update_table(table: string): Promise<void> {
    const input_file = path.join(this.input_db, `${table}.xlsx`)
    const output_file = path.join(this.output_db, `${table}.json.js`)
    let content = `jsonjs.data['${table}'] = \n`
    let table_data = await readExcel(input_file)
    if (this.readable) {
      const table_data_obj = this.convert_to_list_of_objects(table_data)
      content += JSON.stringify(table_data_obj, null, 2)
    } else {
      content += JSON.stringify(table_data)
    }
    await fs.writeFile(output_file, content, "utf-8")
    console.log(`Updating ${table}`)
  }

  private convert_to_list_of_objects(data: [][]): TableRow[] {
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
}
