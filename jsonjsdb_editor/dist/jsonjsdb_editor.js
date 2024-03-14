import path from "path";
import { promises as fs, existsSync } from "fs";
import readExcel from "read-excel-file/node";
import chokidar from "chokidar";
export default class Jsonjsdb_editor {
    input_db;
    output_db;
    readable;
    metadata_filename = "__meta__.json.js";
    constructor(input_db, output_db, option = {}) {
        this.input_db = path.resolve(input_db);
        this.output_db = path.resolve(output_db);
        this.readable = option.readable ?? false;
    }
    async update_db() {
        if (!existsSync(this.input_db)) {
            console.error(`input db folder doesn't exist: ${this.input_db}`);
            return;
        }
        this.output_db = await this.ensure_output_db(this.output_db);
        const metadata_file = `${this.output_db}/${this.metadata_filename}`;
        const [input_metadata, output_metadata] = await Promise.all([
            this.get_input_metadata(this.input_db, "xlsx"),
            this.get_output_metadata(metadata_file),
        ]);
        await Promise.all([
            this.delete_old_files(input_metadata),
            this.save_metadata(input_metadata, metadata_file),
            this.update_tables(input_metadata, output_metadata),
        ]);
    }
    watch_db() {
        chokidar
            .watch(this.input_db, {
            ignored: /(^|[\/\\])\~\$/,
            persistent: true,
            ignoreInitial: true,
        })
            .on("all", (event, path) => this.update_db());
        console.log("Started watching for file changes in", this.input_db);
    }
    async get_input_metadata(folder_path, extension) {
        try {
            const files = await fs.readdir(folder_path);
            const file_modif_times = [];
            for (const file_name of files) {
                if (!file_name.endsWith(`.${extension}`))
                    continue;
                if (file_name.startsWith("~$"))
                    continue;
                const file_path = path.join(folder_path, file_name);
                const stats = await fs.stat(file_path);
                const name = file_name.split(".")[0];
                const last_modif = Math.round(stats.mtimeMs / 1000);
                file_modif_times.push({ name, last_modif });
            }
            return file_modif_times;
        }
        catch (error) {
            console.error("get_files_last_modif error:", error);
            return [];
        }
    }
    async get_output_metadata(metadata_file) {
        let tables_metadata_list = [];
        if (existsSync(metadata_file)) {
            const file_content = await fs.readFile(metadata_file, "utf-8");
            try {
                const lines = file_content.split("\n");
                lines.shift();
                tables_metadata_list = JSON.parse(lines.join("\n"));
            }
            catch (e) {
                console.error(`Error reading ${metadata_file}: ${e}`);
            }
        }
        return this.metadata_list_to_object(tables_metadata_list);
    }
    metadata_list_to_object(list) {
        return list.reduce((acc, row) => {
            acc[row.name] = row.last_modif;
            return acc;
        }, {});
    }
    async ensure_output_db(output_db) {
        if (!existsSync(output_db)) {
            await fs.mkdir(output_db);
            return output_db;
        }
        const items = await fs.readdir(output_db, { withFileTypes: true });
        const files = items.filter(item => item.isFile() && item.name.endsWith(".json.js")).length;
        if (files > 0)
            return output_db;
        const folders = items.filter(item => item.isDirectory());
        if (folders.length !== 1)
            return output_db;
        return output_db = path.join(output_db, folders[0].name);
    }
    async delete_old_files(input_metadata) {
        const delete_promises = [];
        const input_metadata_obj = this.metadata_list_to_object(input_metadata);
        const output_files = await fs.readdir(this.output_db);
        for (const file_name of output_files) {
            const table = file_name.split(".")[0];
            if (!file_name.endsWith(`.json.js`))
                continue;
            if (file_name === "__meta__.json.js")
                continue;
            if (table in input_metadata_obj)
                continue;
            const file_path = path.join(this.output_db, file_name);
            console.log(`Deleting ${table}`);
            delete_promises.push(fs.unlink(file_path));
        }
        await Promise.all(delete_promises);
    }
    async save_metadata(input_metadata, metadata_file) {
        let content = `jsonjs.data['__meta__'] = \n`;
        content += JSON.stringify(input_metadata, null, 2);
        return fs.writeFile(metadata_file, content, "utf-8");
    }
    async update_tables(input_metadata, output_metadata) {
        const update_promises = [];
        for (const { name, last_modif } of input_metadata) {
            const is_in_output = name in output_metadata;
            if (is_in_output && output_metadata[name] >= last_modif)
                continue;
            update_promises.push(this.update_table(name));
        }
        await Promise.all(update_promises);
    }
    async update_table(table) {
        const input_file = path.join(this.input_db, `${table}.xlsx`);
        const output_file = path.join(this.output_db, `${table}.json.js`);
        let content = `jsonjs.data['${table}'] = \n`;
        let table_data = await readExcel(input_file);
        if (this.readable) {
            const table_data_obj = this.convert_to_list_of_objects(table_data);
            content += JSON.stringify(table_data_obj, null, 2);
        }
        else {
            content += JSON.stringify(table_data);
        }
        await fs.writeFile(output_file, content, "utf-8");
        console.log(`Updating ${table}`);
    }
    convert_to_list_of_objects(data) {
        const headers = data[0];
        const objects = [];
        for (const row of data.slice(1)) {
            const obj = {};
            for (const [index, header] of headers.entries()) {
                obj[header] = row[index];
            }
            objects.push(obj);
        }
        return objects;
    }
}
