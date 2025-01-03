'use client';

import type {
	ColumnDef,
	SortingState,
	VisibilityState,
} from '@tanstack/react-table';
import {
	flexRender,
	getCoreRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	useReactTable,
} from '@tanstack/react-table';
import { useEffect, useState } from 'react';

import { useTableStore } from '@/stores/tableStore';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/ui/table';

import { DataTablePagination } from './Pagination';

interface DataTableProps<TData, TValue> {
	columns: ColumnDef<TData, TValue>[];
	data: TData[];
	t: (key: string) => string;
}

export function DataTable<TData, TValue>({
	columns,
	data,
	t,
}: DataTableProps<TData, TValue>) {
	const [sorting, setSorting] = useState<SortingState>([]);
	const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

	const table = useReactTable({
		data,
		columns,
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		onSortingChange: setSorting,
		onColumnVisibilityChange: setColumnVisibility,
		getSortedRowModel: getSortedRowModel(),
		state: {
			sorting,
			columnVisibility,
		},
	});

	const { setTable } = useTableStore();
	useEffect(() => {
		setTable(table);
	}, [JSON.stringify(table), setTable]);

	return (
		<div className="flex flex-col gap-4 justify-center items-center">
			<div className="border rounded-md overflow-x-auto min-w-[49vw] max-w-[90vw] resize-x">
				<Table>
					<TableHeader>
						{table.getHeaderGroups().map(headerGroup => (
							<TableRow key={headerGroup.id}>
								{headerGroup.headers.map(header => (
									<TableHead key={header.id}>
										{header.isPlaceholder
											? null
											: flexRender(
													header.column.columnDef.header,
													header.getContext(),
												)}
									</TableHead>
								))}
							</TableRow>
						))}
					</TableHeader>
					<TableBody>
						{table.getRowModel().rows?.length ? (
							table.getRowModel().rows.map(row => (
								<TableRow key={row.id}>
									{row.getVisibleCells().map(cell => (
										<TableCell key={cell.id}>
											{flexRender(
												cell.column.columnDef.cell,
												cell.getContext(),
											)}
										</TableCell>
									))}
								</TableRow>
							))
						) : (
							<TableRow>
								<TableCell
									colSpan={columns.length}
									className="h-16 text-center"
								>
									{t('noData')}
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>
			<DataTablePagination table={table} t={t} />
		</div>
	);
}
