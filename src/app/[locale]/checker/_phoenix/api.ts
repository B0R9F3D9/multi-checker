import axios from 'axios';
import csv from 'csvtojson';

import { getWeekStart, promiseAll, sortByDate } from '@/lib/utils';
import type { Wallet } from '@/types/wallet';

import type { PhoenixTxn, PhoenixTxnsResponse, PhoenixWallet } from './types';

async function getTxns(address: string): Promise<PhoenixTxn[]> {
	const resp = await axios.get<PhoenixTxnsResponse>(
		'https://9senbezsz3.execute-api.us-east-1.amazonaws.com/Prod/get-full-trade-history-csv',
		{
			params: {
				start_timestamp: 0,
				trader: address,
			},
			headers: {
				'x-api-key': 'CmXNmY4IeA4MxiKv9KS82892zk2TV3fV2gma8iia',
			},
		},
	);

	const csvResp = await axios.get(resp.data.url!);
	const transactions: PhoenixTxn[] = await csv({
		noheader: false,
		headers: [
			'date',
			'market',
			'trade_direction',
			'price',
			'base_units_filled',
			'trade_type',
			'fees_paid_in_quote_units',
			'slot',
			'unix_timestamp',
			'taker_transaction',
			'maker_transaction',
		],
	}).fromString(csvResp.data);

	return transactions.map(txn => ({
		...txn,
		price: parseFloat(String(txn.price)),
		base_units_filled: parseFloat(String(txn.base_units_filled)),
		fees_paid_in_quote_units: parseFloat(String(txn.fees_paid_in_quote_units)),
		slot: parseInt(String(txn.slot), 10),
		unix_timestamp: parseInt(String(txn.unix_timestamp), 10),
	}));
}

function processTxns(txns: PhoenixTxn[]): Partial<PhoenixWallet> {
	const result = {
		txns: txns.length,
		volume: 0,
		pairs: 0,
		days: [{ date: '', txns: 0 }],
		weeks: [{ date: '', txns: 0 }],
		months: [{ date: '', txns: 0 }],
	};

	const pairsSet = new Set<string>();

	for (const txn of txns) {
		pairsSet.add(txn.market);
		result.volume += txn.price * txn.base_units_filled;

		const date = new Date(txn.date).toISOString().split('T')[0];
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

	result.days = result.days.filter(item => item.date !== '').sort(sortByDate);
	result.weeks = result.weeks.filter(item => item.date !== '').sort(sortByDate);
	result.months = result.months
		.filter(item => item.date !== '')
		.sort(
			(a, b) =>
				new Date(a.date + '-01').getTime() - new Date(b.date + '-01').getTime(),
		);
	result.pairs = pairsSet.size;

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
					pairs: undefined,
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
					pairs: null,
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
