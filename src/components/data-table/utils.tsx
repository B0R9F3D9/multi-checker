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
import type { DateFrame } from '@/types/wallet';

import { Skeleton } from '../ui/skeleton';

export function getDebankButton(address: string) {
	return (
		<Button
			className="cursor-pointer w-7 h-7"
			variant="ghost"
			size="icon"
			asChild
		>
			<a
				href={`https://debank.com/profile/${address}`}
				target="_blank"
				rel="noreferrer"
			>
				<Image
					src="/debank.svg"
					alt="debank"
					width={28}
					height={28}
					className="rounded-md"
				/>
			</a>
		</Button>
	);
}

export function getSolscanButton(address: string) {
	return (
		<Button
			className="cursor-pointer w-7 h-7"
			variant="ghost"
			size="icon"
			asChild
		>
			<a
				href={`https://solscan.io/account/${address}`}
				target="_blank"
				rel="noreferrer"
			>
				<Image
					src="/solscan.png"
					alt="solscan"
					width={28}
					height={28}
					className="rounded-md"
				/>
			</a>
		</Button>
	);
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
			<HoverCardContent
				className="p-4 rounded-lg shadow-md"
				style={{
					maxWidth: '40vw',
					maxHeight: '40vh',
					overflow: 'auto',
				}}
			>
				<div className="flex flex-col gap-4 justify-center items-center">
					{Object.entries(months).map(([monthLabel, periods]) => {
						return (
							<div
								key={monthLabel}
								style={{ display: 'flex', alignItems: 'center', width: '100%' }}
							>
								<h3
									className="text-lg font-semibold text-left"
									style={{ flex: '1' }}
								>
									{monthLabel}
								</h3>
								<div
									className="grid gap-2"
									style={{
										gridTemplateColumns: `repeat(${Math.min(7, periods.length)}, minmax(1rem, 1fr))`,
										justifyContent: format === 'days' ? 'start' : 'center',
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
