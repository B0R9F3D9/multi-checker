import axios from 'axios';

import { getWeekStart, promiseAll } from '@/lib/utils';
import type { Wallet } from '@/types/wallet';

import type { MayanResponse, MayanTxn, MayanWallet } from './types';

async function getTxns(
	address: string,
	limit: number = 50,
	offset: number = 0,
	collectedTxns: MayanTxn[] = [],
): Promise<MayanTxn[]> {
	const resp = await axios.get<MayanResponse>(
		'https://explorer-api.mayan.finance/v3/swaps',
		{
			params: {
				trader: address,
				limit,
				offset,
			},
		},
	);
	collectedTxns.push(...resp.data.data);
	if (resp.data.data.length < limit) return collectedTxns;
	return await getTxns(address, limit, offset + limit, collectedTxns);
}

function parseResult(txns: MayanTxn[]): Partial<MayanWallet> {
	const result = {
		txns: txns.length,
		days: [{ date: '', txns: 0 }],
		weeks: [{ date: '', txns: 0 }],
		months: [{ date: '', txns: 0 }],
		volume: 0,
		srcChains: [{ id: 0, txns: 0 }],
		dstChains: [{ id: 0, txns: 0 }],
	};

	for (const txn of txns) {
		result.volume +=
			parseFloat(txn.fromAmount) * parseFloat(txn.fromTokenPrice);

		const srcChain = result.srcChains.find(
			chain => chain.id === parseInt(txn.sourceChain),
		);
		if (srcChain) srcChain.txns += 1;
		else result.srcChains.push({ id: parseInt(txn.sourceChain), txns: 1 });

		const dstChain = result.dstChains.find(
			chain => chain.id === parseInt(txn.destChain),
		);
		if (dstChain) dstChain.txns += 1;
		else result.dstChains.push({ id: parseInt(txn.destChain), txns: 1 });

		const date = txn.initiatedAt.split('T')[0];
		const day = result.days.find(day => day.date === date);
		if (day) day.txns += 1;
		else result.days.push({ date, txns: 1 });

		const weekDate = getWeekStart(date);
		const week = result.weeks.find(week => week.date === weekDate);
		if (week) week.txns += 1;
		else result.weeks.push({ date: weekDate, txns: 1 });

		const month = result.months.find(month => month.date === date.slice(0, 7));
		if (month) month.txns += 1;
		else result.months.push({ date: date.slice(0, 7), txns: 1 });
	}

	result.srcChains = result.srcChains
		.filter(item => item.id !== 0)
		.sort((a, b) => b.txns - a.txns);
	result.dstChains = result.dstChains
		.filter(item => item.id !== 0)
		.sort((a, b) => b.txns - a.txns);
	result.days = result.days
		.filter(item => item.date !== '')
		.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
	result.weeks = result.weeks
		.filter(item => item.date !== '')
		.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
	result.months = result.months
		.filter(item => item.date !== '')
		.sort(
			(a, b) =>
				new Date(a.date + '-01').getTime() - new Date(b.date + '-01').getTime(),
		);

	return result;
}

async function fetchWallet(address: string, concurrentFetches: number) {
	const txns = await getTxns(address);
	return parseResult(txns);
}

export async function fetchWallets(
	addresses: string[],
	concurrentFetches: number,
	concurrentWallets: number,
	updateWallet: (address: string, wallet: Partial<Wallet>) => void,
	setProgress?: (progress: number) => void,
) {
	await promiseAll(
		addresses.map(address => async () => {
			try {
				const result = await fetchWallet(address, concurrentFetches);
				updateWallet(address, result);
			} catch (err) {
				console.error(err);
				updateWallet(address, {
					txns: null,
					days: null,
					weeks: null,
					months: null,
					volume: null,
					srcChains: null,
					dstChains: null,
				});
			}
		}),
		concurrentWallets,
		setProgress,
	);
}
