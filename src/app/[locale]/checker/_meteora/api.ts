import axios from 'axios';

import { DatabaseService } from '@/lib/db';
import { getTxns, type HeliusTxn } from '@/lib/solana';
import { getWeekStart, promiseAll, sortByDate } from '@/lib/utils';
import type { Wallet } from '@/types/wallet';

import type { MeteoraPair, MeteoraPosition, MeteoraWallet } from './types';

const pairs = await getPairsAddresses();

async function getPairsAddresses() {
	const dbService = new DatabaseService('meteora', 'pairs');
	const cached = await dbService.get<{
		timestamp: number;
		pairs: string[];
	}>('pairs');

	if (cached === undefined) {
		await dbService.create('pairs', {
			timestamp: Date.now(),
			pairs: [],
		});
	} else {
		if (cached.pairs.length > 0)
			if (Date.now() - cached.timestamp < 600 * 1000) return cached.pairs;
	}

	try {
		const resp = await axios.get<MeteoraPair[]>(
			'https://dlmm-api.meteora.ag/pair/all',
		);
		const result = resp.data!.map(pair => pair.address);
		await dbService.create('pairs', {
			timestamp: Date.now(),
			pairs: result,
		});
		return result;
	} catch {
		return [];
	}
}

async function getPositon(
	position: string,
	endpoint: 'claim_fees' | 'deposits' | 'withdraws',
) {
	try {
		const resp = await axios.get<MeteoraPosition[]>(
			`https://dlmm-api.meteora.ag/position/${position}/${endpoint}`,
		);
		return resp.data!;
	} catch {
		return [];
	}
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

function processTxns(
	newTxns: MeteoraPosition[],
	cachedResult?: MeteoraWallet | null,
): Partial<MeteoraWallet> {
	const result = {
		positions: cachedResult?.positions || 0,
		fees: cachedResult?.fees || 0,
		days: cachedResult?.days || [{ date: '', txns: 0 }],
		weeks: cachedResult?.weeks || [{ date: '', txns: 0 }],
		months: cachedResult?.months || [{ date: '', txns: 0 }],
	};

	for (const txn of newTxns) {
		result.positions += 1;
		result.fees += txn.token_x_usd_amount + txn.token_y_usd_amount;

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

async function fetchWallet(address: string, concurrentFetches: number) {
	const dbService = new DatabaseService('meteora', 'results');
	const cached = await dbService.get<{
		lastHash: string;
		result: MeteoraWallet | null;
	}>(address);
	if (cached === undefined)
		await dbService.create(address, { lastHash: '', result: {} });

	const solTxns = await getTxns(address, concurrentFetches, cached?.lastHash);
	const positions = getPositions(solTxns, address);

	const txns = (
		await promiseAll(
			positions.map(
				position => async () => await getPositon(position, 'claim_fees'),
			),
			concurrentFetches,
			undefined,
			45,
		)
	).flat();

	const result = processTxns(txns, cached?.result);
	await dbService.create(address, {
		lastHash:
			solTxns.at(0)?.transaction?.signatures?.at(0) || cached?.lastHash || '',
		result,
	});
	return result;
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
