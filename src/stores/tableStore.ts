import type { Table } from '@tanstack/react-table';
import { create } from 'zustand';

interface TableStore<TData> {
	table: Table<TData> | null;
	setTable: (table: Table<TData>) => void;
}

export const useTableStore = create<TableStore<any>>(set => ({
	table: null,
	setTable: table => set({ table }),
}));
