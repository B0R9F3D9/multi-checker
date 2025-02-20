import axios from 'axios';

import { getWeekStart, promiseAll, sortByDate } from '@/lib/utils';
import type { Wallet } from '@/types/wallet';

import type { BebopTxn, BebopTxnResponse, BebopWallet } from './types';

async function getTxns(address: string): Promise<BebopTxn[]> {
	const resp = await axios.get<BebopTxnResponse>(
		'https://api.bebop.xyz/history/v2/trades',
		{
			params: {
				start: new Date('2022-06-09').getTime() * 1000000,
				end: new Date().getTime() * 1000000,
				size: 100000,
				wallet_address: address,
			},
		},
	);

	return resp.data.results!;
}

function processTxns(txns: BebopTxn[]): Partial<BebopWallet> {
	const result = {
		txns: txns.length,
		volume: 0,
		chains: [{ id: 0, txns: 0 }],
		days: [{ date: '', txns: 0 }],
		weeks: [{ date: '', txns: 0 }],
		months: [{ date: '', txns: 0 }],
	};

	for (const txn of txns) {
		result.volume += txn.volumeUsd;

		const date = new Date(txn.timestamp).toISOString().split('T')[0];
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

		const chain = result.chains.find(chain => chain.id === txn.chain_id);
		if (chain) chain.txns += 1;
		else result.chains.push({ id: txn.chain_id, txns: 1 });
	}

	result.days = result.days.filter(item => item.date !== '').sort(sortByDate);
	result.weeks = result.weeks.filter(item => item.date !== '').sort(sortByDate);
	result.months = result.months
		.filter(item => item.date !== '')
		.sort(
			(a, b) =>
				new Date(a.date + '-01').getTime() - new Date(b.date + '-01').getTime(),
		);
	result.chains = result.chains
		.filter(item => item.id !== 0)
		.sort((a, b) => b.txns - a.txns);

	return result;
}

async function fetchWallet(address: string, _concurrentFetches: number) {
	return processTxns(await getTxns(address));
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
				updateWallet(address, {
					txns: undefined,
					chains: undefined,
					volume: undefined,
					days: undefined,
					weeks: undefined,
					months: undefined,
				});
				const result = await fetchWallet(address, concurrentFetches);
				updateWallet(address, result);
			} catch (err) {
				console.error(err);
				updateWallet(address, {
					txns: null,
					chains: null,
					volume: null,
					days: null,
					weeks: null,
					months: null,
				});
			}
		}),
		concurrentWallets,
		setProgress,
	);
}
