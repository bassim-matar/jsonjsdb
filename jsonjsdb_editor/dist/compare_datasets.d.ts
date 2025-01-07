type TableRow = Record<string, any>;
export interface HistoryEntry {
    timestamp: number;
    type: "add" | "delete" | "update";
    entity: string;
    entity_id: string | number;
    variable: string | null;
    old_value: any | null;
    new_value: any | null;
    name: string | null;
    parent_ids: string | null;
}
export declare function compare_datasets(dataset_old: TableRow[], dataset_new: TableRow[], timestamp: number, entity: string): HistoryEntry[];
export {};
