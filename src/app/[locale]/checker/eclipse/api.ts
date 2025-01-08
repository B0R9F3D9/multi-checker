import axios from 'axios';

import { getEthPrice, getWeekStart, promiseAll } from '@/lib/utils';
import { generateUUID } from '@/lib/utils';
import type { Wallet } from '@/types/wallet';

import type {
	EclipseAccount,
	EclipseDomain,
	EclipseResponse,
	EclipseTapsResponse,
	EclipseTxn,
	EclipseTxnDetail,
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
	return (resp.data.data?.lamports || 0) / 10 ** 9;
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

	return resp.data.data?.favorite || '';
}

async function getTxns(
	address: string,
	before?: string,
	collectedTxns: EclipseTxn[] = [],
): Promise<EclipseTxn[]> {
	const resp = await axios.get<EclipseResponse<{ transactions: EclipseTxn[] }>>(
		// 'https://api.eclipsescan.xyz/v1/account/transaction',
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
	collectedTxns.push(...txns);

	if (txns.length === 40)
		return await getTxns(address, txns[txns.length - 1].txHash, collectedTxns);

	return collectedTxns;
}

async function fetchAddressTaps(address: string) {
	function decodeTaps(str: string) {
		const decoded = Buffer.from(str, 'base64');
		const offset = 8;
		return decoded.readUInt32LE(offset);
	}

	const resp = await axios.post<EclipseTapsResponse>(
		'https://eclipse.lgns.net/',
		{
			method: 'getAccountInfo',
			jsonrpc: '2.0',
			params: [
				address,
				{
					encoding: 'base64',
					commitment: 'confirmed',
				},
			],
			id: generateUUID(),
		},
	);

	if (resp.data.result.value === null) return null;
	const value = resp.data.result.value.data[0];
	return decodeTaps(value);
}

async function getTaps(txns: EclipseTxn[]) {
	const hashs: string[] = [];
	for (const txn of txns) {
		if (
			txn.programIds.includes('turboe9kMc3mSR8BosPkVzoHUfn5RVNzZhkrT2hdGxN') &&
			parseInt(txn.sol_value) === 11492 * 2 + txn.fee
		) {
			hashs.push(txn.txHash);
		}
	}

	const addresses: string[] = [];
	for (const hash of hashs) {
		const resp = await axios.get<EclipseResponse<EclipseTxnDetail>>(
			'/api/checker/eclipse/transaction/detail',
			{
				params: { tx: hash },
			},
		);
		if (!resp.data.success || resp.data.errors) continue;

		for (const instr of resp.data.data!.parsed_instructions) {
			for (const transfer of instr.transfers) {
				addresses.push(transfer.destination);
			}
		}
	}

	for (const address of addresses) {
		const taps = await fetchAddressTaps(address);
		if (taps !== null) return taps;
	}
	return 0;
}

function processTxns(
	txns: EclipseTxn[],
	ethPrice: number,
): Partial<EclipseWallet> {
	const result = {
		txns: txns.length,
		volume: 0,
		fee: 0,
		days: [{ date: '', txns: 0 }],
		weeks: [{ date: '', txns: 0 }],
		months: [{ date: '', txns: 0 }],
	};

	for (const txn of txns) {
		result.volume += (parseInt(txn.sol_value) / 10 ** 9) * ethPrice;
		result.fee += (txn.fee / 10 ** 9) * ethPrice;

		const date = new Date(txn.blockTime * 1000).toISOString().split('T')[0];
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

async function fetchWallet(
	address: string,
	concurrentFetches: number,
	ethPrice: number,
) {
	let balance, domain, taps, txns, data;
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
		if (txns) taps = await getTaps(txns);
	} catch (err) {
		taps = null;
		console.error(err);
	}
	try {
		if (txns) data = processTxns(txns, ethPrice);
	} catch (err) {
		data = {
			volume: null,
			fee: null,
			days: null,
			weeks: null,
			months: null,
		};
		console.error(err);
	}
	return { balance, domain, taps, ...data };
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
				const result = await fetchWallet(address, concurrentFetches, ethPrice);
				updateWallet(address, result);
			} catch (err) {
				console.error(err);
				updateWallet(address, {
					txns: null,
					domain: null,
					taps: null,
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
