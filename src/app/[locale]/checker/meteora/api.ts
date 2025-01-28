import axios from 'axios';

import { getTxns, type HeliusTxn } from '@/lib/solana';
import { getWeekStart, promiseAll } from '@/lib/utils';
import type { Wallet } from '@/types/wallet';

import type { MeteoraPair, MeteoraPosition, MeteoraWallet } from './types';

const pairs = await getPairsAddresses();

async function getPairsAddresses() {
	const resp = await axios.get<MeteoraPair[]>(
		'https://dlmm-api.meteora.ag/pair/all',
	);
	return resp.data!.map(pair => pair.address);
}

async function getPositon(
	position: string,
	endpoint: 'claim_fees' | 'deposits' | 'withdraws',
) {
	const resp = await axios.get<MeteoraPosition[]>(
		`https://dlmm-api.meteora.ag/position/${position}/${endpoint}`,
	);
	return resp.data!;
}

function getPositions(txns: HeliusTxn[], address: string) {
	const tokens = new Set<string>();
	for (const txn of txns) {
		for (const instr of txn.transaction.message.instructions) {
			const accs = instr.accounts;
			if (accs && accs?.length > 0) {
				if (accs[0] !== address) {
					if (pairs.includes(accs[1])) {
						tokens.add(accs[0]);
					}
				}
			}
		}
	}
	return Array.from(tokens);
}

function processTxns(txns: MeteoraPosition[]): Partial<MeteoraWallet> {
	const result = {
		txns: txns.length,
		days: [{ date: '', txns: 0 }],
		weeks: [{ date: '', txns: 0 }],
		months: [{ date: '', txns: 0 }],
	};

	for (const txn of txns) {
		const date = new Date(txn.onchain_timestamp * 1000)
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

async function fetchWallet(address: string, concurrentFetches: number) {
	const solTxns = await getTxns(address, concurrentFetches);
	const positions = getPositions(solTxns, address);

	const claimFeeTxns = (
		await promiseAll(
			positions.map(
				position => async () => await getPositon(position, 'claim_fees'),
			),
			concurrentFetches,
		)
	).flat();
	const depositsTxns = (
		await promiseAll(
			positions.map(
				position => async () => await getPositon(position, 'deposits'),
			),
			concurrentFetches,
		)
	).flat();
	const withdrawsTxns = (
		await promiseAll(
			positions.map(
				position => async () => await getPositon(position, 'withdraws'),
			),
			concurrentFetches,
		)
	).flat();

	return {
		...processTxns([...depositsTxns, ...claimFeeTxns, ...withdrawsTxns]),
		positions: positions.length,
		fees: claimFeeTxns
			.map(pos => pos.token_x_usd_amount + pos.token_y_usd_amount)
			.reduce((a, b) => a + b, 0),
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
				updateWallet(address, {
					txns: undefined,
					fees: undefined,
					positions: undefined,
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
					fees: null,
					positions: null,
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
