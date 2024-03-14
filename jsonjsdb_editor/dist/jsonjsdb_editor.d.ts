export default class Jsonjsdb_editor {
    private input_db;
    private output_db;
    private tables_metadata_file;
    private readable;
    constructor(input_db: string, output_db: string, option?: {
        readable?: boolean;
    });
    update_db(): Promise<void>;
    watch_db(): void;
    private get_input_metadata;
    private get_output_metadata;
    private metadata_list_to_object;
    private ensure_output_db_dir;
    private delete_old_files;
    private save_metadata;
    private update_tables;
    private update_table;
    private convert_to_list_of_objects;
}
