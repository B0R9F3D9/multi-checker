import axios from 'axios';
import { format } from 'date-fns';

import { promiseAll } from '@/lib/utils';
import type { Wallet } from '@/types/wallet';

import { START_DATE } from './constants';
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
		txn => new Date(txn.block_time).getTime() > new Date(START_DATE).getTime(),
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

		const txnDate = new Date(txn.block_time);

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
	result.chains = result.chains.filter(item => item.id !== 0);
	result.tokens = tokensSet.size;

	return result;
}

async function fetchWallet(address: string, concurrentFetches: number) {
	let txnsCount, txns, result;
	try {
		const init_request = await getTxns(address, 1);
		txnsCount = init_request.totalCount - init_request.transactions.length;
		txns = init_request.transactions;
	} catch (err) {
		txnsCount = null;
		console.error(err);
	}
	try {
		if (txnsCount && txnsCount > 0) {
			const pages = Math.ceil(txnsCount / 10); // 10 txns per page
			const requests = [];
			for (let i = 2; i <= pages + 1; i++) {
				requests.push(() => getTxns(address, i));
			}

			const responses = await promiseAll(requests, concurrentFetches);
			responses.forEach(response => {
				txns.push(...response.transactions);
			});
		}
	} catch (err) {
		txns = null;
		console.error(err);
	}
	try {
		if (txns) result = processTxns(txns);
	} catch (err) {
		result = {
			txns: null,
			volume: null,
			fee: null,
			days: null,
			weeks: null,
			months: null,
		};
		console.error(err);
	}
	return { ...result };
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
					domain: null,
					balance: null,
					volume: null,
					fee: null,
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
