type TableRow = Record<string, any>;
export interface EvolutionEntry {
    timestamp: number;
    type: "add" | "delete" | "update";
    entity: string;
    entity_id: string | number;
    parent_entity_id: string | number | null;
    variable: string | null;
    old_value: any | null;
    new_value: any | null;
    name: string | null;
}
export declare function compare_datasets(dataset_old: TableRow[], dataset_new: TableRow[], timestamp: number, entity: string): EvolutionEntry[];
export {};
