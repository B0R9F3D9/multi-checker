import axios from 'axios';

import { getWeekStart, promiseAll } from '@/lib/utils';
import type { Wallet } from '@/types/wallet';

import type {
	OrbiterRankResponse,
	OrbiterTxn,
	OrbiterTxnResponse,
	OrbiterWallet,
} from './types';

async function getPointsRank(address: string) {
	const resp = await axios.get<OrbiterRankResponse>(
		`https://api.orbiter.finance/points_platform/rank/address/${address.toLowerCase()}`,
	);

	return {
		points: Math.max(0, parseInt(resp.data.result.point!)),
		rank: resp.data.result.rank!,
	};
}

async function getTxns(
	address: string,
	offset?: number,
): Promise<{ count: number; txns: OrbiterTxn[] }> {
	const resp = await axios.get<OrbiterTxnResponse>(
		'https://api.orbiter.finance/sdk/transaction/history',
		{
			params: {
				address: address.toLowerCase(),
				...(offset !== undefined && { offset }),
			},
		},
	);

	return {
		count: resp.data.result.count!,
		txns: resp.data.result.rows!,
	};
}

function parseResult(
	txns: OrbiterTxn[],
	tokensPrices: TokenPrice[],
): Partial<OrbiterWallet> {
	const result = {
		txns: txns.length,
		volume: 0,
		srcChains: [{ id: 0, txns: 0 }],
		dstChains: [{ id: 0, txns: 0 }],
		days: [{ date: '', txns: 0 }],
		weeks: [{ date: '', txns: 0 }],
		months: [{ date: '', txns: 0 }],
	};

	for (const txn of txns) {
		const token = tokensPrices.find(token => token.ticker === txn.sourceSymbol);
		if (token) result.volume += parseFloat(txn.sourceAmount) * token.price;

		const srcChain = result.srcChains.find(
			chain => chain.id === parseInt(txn.sourceChain),
		);
		if (srcChain) srcChain.txns += 1;
		else result.srcChains.push({ id: parseInt(txn.sourceChain), txns: 1 });

		const dstChain = result.dstChains.find(
			chain => chain.id === parseInt(txn.targetChain),
		);
		if (dstChain) dstChain.txns += 1;
		else result.dstChains.push({ id: parseInt(txn.targetChain), txns: 1 });

		const date = txn.sourceTime.split('T')[0];
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

	result.srcChains = result.srcChains
		.filter(item => item.id !== 0)
		.sort((a, b) => b.txns - a.txns);
	result.dstChains = result.dstChains
		.filter(item => item.id !== 0)
		.sort((a, b) => b.txns - a.txns);
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
	tokensPrices: TokenPrice[],
) {
	const pointsRank = await getPointsRank(address);
	const initReq = await getTxns(address);
	const txns = initReq.txns;
	const txnsCount = initReq.count - txns.length;
	if (txnsCount > 0) {
		const pages = Math.ceil(txnsCount / 20); // 20 txns per page
		const requests = [];
		for (let i = 20; i <= pages * 20; i += 20) {
			requests.push(() => getTxns(address, i));
		}

		const responses = await promiseAll(requests, concurrentFetches);
		responses.forEach(resp => {
			txns.push(...resp.txns);
		});
	}
	return {
		...parseResult(txns, tokensPrices),
		rank: pointsRank.rank,
		points: pointsRank.points,
	};
}

export async function fetchWallets(
	addresses: string[],
	concurrentFetches: number,
	concurrentWallets: number,
	updateWallet: (address: string, wallet: Partial<Wallet>) => void,
	setProgress?: (progress: number) => void,
) {
	const tokensPrices: TokenPrice[] = [
		{ id: 'bitcoin', price: 0, ticker: 'BTC' },
		{ id: 'ethereum', price: 0, ticker: 'ETH' },
		{ id: 'usd-coin', price: 1, ticker: 'USDC' },
		{ id: 'tether', price: 1, ticker: 'USDT' },
		{ id: 'book-of-meme', price: 0, ticker: 'BOME' },
		{ id: 'arbdoge-ai', price: 0, ticker: 'AIDOGE' },
	];
	await updateTokenPrices(tokensPrices);

	await promiseAll(
		addresses.map(address => async () => {
			try {
				updateWallet(address, {
					txns: undefined,
					days: undefined,
					weeks: undefined,
					months: undefined,
					volume: undefined,
					rank: undefined,
					points: undefined,
					srcChains: undefined,
					dstChains: undefined,
				});
				const result = await fetchWallet(
					address,
					concurrentFetches,
					tokensPrices,
				);
				updateWallet(address, result);
			} catch (err) {
				console.error(err);
				updateWallet(address, {
					txns: null,
					days: null,
					weeks: null,
					months: null,
					volume: null,
					rank: null,
					points: null,
					srcChains: null,
					dstChains: null,
				});
			}
		}),
		concurrentWallets,
		setProgress,
	);
}

type TokenPrice = {
	id: string;
	ticker: string;
	price: number;
};

const updateTokenPrices = async (tokens: TokenPrice[]) => {
	const updates = await Promise.all(
		tokens.map(async token =>
			token.price === 0
				? axios
						.get('https://api.coingecko.com/api/v3/simple/price', {
							params: { ids: token.id, vs_currencies: 'usd' },
						})
						.then(resp => ({
							...token,
							price: parseFloat(resp.data?.[token.id]?.usd || '0'),
						}))
						.catch(() => token)
				: token,
		),
	);
	Object.assign(tokens, updates);
};
