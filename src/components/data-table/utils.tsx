import Image from 'next/image';
import * as React from 'react';
import { LuArrowDownUp, LuCircleX } from 'react-icons/lu';
import { MdTouchApp } from 'react-icons/md';

import { Button } from '@/components/ui/button';
import {
	HoverCard,
	HoverCardContent,
	HoverCardTrigger,
} from '@/components/ui/hover-card';
import { CHAINS } from '@/constants';
import { ACTION_LINKS } from '@/constants';
import type { DateFrame } from '@/types/wallet';

import { Skeleton } from '../ui/skeleton';

export function getActionButton(address: string, link: string, image: string) {
	return (
		<Button
			className="cursor-pointer w-7 h-7"
			variant="ghost"
			size="icon"
			asChild
		>
			<a href={link + address} target="_blank" rel="noreferrer">
				<Image
					src={image}
					alt=""
					width={28}
					height={28}
					className="rounded-md"
				/>
			</a>
		</Button>
	);
}

export function getDebankButton(address: string) {
	return getActionButton(address, ACTION_LINKS.debank, '/debank.svg');
}

export function getSolscanButton(address: string) {
	return getActionButton(address, ACTION_LINKS.solscan, '/solscan.png');
}

export function getCellComponent<T>(
	key: string,
	getValueFunc: (key: string) => T,
	valueModifier?: (value: T) => any,
): React.ReactNode {
	let result;
	const value: T = getValueFunc(key);
	if (value === null) {
		result = <LuCircleX />;
	} else if (value === undefined) {
		result = <Skeleton className="w-16 h-8" />;
	} else {
		result = valueModifier ? valueModifier(value) : value;
	}
	return (
		<div className="flex text-center justify-center items-center">{result}</div>
	);
}

export function getHeaderComponent(
	name: string,
	column: any,
	t: (t: string) => string,
): React.ReactNode {
	return (
		<div className="text-center">
			<Button
				variant="ghost"
				onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
			>
				{t(name)}
				<LuArrowDownUp />
			</Button>
		</div>
	);
}

export function getDatesComponent(
	startDate: Date,
	dates: DateFrame,
	format: 'days' | 'weeks' | 'months',
) {
	if (dates.length === 0) {
		return <p className="flex justify-center items-center">0</p>;
	}

	const periods: {
		period: string;
		month: number;
		year: number;
	}[] = [];
	const today = new Date();

	while (startDate <= today) {
		let formattedDate;
		if (format === 'days') {
			formattedDate = startDate.toISOString().split('T')[0];
			periods.push({
				period: formattedDate,
				month: startDate.getMonth(),
				year: startDate.getFullYear(),
			});
			startDate.setDate(startDate.getDate() + 1);
		} else if (format === 'weeks') {
			const year = startDate.getFullYear();
			const week = Math.ceil(
				((startDate.getTime() - new Date(year, 0, 1).getTime()) / 86400000 +
					new Date(year, 0, 1).getDay() +
					1) /
					7,
			);
			formattedDate = `${year}-${week}`;
			periods.push({
				period: formattedDate,
				month: startDate.getMonth(),
				year: startDate.getFullYear(),
			});
			startDate.setDate(startDate.getDate() + 7);
		} else if (format === 'months') {
			formattedDate = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}`;
			periods.push({
				period: formattedDate,
				month: startDate.getMonth(),
				year: startDate.getFullYear(),
			});
			startDate.setMonth(startDate.getMonth() + 1);
		}
	}

	const months = periods.reduce(
		(acc: { [key: string]: string[] }, { period, year, month }) => {
			const key = `${year}-${String(month + 1).padStart(2, '0')}`;
			if (!acc[key]) {
				acc[key] = [];
			}
			acc[key].push(period);
			return acc;
		},
		{},
	);

	const maxTxns = Math.max(...dates.map(date => date.txns), 1);

	return (
		<HoverCard>
			<HoverCardTrigger>
				<p className="cursor-pointer flex flex-row items-center gap-1">
					{dates.length}
					<MdTouchApp />
				</p>
			</HoverCardTrigger>
			<HoverCardContent className="p-4 rounded-lg shadow-md w-min max-h-[40vh] overflow-auto">
				<div className="flex flex-col gap-3 justify-center items-center w-fit max-w-full">
					{Object.entries(months).map(([monthLabel, periods]) => {
						return (
							<div
								key={monthLabel}
								className="flex flex-row items-center gap-3 w-full"
							>
								<h3 className="text-base text-left truncate max-w-[6rem]">
									{monthLabel}
								</h3>
								<div
									className="grid gap-2 w-fit max-w-full"
									style={{
										gridTemplateColumns: `repeat(${Math.min(7, periods.length)}, minmax(1rem, 1fr))`,
										justifyContent: 'center',
										alignItems: 'center',
										flexShrink: 0,
									}}
								>
									{periods.map((period: string) => {
										const dateObj = dates.find(date => date.date === period);
										const txns = dateObj ? dateObj.txns : 0;

										const intensity = Math.round((txns / maxTxns) * 255);
										const color =
											txns > 0
												? `rgb(${255 - intensity}, ${255 - intensity}, 255)`
												: `rgb(200, 200, 200)`;

										return (
											<div
												key={period}
												className="w-4 h-4 rounded"
												style={{ backgroundColor: color }}
												title={`${period} - ${txns} txns`}
											></div>
										);
									})}
								</div>
							</div>
						);
					})}
				</div>
			</HoverCardContent>
		</HoverCard>
	);
}

export function getChainsComponent(chains: { id: number; txns: number }[]) {
	if (chains?.length === 0) {
		return <p className="flex justify-center items-center">0</p>;
	}

	return (
		<div className="flex flex-row items-center gap-2 relative">
			<div className="flex flex-row items-center gap-2 relative">
				<div className="lg:hidden flex flex-row items-center gap-2 max-w-20">
					<p>{chains!.length}</p>
					<div className="flex flex-row items-center gap-0 overflow-x-auto max-w-full">
						{chains!.map(chain => {
							const chainData = CHAINS.find(c => c.id === chain.id);
							return (
								<div key={chain.id} className="w-6 h-6 flex-shrink-0">
									<Image
										src={chainData!.image}
										className="rounded-full"
										alt={chainData!.name}
										width={24}
										height={24}
										title={chainData!.name.replace(/^\w/, c => c.toUpperCase())}
									/>
								</div>
							);
						})}
					</div>
				</div>
			</div>

			<div className="hidden lg:block">
				<HoverCard>
					<HoverCardTrigger>
						<p className="cursor-pointer flex flex-row items-center gap-1">
							{chains!.length}
							<MdTouchApp />
						</p>
					</HoverCardTrigger>
					<HoverCardContent className="p-4 rounded-lg shadow-md min-h-fit max-h-40 max-w-fit">
						<div className="flex flex-col gap-2 overflow-y-auto max-h-36">
							{chains!.map(chain => {
								const chainData = CHAINS.find(c => c.id === chain.id);
								return (
									<div
										key={chain.id}
										className="flex flex-row items-center gap-2"
									>
										<Image
											src={chainData!.image}
											className="rounded-full"
											alt={chainData!.name}
											width={24}
											height={24}
											title={chainData!.name.replace(/^\w/, c =>
												c.toUpperCase(),
											)}
										/>
										<div className="flex flex-row items-center gap-1">
											<div className="text-md font-semibold capitalize">
												{chainData!.name}:
											</div>
											<div className="text-sm">{chain.txns}</div>
										</div>
									</div>
								);
							})}
						</div>
					</HoverCardContent>
				</HoverCard>
			</div>
		</div>
	);
}
