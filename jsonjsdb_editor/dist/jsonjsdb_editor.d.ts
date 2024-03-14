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
export {};
