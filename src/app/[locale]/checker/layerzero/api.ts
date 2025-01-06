import axios from 'axios';
import { format } from 'date-fns';

import { promiseAll } from '@/lib/utils';
import type { Wallet } from '@/types/wallet';

import type { LayerzeroResponse, LayerzeroTxn, LayerzeroWallet } from './types';

function parseResult(txns: LayerzeroTxn[]): Partial<LayerzeroWallet> {
	const result = {
		days: [{ date: '', txns: 0 }],
		weeks: [{ date: '', txns: 0 }],
		months: [{ date: '', txns: 0 }],
		srcChains: [{ name: '', txns: 0 }],
		dstChains: [{ name: '', txns: 0 }],
		protocols: [{ id: '', name: '', txns: 0 }],
		contracts: 0,
	};

	const contractsSet = new Set<string>();

	for (const txn of txns) {
		if (txn?.srcUaProtocol?.id) {
			const protocol = result.protocols.find(
				protocol => protocol.id === txn.srcUaProtocol.id,
			);
			if (protocol) protocol.txns += 1;
			else
				result.protocols.push({
					id: txn.srcUaProtocol.id,
					name: txn.srcUaProtocol.name,
					txns: 1,
				});
		}

		if (txn?.dstUaProtocol?.id) {
			const protocol = result.protocols.find(
				protocol => protocol.id === txn.dstUaProtocol.id,
			);
			if (protocol) protocol.txns += 1;
			else
				result.protocols.push({
					id: txn.dstUaProtocol.id,
					name: txn.dstUaProtocol.name,
					txns: 1,
				});
		}

		const srcChain = result.srcChains.find(
			chain => chain.name === txn.srcChainKey,
		);
		if (srcChain) srcChain.txns += 1;
		else result.srcChains.push({ name: txn.srcChainKey, txns: 1 });

		const dstChain = result.dstChains.find(
			chain => chain.name === txn.dstChainKey,
		);
		if (dstChain) dstChain.txns += 1;
		else result.dstChains.push({ name: txn.dstChainKey, txns: 1 });

		const date = new Date(txn.created * 1000);
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

		contractsSet.add(txn.srcUaAddress);
	}

	result.contracts = [...contractsSet].length;

	result.srcChains = result.srcChains
		.filter(item => item.name !== '')
		.sort((a, b) => b.txns - a.txns);
	result.dstChains = result.dstChains
		.filter(item => item.name !== '')
		.sort((a, b) => b.txns - a.txns);
	result.protocols = result.protocols
		.filter(item => item.id !== '')
		.sort((a, b) => b.txns - a.txns);
	result.days = result.days.filter(item => item.date !== '');
	result.weeks = result.weeks.filter(item => item.date !== '');
	result.months = result.months.filter(item => item.date !== '');

	return result;
}

async function fetchWallet(address: string, concurrentFetches: number) {
	const resp = await axios.get<LayerzeroResponse>('/api/checker/layerzero', {
		params: {
			address,
		},
	});
	return {
		txns: resp.data.result.data.count,
		...parseResult(resp.data.result.data.messages),
	};
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
					srcChains: null,
					dstChains: null,
					protocols: null,
					contracts: null,
				});
			}
		}),
		concurrentWallets,
		setProgress,
	);
}
