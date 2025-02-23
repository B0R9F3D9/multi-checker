import axios from 'axios';

import { DatabaseService } from '@/lib/db';
import { getWeekStart, promiseAll, sortByDate } from '@/lib/utils';
import type { Wallet } from '@/types/wallet';

import type { OdosTxn, OdosTxnResponse, OdosWallet } from './types';

async function getTxns(
	address: string,
	page: number,
): Promise<OdosTxnResponse> {
	const resp = await axios.get<OdosTxnResponse>(
		`https://api.odos.xyz/transaction-history/${address}`,
		{
			params: {
				page,
			},
		},
	);
	return resp.data!;
}

function processTxns(txns: OdosTxn[]): Partial<OdosWallet> {
	txns = txns.filter(
		txn =>
			new Date(txn.block_time).getTime() > new Date('2024-12-16').getTime(),
	);

	const result = {
		txns: txns.length,
		volume: 0,
		tokens: 0,
		chains: [{ id: 0, txns: 0 }],
		days: [{ date: '', txns: 0 }],
		weeks: [{ date: '', txns: 0 }],
		months: [{ date: '', txns: 0 }],
	};

	const tokensSet = new Set<string>();

	for (const txn of txns) {
		for (const input of txn.inputs) {
			result.volume += input.amount_usd;
			tokensSet.add(input.token_address);
		}
		for (const output of txn.outputs) {
			tokensSet.add(output.token_address);
		}

		const date = new Date(txn.block_time).toISOString().split('T')[0];
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
	result.chains = result.chains.filter(item => item.id !== 0);
	result.tokens = tokensSet.size;

	return result;
}

async function fetchWallet(address: string, concurrentFetches: number) {
	const dbService = new DatabaseService('odos', 'results');
	const cached = await dbService.get<{ txns: OdosTxn[] }>(address);
	const storedTxns = cached?.txns;

	const initReq = await getTxns(address, 1);
	if (storedTxns === undefined) await dbService.create(address, []);
	else if (storedTxns.length === initReq.totalCount)
		return processTxns(storedTxns);

	const txns = [...initReq.transactions, ...(storedTxns || [])];
	const pages = Math.ceil((initReq.totalCount - txns.length) / 10);
	const requests = new Array(pages)
		.fill(null)
		.map((_, i) => async () => await getTxns(address, i + 2));

	const newTxns = await promiseAll(requests, concurrentFetches);
	newTxns.forEach(resp => txns.push(...resp.transactions));
	await dbService.create(address, txns);
	return processTxns(txns);
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
					tokens: undefined,
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
					tokens: null,
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
