import Image from 'next/image';
import * as React from 'react';
import { LuArrowDownUp, LuCircleX } from 'react-icons/lu';

import { Button } from '@/components/ui/button';
import { ACTION_LINKS } from '@/constants';

import { Skeleton } from '../ui/skeleton';

export function getActionButton(address: string, link: string, image: string) {
	return (
		<Button
			className="cursor-pointer w-6 h-6"
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
					className="rounded-md w-full h-full"
				/>
			</a>
		</Button>
	);
}

export function getDebankButton(address: string) {
	return getActionButton(address, ACTION_LINKS.debank, '/debank.svg');
}

export function getSolScanButton(address: string) {
	return getActionButton(address, ACTION_LINKS.solScan, '/solscan.png');
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
