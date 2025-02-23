import * as React from 'react';
import { MdTouchApp } from 'react-icons/md';

import {
	HoverCard,
	HoverCardContent,
	HoverCardTrigger,
} from '@/components/ui/hover-card';
import type { DateFrame } from '@/types/wallet';

export function DatesComponent(
	dates: DateFrame,
	format: 'days' | 'weeks' | 'months',
	startDate?: Date,
) {
	if (dates.length === 0) {
		return <p className="flex justify-center items-center">0</p>;
	}
	if (!startDate) {
		startDate = new Date(dates[0].date);
	}

	const periods: {
		period: string;
		month: number;
		year: number;
	}[] = [];
	const today = new Date();

	while (startDate <= today) {
		if (format === 'days') {
			periods.push({
				period: startDate.toISOString().split('T')[0],
				month: startDate.getMonth(),
				year: startDate.getFullYear(),
			});
			startDate.setDate(startDate.getDate() + 1);
		} else if (format === 'weeks') {
			periods.push({
				period: startDate.toISOString().split('T')[0],
				month: startDate.getMonth(),
				year: startDate.getFullYear(),
			});
			startDate.setDate(startDate.getDate() + 7);
		} else if (format === 'months') {
			periods.push({
				period: startDate.toISOString().slice(0, 7),
				month: startDate.getMonth(),
				year: startDate.getFullYear(),
			});
			startDate.setMonth(startDate.getMonth() + 1);
		}
	}

	const months = periods.reduce(
		(acc: { [key: string]: string[] }, { period, year, month }) => {
			const key = `${year}-${String(month + 1).padStart(2, '0')}`;
			if (!acc[key]) acc[key] = [];
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
									className="grid gap-2 w-fit max-w-full justify-center items-center"
									style={{
										gridTemplateColumns: `repeat(${Math.min(7, periods.length)}, minmax(1rem, 1fr))`,
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
