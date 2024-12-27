import path from "path";
import { promises as fs, existsSync } from "fs";
import readExcel from "read-excel-file/node";
import chokidar from "chokidar";
function add_id_if_missing(dataset) {
    if (dataset.length === 0)
        return;
    if ("id" in dataset[0])
        return;
    const keys = Object.keys(dataset[0]);
    if (keys.length < 2) {
        throw new Error("Not enough columns to generate id");
    }
    const [key1, key2] = keys;
    for (const item of dataset) {
        item.id = `${item[key1]}---${item[key2]}`;
    }
}
export function compare_datasets(dataset_old, dataset_new, timestamp, entity) {
    add_id_if_missing(dataset_old);
    add_id_if_missing(dataset_new);
    const map_old = new Map(dataset_old.map(item => [item.id, item]));
    const map_new = new Map(dataset_new.map(item => [item.id, item]));
    const ids_old = new Set(map_old.keys());
    const ids_new = new Set(map_new.keys());
    const ids_added = [...ids_new].filter(id => !ids_old.has(id));
    const ids_removed = [...ids_old].filter(id => !ids_new.has(id));
    const common_ids = [...ids_old].filter(id => ids_new.has(id));
    const modifications = [];
    for (const id of common_ids) {
        const obj_old = map_old.get(id);
        const obj_new = map_new.get(id);
        for (const key of Object.keys(obj_old)) {
            if (key === "id")
                continue;
            if (obj_old[key] !== obj_new[key]) {
                modifications.push({
                    entity_id: id,
                    variable: key,
                    old_value: obj_old[key],
                    new_value: obj_new[key],
                });
            }
        }
    }
    const new_history_entries = [];
    for (const id of ids_added) {
        new_history_entries.push({
            timestamp,
            type: "add",
            entity,
            entity_id: id,
            variable: null,
            old_value: null,
            new_value: null,
        });
    }
    for (const id of ids_removed) {
        new_history_entries.push({
            timestamp,
            type: "delete",
            entity,
            entity_id: id,
            variable: null,
            old_value: null,
            new_value: null,
        });
    }
    for (const mod of modifications) {
        new_history_entries.push({
            timestamp,
            type: "update",
            entity,
            entity_id: mod.entity_id,
            variable: mod.variable,
            old_value: mod.old_value,
            new_value: mod.new_value,
        });
    }
    return new_history_entries;
}
export default class Jsonjsdb_editor {
    input_db;
    output_db;
    readable;
    extension;
    metadata_filename = "__meta__.json.js";
    metadata_file;
    update_db_timestamp;
    new_history_entries;
    constructor(option = {}) {
        this.input_db = "";
        this.output_db = "";
        this.metadata_file = "";
        this.readable = option.readable ?? false;
        this.extension = "xlsx";
        this.update_db_timestamp = 0;
        this.new_history_entries = [];
    }
    async update_db(input_db) {
        this.set_input_db(input_db);
        if (!existsSync(this.input_db)) {
            console.error(`Jsonjsdb: input db folder doesn't exist: ${this.input_db}`);
            return;
        }
        this.update_db_timestamp = Math.round(Date.now() / 1000);
        const [input_metadata, output_metadata] = await Promise.all([
            this.get_input_metadata(this.input_db),
            this.get_output_metadata(),
        ]);
        const is_table_deleted = await this.delete_old_files(input_metadata);
        const is_table_updated = await this.update_tables(input_metadata, output_metadata);
        if (!is_table_updated && !is_table_deleted)
            return;
        await this.save_metadata(input_metadata, output_metadata);
    }
    watch_db(input_db) {
        this.set_input_db(input_db);
        chokidar
            .watch(this.input_db, {
            ignored: /(^|[\/\\])\~\$/,
            persistent: true,
            ignoreInitial: true,
        })
            .on("all", (event, path) => this.update_db(input_db));
        console.log("Jsonjsdb watching changes in", this.input_db);
    }
    async update_preview(subfolder, source_preview) {
        const source_path = path.resolve(source_preview);
        const output_path = path.join(this.output_db, subfolder);
        if (!existsSync(output_path))
            await fs.mkdir(output_path);
        const files = await fs.readdir(source_path);
        for (const file_name of files) {
            if (!file_name.endsWith(`.${this.extension}`))
                continue;
            if (file_name.startsWith("~$"))
                continue;
            const file_path = path.join(source_path, file_name);
            const table_data = await readExcel(file_path);
            const name = file_name.split(".")[0];
            this.write_table(table_data, output_path, name);
        }
    }
    async set_output_db(output_db) {
        this.output_db = await this.ensure_output_db(path.resolve(output_db));
        this.metadata_file = path.join(this.output_db, this.metadata_filename);
    }
    get_output_db() {
        return this.output_db;
    }
    get_metadata_file() {
        return this.metadata_file;
    }
    set_input_db(input_db) {
        this.input_db = path.resolve(input_db);
    }
    async get_input_metadata(folder_path) {
        try {
            const files = await fs.readdir(folder_path);
            const file_modif_times = [];
            for (const file_name of files) {
                if (!file_name.endsWith(`.${this.extension}`))
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
            console.error("Jsonjsdb: get_files_last_modif error:", error);
            return [];
        }
    }
    async get_output_metadata() {
        let tables_metadata = [];
        if (existsSync(this.metadata_file)) {
            const file_content = await fs.readFile(this.metadata_file, "utf-8");
            try {
                const lines = file_content.split("\n");
                lines.shift();
                tables_metadata = JSON.parse(lines.join("\n"));
            }
            catch (e) {
                console.error(`Jsonjsdb: error reading ${this.metadata_file}: ${e}`);
            }
        }
        return tables_metadata;
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
        return (output_db = path.join(output_db, folders[0].name));
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
            if (table === "history")
                continue;
            const file_path = path.join(this.output_db, file_name);
            console.log(`Jsonjsdb: deleting ${table}`);
            delete_promises.push(fs.unlink(file_path));
        }
        await Promise.all(delete_promises);
        return delete_promises.length > 0;
    }
    async save_metadata(input_metadata, output_metadata) {
        if (JSON.stringify(input_metadata) === JSON.stringify(output_metadata))
            return;
        let content = `jsonjs.data['__meta__'] = \n`;
        input_metadata.push({
            name: "__meta__",
            last_modif: Math.round(Date.now() / 1000),
        });
        content += JSON.stringify(input_metadata, null, 2);
        await fs.writeFile(this.metadata_file, content, "utf-8");
    }
    async update_tables(input_metadata, output_metadata) {
        const output_metadata_obj = this.metadata_list_to_object(output_metadata);
        const update_promises = [];
        for (const { name, last_modif } of input_metadata) {
            const is_in_output = name in output_metadata_obj;
            if (is_in_output && output_metadata_obj[name] >= last_modif)
                continue;
            update_promises.push(this.update_table(name));
        }
        this.new_history_entries = [];
        await Promise.all(update_promises);
        await this.save_history(input_metadata);
        return update_promises.length > 0;
    }
    async save_history(input_metadata) {
        if (this.new_history_entries.length === 0)
            return;
        const history_file = path.join(this.output_db, `history.json.js`);
        let history = [];
        if (existsSync(history_file)) {
            history = await this.read_jsonjs(history_file);
        }
        history.push(...this.new_history_entries);
        const history_list = this.convert_to_list_of_lists(history);
        this.write_table(history_list, this.output_db, "history");
        let history_found = false;
        for (const input_metadata_row of input_metadata) {
            if (input_metadata_row.name === "history") {
                input_metadata_row.last_modif = this.update_db_timestamp;
            }
        }
        if (!history_found) {
            input_metadata.push({
                name: "history",
                last_modif: this.update_db_timestamp,
            });
        }
    }
    async update_table(table) {
        const input_file = path.join(this.input_db, `${table}.xlsx`);
        const table_data = await readExcel(input_file);
        const old_table_data = await this.read_jsonjs(path.join(this.output_db, `${table}.json.js`));
        const new_history_entries = compare_datasets(old_table_data, this.convert_to_list_of_objects(table_data), this.update_db_timestamp, table);
        this.new_history_entries.push(...new_history_entries);
        await this.write_table(table_data, this.output_db, table);
        console.log(`Jsonjsdb updating ${table}`);
    }
    async write_table(table_data, output_path, name) {
        let content = `jsonjs.data['${name}'] = \n`;
        if (this.readable) {
            const table_data_obj = this.convert_to_list_of_objects(table_data);
            content += JSON.stringify(table_data_obj, null, 2);
        }
        else {
            content += JSON.stringify(table_data);
        }
        const output_file = path.join(output_path, `${name}.json.js`);
        await fs.writeFile(output_file, content, "utf-8");
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
    convert_to_list_of_lists(objects) {
        if (objects.length === 0)
            return [];
        const headers = Object.keys(objects[0]);
        const rows = [headers];
        for (const obj of objects) {
            const row = headers.map(header => obj[header]);
            rows.push(row);
        }
        return rows;
    }
    async read_jsonjs(path) {
        if (!existsSync(path))
            return [];
        const js_data = await fs.readFile(path, "utf8");
        const json_string = js_data.slice(js_data.indexOf("\n") + 1);
        const data = JSON.parse(json_string);
        if (data.length > 0 && Array.isArray(data[0])) {
            return this.convert_to_list_of_objects(data);
        }
        return data;
    }
}
class Jsonjsdb_watcher_class {
    output_db;
    jdb_editor;
    constructor() {
        this.output_db = "";
        this.jdb_editor = new Jsonjsdb_editor();
    }
    is_dev() {
        return process.env.NODE_ENV === "development";
    }
    async set_db(output_db) {
        await this.jdb_editor.set_output_db(output_db);
        this.output_db = this.jdb_editor.get_output_db();
    }
    async watch(input_db, even_prod = false) {
        await this.jdb_editor.update_db(input_db);
        if (this.is_dev() || even_prod)
            this.jdb_editor.watch_db(input_db);
    }
    async update_preview(subfolder, source_preview) {
        await this.jdb_editor.update_preview(subfolder, source_preview);
    }
    get_db_meta_file_path() {
        return this.jdb_editor.get_metadata_file();
    }
    async update_md_files(md_dir, source_dir) {
        if (!existsSync(source_dir))
            return;
        const files = await fs.readdir(source_dir);
        for (const file of files) {
            if (!file.endsWith(".md"))
                continue;
            const file_content = await fs.readFile(`${source_dir}/${file}`, "utf8");
            const out_file_name = file.split(".md")[0];
            const out_file_path = `${this.output_db}/${md_dir}/${out_file_name}.json.js`;
            const json = JSON.stringify([{ content: file_content }]);
            const jsonjs = `jsonjs.data["${out_file_name}"] = \n` + json;
            await fs.writeFile(out_file_path, jsonjs, "utf8");
        }
    }
}
export const Jsonjsdb_watcher = new Jsonjsdb_watcher_class();
export function jsonjsdb_add_config(config) {
    return {
        name: "jsonjsdb_add_config",
        transformIndexHtml: {
            order: "post",
            handler: async (html) => {
                return html + "\n" + (await fs.readFile(config, "utf8"));
            },
        },
    };
}
