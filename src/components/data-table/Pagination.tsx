import type { Table } from '@tanstack/react-table';
import {
	LuChevronLeft,
	LuChevronRight,
	LuChevronsLeft,
	LuChevronsRight,
} from 'react-icons/lu';

import { Button } from '@/ui/button';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/ui/select';

interface DataTablePaginationProps<TData> {
	table: Table<TData>;
	t: (key: string) => string;
}

export function DataTablePagination<TData>({
	table,
	t,
}: DataTablePaginationProps<TData>) {
	return (
		<div className="flex flex-wrap items-center justify-center gap-4 px-4">
			<div className="flex items-center gap-4">
				<div className="flex items-center gap-2">
					<p className="min-w-max text-sm font-medium">{t('rowsPerPage')}</p>
					<Select
						value={table.getState().pagination.pageSize.toString()}
						onValueChange={value => {
							table.setPageSize(Number(value));
						}}
					>
						<SelectTrigger className="h-8 min-w-max">
							<SelectValue placeholder={table.getState().pagination.pageSize} />
						</SelectTrigger>
						<SelectContent side="top">
							{[10, 20, 30, 40, 50].map(pageSize => (
								<SelectItem key={pageSize} value={`${pageSize}`}>
									{pageSize}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<div className="flex items-center text-sm font-medium">
					{t('page')} {table.getState().pagination.pageIndex + 1} {t('of')}{' '}
					{table.getPageCount() || 1}
				</div>
			</div>

			<div className="flex items-center gap-2">
				<Button
					variant="outline"
					className="h-8 w-8 p-0 flex justify-center items-center"
					onClick={() => table.setPageIndex(0)}
					disabled={!table.getCanPreviousPage()}
				>
					<span className="sr-only">{t('goToFirstPage')}</span>
					<LuChevronsLeft />
				</Button>
				<Button
					variant="outline"
					className="h-8 w-8 p-0 flex justify-center items-center"
					onClick={() => table.previousPage()}
					disabled={!table.getCanPreviousPage()}
				>
					<span className="sr-only">{t('goToPreviousPage')}</span>
					<LuChevronLeft />
				</Button>
				<Button
					variant="outline"
					className="h-8 w-8 p-0 flex justify-center items-center"
					onClick={() => table.nextPage()}
					disabled={!table.getCanNextPage()}
				>
					<span className="sr-only">{t('goToNextPage')}</span>
					<LuChevronRight />
				</Button>
				<Button
					variant="outline"
					className="h-8 w-8 p-0 flex justify-center items-center"
					onClick={() => table.setPageIndex(table.getPageCount() - 1)}
					disabled={!table.getCanNextPage()}
				>
					<span className="sr-only">{t('goToLastPage')}</span>
					<LuChevronsRight />
				</Button>
			</div>
		</div>
	);
}
