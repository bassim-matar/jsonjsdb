type Path = string;
export default class Jsonjsdb_editor {
    private input_db;
    private output_db;
    private readable;
    private extension;
    private metadata_filename;
    private metadata_file;
    constructor(option?: {
        readable?: boolean;
    });
    update_db(input_db: Path): Promise<void>;
    watch_db(input_db: Path): void;
    update_preview(subfolder: string, source_preview: Path): Promise<void>;
    set_output_db(output_db: Path): Promise<void>;
    get_metadata_file(): Path;
    private set_input_db;
    private get_input_metadata;
    private get_output_metadata;
    private metadata_list_to_object;
    private ensure_output_db;
    private delete_old_files;
    private save_metadata;
    private update_tables;
    private update_table;
    private write_table;
    private convert_to_list_of_objects;
}
declare class Jsonjsdb_watcher_class {
    private output_db;
    private jdb_editor;
    constructor();
    is_dev(): boolean;
    set_db(output_db: Path): Promise<void>;
    watch(input_db: Path, even_prod?: boolean): Promise<void>;
    update_preview(subfolder: string, source_preview: Path): Promise<void>;
    get_db_meta_file_path(): string;
    update_md_files(md_dir: string, source_dir: Path): Promise<void>;
}
export declare const Jsonjsdb_watcher: Jsonjsdb_watcher_class;
export declare function jsonjsdb_add_config(config: Path): {};
export {};
