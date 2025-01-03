import type { ColumnDef } from '@tanstack/react-table';
import Image from 'next/image';
import * as React from 'react';
import { LuCopy, LuEyeOff, LuRotateCcw, LuTrash } from 'react-icons/lu';

import {
	getCellComponent,
	getDatesComponent,
	getHeaderComponent,
	getSolscanButton,
} from '@/components/data-table/utils';
import { Button } from '@/components/ui/button';
import type { Toast } from '@/hooks/use-toast';
import type { DateFrame } from '@/types/wallet';

import type { EclipseWallet } from './types';

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
): ColumnDef<EclipseWallet>[] {
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
			accessorKey: 'domain',
			header: () => {
				return (
					<div className="text-center">
						<Button
							variant="ghost"
							onClick={() => setShowAddresses(!showAddresses)}
						>
							{t('domain')}
							<LuEyeOff />
						</Button>
					</div>
				);
			},
			cell: ({ row }) =>
				getCellComponent('domain', row.getValue, (domain: string) =>
					showAddresses
						? domain
						: domain.split('.turbo')[0].slice(0, 2) +
							'...' +
							domain.split('.turbo')[0].slice(-2) +
							'.turbo',
				),
		},
		{
			accessorKey: 'txns',
			header: ({ column }) => getHeaderComponent('txns', column, t),
			cell: ({ row }) => getCellComponent('txns', row.getValue),
		},
		{
			accessorKey: 'balance',
			header: ({ column }) => getHeaderComponent('balance', column, t),
			cell: ({ row }) =>
				getCellComponent('balance', row.getValue, (value: number) =>
					new Intl.NumberFormat('en-US', {
						style: 'currency',
						currency: 'USD',
					}).format(value),
				),
		},
		{
			accessorKey: 'volume',
			header: ({ column }) => getHeaderComponent('volume', column, t),
			cell: ({ row }) =>
				getCellComponent('volume', row.getValue, (value: number) =>
					new Intl.NumberFormat('en-US', {
						style: 'currency',
						currency: 'USD',
					}).format(value),
				),
		},
		{
			accessorKey: 'fee',
			header: ({ column }) => getHeaderComponent('fee', column, t),
			cell: ({ row }) =>
				getCellComponent('fee', row.getValue, (value: number) =>
					new Intl.NumberFormat('en-US', {
						style: 'currency',
						currency: 'USD',
					}).format(value),
				),
		},
		...['days', 'weeks', 'months'].map<ColumnDef<EclipseWallet>>(
			(dateFrame: string) => ({
				accessorKey: dateFrame,
				header: ({ column }) => getHeaderComponent(dateFrame, column, t),
				cell: ({ row }) =>
					getCellComponent(dateFrame, row.getValue, (data: DateFrame) =>
						getDatesComponent(
							new Date('2024-10-01'),
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
					<Button
						className="cursor-pointer w-7 h-7"
						variant="ghost"
						size="icon"
						asChild
					>
						<a
							href={`https://eclipsescan.xyz/account/${row.getValue('address')}`}
							target="_blank"
							rel="noreferrer"
						>
							<Image
								src="/eclipse.webp"
								alt="eclipse-scan"
								width={28}
								height={28}
								className="rounded-md"
							/>
						</a>
					</Button>
					{getSolscanButton(row.getValue('address'))}
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
