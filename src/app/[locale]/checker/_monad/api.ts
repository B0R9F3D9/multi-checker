import axios from 'axios';

import { DatabaseService } from '@/lib/db';
import { getWeekStart, promiseAll, sortByDate } from '@/lib/utils';
import type { Wallet } from '@/types/wallet';

import type {
	MonadBalanceResponse,
	MonadTxn,
	MonadTxnResponse,
	MonadWallet,
} from './types';

async function getMonBalance(address: string) {
	const resp = await axios.get<MonadBalanceResponse>(
		'https://monad-api.blockvision.org/testnet/api/account/tokenPortfolio',
		{
			params: {
				address,
			},
		},
	);
	if (resp.data.code !== 0 || resp.data.message !== 'OK')
		throw new Error(resp.data.reason);

	const token = resp.data.result.data.find(token => token.symbol === 'MON');
	if (!token) return 0;
	return parseFloat(token.balance);
}

async function getTxns(
	address: string,
	stopHash?: string,
	cursor?: string,
	collectedTxns: MonadTxn[] = [],
) {
	const resp = await axios.get<MonadTxnResponse>(
		'https://monad-api.blockvision.org/testnet/api/account/activities',
		{
			params: {
				address,
				...(cursor && { cursor }),
			},
		},
	);

	if (resp.data.code !== 0 || resp.data.message !== 'OK')
		throw new Error(resp.data.reason);
	if (resp.data.result === null) return [];

	const newTxns = resp.data.result?.data;
	const stopIndex = newTxns.findIndex(txn => txn.hash === stopHash);

	if (stopIndex !== -1) {
		collectedTxns.push(...newTxns.slice(0, stopIndex));
		return collectedTxns;
	} else {
		collectedTxns.push(...newTxns);
		if (resp.data.result?.nextPageCursor) {
			return getTxns(
				address,
				stopHash,
				resp.data.result.nextPageCursor,
				collectedTxns,
			);
		} else {
			return collectedTxns;
		}
	}
}

function processTxns(txns: MonadTxn[], address: string): Partial<MonadWallet> {
	txns.filter(txn => txn.from === address.toLowerCase());

	const result = {
		txns: txns.length,
		contracts: 0,
		fee: 0,
		days: [{ date: '', txns: 0 }],
		weeks: [{ date: '', txns: 0 }],
		months: [{ date: '', txns: 0 }],
	};

	const contractsSet = new Set<string>();

	for (const txn of txns) {
		result.fee += parseFloat(txn.transactionFee);
		if (txn.isContract) contractsSet.add(txn.to);

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
	}

	result.contracts = contractsSet.size;
	result.days = result.days.filter(item => item.date !== '').sort(sortByDate);
	result.weeks = result.weeks.filter(item => item.date !== '').sort(sortByDate);
	result.months = result.months
		.filter(item => item.date !== '')
		.sort(
			(a, b) =>
				new Date(a.date + '-01').getTime() - new Date(b.date + '-01').getTime(),
		);
	return result;
}

async function fetchWallet(address: string, _concurrentFetches: number) {
	const dbService = new DatabaseService('monad', 'results');
	const cached = await dbService.get<{ txns: MonadTxn[]; balance: number }>(
		address,
	);
	const storedTxns = cached?.txns;

	const stopHash = storedTxns?.[0]?.hash;
	const newTxns = await getTxns(address, stopHash);
	if (storedTxns && newTxns.length === 0)
		return {
			...processTxns(storedTxns!, address),
			balance: cached?.balance,
		};

	const allTxns = [...newTxns, ...(storedTxns || [])];
	const balance = await getMonBalance(address);
	await dbService.create(address, { txns: allTxns, balance });

	return { ...processTxns(allTxns, address), balance };
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
					balance: undefined,
					contracts: undefined,
					fee: undefined,
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
					balance: null,
					contracts: null,
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
