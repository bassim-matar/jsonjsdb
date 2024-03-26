type Path = string;
export default class Jsonjsdb_editor {
    private input_db;
    private output_db;
    private readable;
    private metadata_filename;
    constructor(input_db: Path, output_db: Path, option?: {
        readable?: boolean;
    });
    update_db(): Promise<void>;
    watch_db(): void;
    private get_input_metadata;
    private get_output_metadata;
    private metadata_list_to_object;
    private ensure_output_db;
    private delete_old_files;
    private save_metadata;
    private update_tables;
    private update_table;
    private convert_to_list_of_objects;
}
declare class Jsonjsdb_watcher_class {
    private input_db;
    private output_db;
    constructor();
    is_dev(): boolean;
    watch(input_db: Path, output_db: Path): Promise<void>;
    reload(): any;
}
export declare const Jsonjsdb_watcher: Jsonjsdb_watcher_class;
declare class Jsonjsdb_config_class {
    private jsonjsdb_config;
    private out_index;
    constructor();
    init(config_file: Path, out_index: Path): Promise<void>;
    add_config(): ({
        name: string;
        apply: string;
        transformIndexHtml: {
            order: string;
            handler: (html: String) => string;
        };
        writeBundle?: undefined;
    } | {
        name: string;
        apply: string;
        writeBundle: () => Promise<void>;
        transformIndexHtml?: undefined;
    })[];
}
export declare const Jsonjsdb_config: Jsonjsdb_config_class;
export {};
