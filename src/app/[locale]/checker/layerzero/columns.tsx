import type { ColumnDef } from '@tanstack/react-table';
import * as React from 'react';
import { LuCopy, LuEyeOff, LuRotateCcw, LuTrash } from 'react-icons/lu';

import {
	getActionButton,
	getCellComponent,
	getDatesComponent,
	getDebankButton,
	getHeaderComponent,
} from '@/components/data-table/utils';
import { Button } from '@/components/ui/button';
import { ACTION_LINKS } from '@/constants';
import type { Toast } from '@/hooks/use-toast';
import type { DateFrame } from '@/types/wallet';

import { getChainsComponent } from './chains';
import { getProtocolsComponent } from './protocols';
import type { LayerzeroWallet } from './types';

export function getColumns(
	toast: (options: Toast) => {
		id: string;
		dismiss: () => void;
	},
	showAddresses: boolean,
	setShowAddresses: (showAddresses: boolean) => void,
	recheckWallet: (address: string) => Promise<void>,
	deleteWallet: (address: string) => void,
	t: (t: string) => string,
): ColumnDef<LayerzeroWallet>[] {
	return [
		{
			accessorKey: 'id',
			header: ({ column }) => getHeaderComponent('id', column, t),
			cell: ({ row }) => getCellComponent('id', row.getValue),
		},
		{
			accessorKey: 'address',
			header: () => {
				return (
					<div className="text-center">
						<Button
							variant="ghost"
							onClick={() => setShowAddresses(!showAddresses)}
						>
							{t('address')}
							<LuEyeOff />
						</Button>
					</div>
				);
			},
			cell: ({ row }) => (
				<div className="text-center">
					<Button
						variant="ghost"
						onClick={() => {
							navigator.clipboard.writeText(row.getValue<string>('address'));
							const { dismiss } = toast({
								description: t('copyToast'),
							});
							setTimeout(() => dismiss(), 3000);
						}}
					>
						{showAddresses
							? row.getValue('address')
							: row.getValue<string>('address').slice(0, 4) +
								'...' +
								row.getValue<string>('address').slice(-4)}
						<LuCopy />
					</Button>
				</div>
			),
		},
		{
			accessorKey: 'txns',
			header: ({ column }) => getHeaderComponent('txns', column, t),
			cell: ({ row }) => getCellComponent('txns', row.getValue),
		},
		...['srcChains', 'dstChains'].map<ColumnDef<LayerzeroWallet>>(
			chainsType => ({
				accessorKey: chainsType,
				header: ({ column }) => getHeaderComponent(chainsType, column, t),
				cell: ({ row }) =>
					getCellComponent(
						chainsType,
						row.getValue,
						(chains: LayerzeroWallet['srcChains']) =>
							getChainsComponent(chains),
					),
			}),
		),
		{
			accessorKey: 'protocols',
			header: ({ column }) => getHeaderComponent('protocols', column, t),
			cell: ({ row }) =>
				getCellComponent('protocols', row.getValue, getProtocolsComponent),
		},
		{
			accessorKey: 'contracts',
			header: ({ column }) => getHeaderComponent('contracts', column, t),
			cell: ({ row }) => getCellComponent('contracts', row.getValue),
		},
		...['days', 'weeks', 'months'].map<ColumnDef<LayerzeroWallet>>(
			(dateFrame: string) => ({
				accessorKey: dateFrame,
				header: ({ column }) => getHeaderComponent(dateFrame, column, t),
				cell: ({ row }) =>
					getCellComponent(dateFrame, row.getValue, (data: DateFrame) =>
						getDatesComponent(
							new Date('2024-05-01'),
							data,
							dateFrame as 'weeks' | 'days' | 'months',
						),
					),
			}),
		),
		{
			id: 'actions',
			header: () => <div className="text-center">{t('actions')}</div>,
			cell: ({ row }) => (
				<div className="flex justify-center items-center gap-1">
					{getActionButton(
						row.getValue('address'),
						ACTION_LINKS.layerzeroscan,
						'/layerzero.webp',
					)}
					{getDebankButton(row.getValue('address'))}
					<Button
						className="cursor-pointer w-7 h-7"
						variant="ghost"
						size="icon"
						asChild
						onClick={async () => await recheckWallet(row.getValue('address'))}
					>
						<LuRotateCcw />
					</Button>
					<Button
						className="cursor-pointer w-7 h-7"
						variant="ghost"
						size="icon"
						asChild
						onClick={() => deleteWallet(row.getValue('address'))}
					>
						<LuTrash />
					</Button>
				</div>
			),
		},
	];
}
