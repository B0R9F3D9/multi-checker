import { parseTransaction } from 'anchores';
import { JUPITER_V6_PROGRAM_ID, SwapEvent } from 'anchores/parsers/jupiter';
import axios from 'axios';

import { DatabaseService } from '@/lib/db';
import { getTxns, type HeliusTxn } from '@/lib/solana';
import { getWeekStart, promiseAll, sortByDate } from '@/lib/utils';
import type { Wallet } from '@/types/wallet';

import type { JupiterPriceResponse, JupiterWallet } from './types';

function parseTxn(txn: HeliusTxn) {
	const jupInstr = txn.transaction.message.instructions.find(
		inst => inst.programId === JUPITER_V6_PROGRAM_ID,
	);
	if (!jupInstr) {
		throw new Error('Could not find Jupiter swap instruction.');
	}

	const events = parseTransaction(
		JUPITER_V6_PROGRAM_ID,
		{
			events: [SwapEvent],
		},
		txn as any,
	);

	if (!events) throw new Error('Could parse Jupiter swap events.');

	const inputMint = events[0].data.inputMint;
	const outputMint = events.at(-1)!.data.outputMint;

	const inputDecimals = txn.meta.preTokenBalances.find(
		bal => bal.mint === inputMint,
	)!.uiTokenAmount.decimals;
	const outputDecimals = txn.meta.postTokenBalances.find(
		bal => bal.mint === outputMint,
	)!.uiTokenAmount.decimals;

	const inputAmount = Number(
		events[0].data.inputAmount / BigInt(10 ** inputDecimals),
	);
	const outputAmount = Number(
		events.at(-1)!.data.outputAmount / BigInt(10 ** outputDecimals),
	);

	return {
		inputMint,
		inputAmount,
		outputMint,
		outputAmount,
	};

	// else if (events.length === 1)
	// 	return {
	// 		inputMint: events[0].data.inputMint,
	// 		inputAmount: events[0].data.inputAmount,
	// 		outputMint: events[0].data.outputMint,
	// 		outputAmount: events[0].data.outputAmount,
	// 	};
	// else
	// 	return {
	// 		inputMint: events[0].data.inputMint,
	// 		inputAmount: events[0].data.inputAmount,
	// 		outputMint: events.at(-1)!.data.outputMint,
	// 		outputAmount: events.at(-1)!.data.outputAmount,
	// 	};
}

async function getMultipleTokenPrices(tokenAddresses: string[]) {
	const dbService = new DatabaseService('jupiter', 'tokens');
	const prices: Record<string, number> = {};
	const tokensToFetch: string[] = [];

	for (const token of tokenAddresses) {
		const cached = await dbService.get<{ timestamp: number; price: number }>(
			token,
		);
		if (cached && Date.now() - cached.timestamp < 600 * 1000)
			prices[token] = cached.price;
		else tokensToFetch.push(token);
	}

	const batchSize = 50;
	for (let i = 0; i < tokensToFetch.length; i += batchSize) {
		const batch = tokensToFetch.slice(i, i + batchSize);

		const resp = await axios.get<JupiterPriceResponse>(
			`https://api.jup.ag/price/v2?ids=${batch.join(',')}`,
		);

		for (const token of batch) {
			const price = parseFloat(resp.data.data[token]?.price || '0');
			prices[token] = price;
			await dbService.create(token, { timestamp: Date.now(), price });
		}
	}

	return prices;
}

async function processTxns(
	newTxns: HeliusTxn[],
	cached?: JupiterWallet | null,
): Promise<Partial<JupiterWallet>> {
	newTxns = newTxns.filter(
		txn =>
			new Date(txn.blockTime * 1000).getTime() >
			new Date('2024-11-01').getTime(),
	);

	const result = {
		txns: cached?.txns || 0,
		srcVolume: cached?.srcVolume || 0,
		dstVolume: cached?.dstVolume || 0,
		tokens: cached?.tokens || 0,
		days: cached?.days || [{ date: '', txns: 0 }],
		weeks: cached?.weeks || [{ date: '', txns: 0 }],
		months: cached?.months || [{ date: '', txns: 0 }],
	};

	const tokensSet = new Set<string>();

	const parsedTxns = [];
	for (const txn of newTxns) {
		try {
			const parsed = parseTxn(txn);
			tokensSet.add(parsed.inputMint);
			tokensSet.add(parsed.outputMint);
			parsedTxns.push({ txn, parsed });
		} catch {
			continue;
		}
	}

	const tokenPrices = await getMultipleTokenPrices([...tokensSet]);

	for (const { txn, parsed } of parsedTxns) {
		result.srcVolume += tokenPrices[parsed.inputMint] * parsed.inputAmount;
		result.dstVolume += tokenPrices[parsed.outputMint] * parsed.outputAmount;

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

	result.txns += parsedTxns.length;
	result.tokens += tokensSet.size;
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
	const dbService = new DatabaseService('jupiter', 'results');
	const cached = await dbService.get<{
		lastHash: string;
		result: JupiterWallet | null;
	}>(address);

	const txns = await getTxns(address, concurrentFetches, cached?.lastHash);
	const result = await processTxns(txns, cached?.result);
	await dbService.create(address, {
		lastHash:
			txns.at(0)?.transaction?.signatures?.at(0) || cached?.lastHash || '',
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
					txns: undefined,
					srcVolume: undefined,
					dstVolume: undefined,
					tokens: undefined,
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
					srcVolume: null,
					dstVolume: null,
					volume: null,
					tokens: null,
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
