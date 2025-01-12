import axios from 'axios';

import { getWeekStart, promiseAll } from '@/lib/utils';
import type { Wallet } from '@/types/wallet';

import type { JumperTxn, JumperTxnResponse, JumperWallet } from './types';

async function getTxns(address: string): Promise<JumperTxn[]> {
	const resp = await axios.get<JumperTxnResponse>(
		'https://li.quest/v1/analytics/transfers',
		{
			params: {
				fromTimestamp: 1420823170,
				status: 'ALL',
				integrator: 'jumper.exchange',
				wallet: address,
			},
		},
	);

	return resp.data.transfers!;
}

function processTxns(txns: JumperTxn[]): Partial<JumperWallet> {
	const result = {
		txns: txns.length,
		volume: 0,
		srcChains: [{ id: 0, txns: 0 }],
		dstChains: [{ id: 0, txns: 0 }],
		protocols: [{ id: '', name: '', txns: 0 }],
		days: [{ date: '', txns: 0 }],
		weeks: [{ date: '', txns: 0 }],
		months: [{ date: '', txns: 0 }],
	};

	for (const txn of txns) {
		result.volume += parseFloat(txn.sending.amountUSD);

		const date = new Date(txn.sending.timestamp * 1000)
			.toISOString()
			.split('T')[0];
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

		const srcChain = result.srcChains.find(
			chain => chain.id === txn.sending.chainId,
		);
		if (srcChain) srcChain.txns += 1;
		else result.srcChains.push({ id: txn.sending.chainId, txns: 1 });

		const dstChain = result.dstChains.find(
			chain => chain.id === txn.receiving.chainId,
		);
		if (dstChain) dstChain.txns += 1;
		else result.dstChains.push({ id: txn.receiving.chainId, txns: 1 });

		const protocol = result.protocols.find(
			protocol => protocol.name === txn.tool,
		);
		if (protocol) protocol.txns += 1;
		else result.protocols.push({ name: txn.tool, txns: 1, id: '' });
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
	result.srcChains = result.srcChains
		.filter(item => item.id !== 0)
		.sort((a, b) => b.txns - a.txns);
	result.dstChains = result.dstChains
		.filter(item => item.id !== 0)
		.sort((a, b) => b.txns - a.txns);
	result.protocols = result.protocols.filter(item => item.name !== '');

	return result;
}

async function fetchWallet(address: string, concurrentFetches: number) {
	const txns = await getTxns(address);
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
					srcChains: undefined,
					dstChains: undefined,
					protocols: undefined,
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
					srcChains: null,
					dstChains: null,
					protocols: null,
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
