import Dexie, { type Table } from 'dexie';

export interface LocalRecord {
    id?: number;
    type: 'parada' | 'producao';
    data: any;
    synced: number; // 0 = falso, 1 = verdadeiro
    timestamp: string;
}

export class OEEStore extends Dexie {
    records!: Table<LocalRecord>;

    constructor() {
        super('OEEStore');
        this.version(1).stores({
            records: '++id, type, synced, timestamp'
        });
    }
}

export const db = new OEEStore();
