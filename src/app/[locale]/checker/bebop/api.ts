import axios from 'axios';
import { format } from 'date-fns';

import { promiseAll } from '@/lib/utils';
import type { Wallet } from '@/types/wallet';

import type { BebopTxn, BebopTxnResponse, BebopWallet } from './types';

async function getTxns(address: string): Promise<BebopTxn[]> {
	const resp = await axios.get<BebopTxnResponse>(
		`https://api.bebop.xyz/history/v2/trades`,
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

		const txnDate = new Date(txn.timestamp);

		const day = result.days.find(
			day => day.date === format(txnDate, 'yyyy-MM-dd'),
		);
		if (day) day.txns += 1;
		else result.days.push({ date: format(txnDate, 'yyyy-MM-dd'), txns: 1 });

		const week = result.weeks.find(
			week => week.date === format(txnDate, 'yyyy-ww'),
		);
		if (week) week.txns += 1;
		else result.weeks.push({ date: format(txnDate, 'yyyy-ww'), txns: 1 });

		const month = result.months.find(
			month => month.date === format(txnDate, 'yyyy-MM'),
		);
		if (month) month.txns += 1;
		else result.months.push({ date: format(txnDate, 'yyyy-MM'), txns: 1 });

		const chain = result.chains.find(chain => chain.id === txn.chain_id);
		if (chain) chain.txns += 1;
		else result.chains.push({ id: txn.chain_id, txns: 1 });
	}

	result.days = result.days.filter(item => item.date !== '');
	result.weeks = result.weeks.filter(item => item.date !== '');
	result.months = result.months.filter(item => item.date !== '');
	result.chains = result.chains
		.filter(item => item.id !== 0)
		.sort((a, b) => b.txns - a.txns);

	return result;
}

async function fetchWallet(address: string, concurrentFetches: number) {
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
