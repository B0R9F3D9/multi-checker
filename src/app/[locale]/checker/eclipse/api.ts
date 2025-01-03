import axios from 'axios';
import { format } from 'date-fns';

import { getEthPrice, promiseAll } from '@/lib/utils';
import type { Wallet } from '@/types/wallet';

import type {
	EclipseAccount,
	EclipseDomain,
	EclipseResponse,
	EclipseTxn,
	EclipseWallet,
} from './types';

async function getEthBalance(address: string): Promise<number> {
	const resp = await axios.get<EclipseResponse<EclipseAccount>>(
		// 'https://api.eclipsescan.xyz/v1/account',
		'/api/checker/eclipse/account',
		{
			params: {
				address,
			},
		},
	);

	if (!resp.data.success || resp.data.errors)
		throw new Error(resp.data.errors!.message);
	return resp.data.data!.lamports! / 10 ** 9;
}

async function getDomain(address: string): Promise<string> {
	const resp = await axios.get<EclipseResponse<EclipseDomain>>(
		// 'https://api.eclipsescan.xyz/v1/account/domain',
		'/api/checker/eclipse/domain',
		{
			params: {
				address,
			},
		},
	);

	if (!resp.data.success || resp.data.errors)
		throw new Error(resp.data.errors!.message);

	if (!resp.data.data?.favorite) return '-';
	return resp.data.data!.favorite;
}

async function getTxns(
	address: string,
	before?: string,
): Promise<EclipseTxn[]> {
	const resp = await axios.get<EclipseResponse<{ transactions: EclipseTxn[] }>>(
		// 'https://api.eclipsescan.xyz/v1/account/transactions',
		'/api/checker/eclipse/transaction',
		{
			params: {
				address,
				before,
			},
		},
	);

	if (!resp.data.success || resp.data.errors)
		throw new Error(resp.data.errors!.message);

	const txns = resp.data.data!.transactions;
	if (txns.length === 40)
		return await getTxns(address, txns[txns.length - 1].txHash);
	return txns;
}

function processTxns(
	txns: EclipseTxn[],
	ethPrice: number,
): Partial<EclipseWallet> {
	const result = {
		txns: txns.length,
		firstTxnTimestamp: 0,
		lastTxnTimestamp: 0,
		volume: 0,
		fee: 0,
		days: [{ date: '', txns: 0 }],
		weeks: [{ date: '', txns: 0 }],
		months: [{ date: '', txns: 0 }],
	};

	for (const txn of txns) {
		result.firstTxnTimestamp = Math.min(
			result.firstTxnTimestamp,
			txn.blockTime,
		);
		result.lastTxnTimestamp = Math.max(result.lastTxnTimestamp, txn.blockTime);
		result.volume += (parseInt(txn.sol_value) / 10 ** 9) * ethPrice;
		result.fee += (txn.fee / 10 ** 9) * ethPrice;

		const date = new Date(txn.blockTime * 1000);
		const day = result.days.find(
			day => day.date === format(date, 'yyyy-MM-dd'),
		);
		if (day) day.txns += 1;
		else result.days.push({ date: format(date, 'yyyy-MM-dd'), txns: 1 });

		const week = result.weeks.find(
			week => week.date === format(date, 'yyyy-ww'),
		);
		if (week) week.txns += 1;
		else result.weeks.push({ date: format(date, 'yyyy-ww'), txns: 1 });

		const month = result.months.find(
			month => month.date === format(date, 'yyyy-MM'),
		);
		if (month) month.txns += 1;
		else result.months.push({ date: format(date, 'yyyy-MM'), txns: 1 });
	}

	result.days = result.days.filter(item => item.date !== '');
	result.weeks = result.weeks.filter(item => item.date !== '');
	result.months = result.months.filter(item => item.date !== '');

	return result;
}

async function fetchWallet(
	address: string,
	concurrentFetches: number,
	ethPrice: number,
) {
	let balance, domain, txns, data;
	try {
		balance = (await getEthBalance(address)) * ethPrice;
	} catch (err) {
		balance = null;
		console.error(err);
	}
	try {
		domain = await getDomain(address);
	} catch (err) {
		domain = null;
		console.error(err);
	}
	try {
		txns = await getTxns(address);
	} catch (err) {
		txns = null;
		console.error(err);
	}
	try {
		if (txns) data = processTxns(txns, ethPrice);
	} catch (err) {
		data = {
			txns: null,
			firstTxnTimestamp: null,
			lastTxnTimestamp: null,
			volume: null,
			fee: null,
			days: null,
			weeks: null,
			months: null,
		};
		console.error(err);
	}
	return { balance, domain, ...data };
}

export async function fetchWallets(
	addresses: string[],
	concurrentFetches: number,
	concurrentWallets: number,
	updateWallet: (address: string, wallet: Partial<Wallet>) => void,
	setProgress?: (progress: number) => void,
) {
	const ethPrice = await getEthPrice();
	await promiseAll(
		addresses.map(address => async () => {
			try {
				updateWallet(address, {
					txns: undefined,
					domain: undefined,
					balance: undefined,
					volume: undefined,
					fee: undefined,
					days: undefined,
					weeks: undefined,
					months: undefined,
					firstTxnTimestamp: undefined,
					lastTxnTimestamp: undefined,
				});
				const result = await fetchWallet(address, concurrentFetches, ethPrice);
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
					firstTxnTimestamp: null,
					lastTxnTimestamp: null,
				});
			}
		}),
		concurrentWallets,
		setProgress,
	);
}
