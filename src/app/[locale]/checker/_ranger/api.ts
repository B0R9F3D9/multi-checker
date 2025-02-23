import axios from 'axios';

import {
	generateUUID4,
	getWeekStart,
	promiseAll,
	sortByDate,
} from '@/lib/utils';
import type { Wallet } from '@/types/wallet';

import type {
	RangerLeaderboard,
	RangerRefferal,
	RangerTrade,
	RangerTradeHistory,
	RangerWallet,
} from './types';

async function getLeaderboard(): Promise<RangerLeaderboard> {
	const resp = await axios.get<RangerLeaderboard>(
		'/api/checker/ranger/leaderboard',
	);
	return resp.data;
}

async function getReferrals(address: string): Promise<RangerRefferal[]> {
	const resp = await axios.get<RangerRefferal[]>(
		`/api/checker/ranger/referrals?address=${address}`,
	);
	return resp.data;
}

async function getWsToken(address: string) {
	const resp = await axios.get<string>(
		`/api/checker/ranger/token?address=${address}`,
	);
	return resp.data;
}

async function getTradeHistory(address: string): Promise<RangerTrade[]> {
	const token = await getWsToken(address);
	if (!token) throw new Error('Failed to get ws token.');

	return new Promise((resolve, reject) => {
		const id = generateUUID4();
		const ws = new WebSocket('wss://ranger.hasura.app/v1/graphql', [
			'graphql-transport-ws',
		]);

		ws.onopen = () => {
			ws.send(
				JSON.stringify({
					type: 'connection_init',
					payload: { headers: { Authorization: `Bearer ${token}` } },
				}),
			);

			ws.send(
				JSON.stringify({
					id,
					type: 'subscribe',
					payload: {
						variables: { solanaAddress: address },
						extensions: {},
						operationName: 'Subscription',
						query:
							'subscription Subscription($solanaAddress: String!) {\n  trade_history(\n    where: {user_id: {_eq: $solanaAddress}}\n    order_by: {created_at: desc}\n  ) {\n    ...TradeHistory\n    __typename\n  }\n}\n\nfragment TradeHistory on trade_history {\n  slot\n  realized_pnl\n  created_at\n  platform\n  side\n  fees_paid\n  quantity\n  entry_price\n  symbol\n  __typename\n}',
					},
				}),
			);
		};

		ws.onmessage = (e: MessageEvent) => {
			const messageData: RangerTradeHistory = JSON.parse(e.data as string);
			if (messageData?.id === id) {
				ws.close();
				resolve(messageData.payload.data.trade_history);
			}
		};

		ws.onerror = (error: Event) => {
			ws.close();
			reject(error);
		};
	});
}

function processTrades(trades: RangerTrade[]): Partial<RangerWallet> {
	const result = {
		trades: trades.length,
		pnl: 0,
		tradesVolume: 0,
		fees: 0,
		days: [{ date: '', txns: 0 }],
		weeks: [{ date: '', txns: 0 }],
		months: [{ date: '', txns: 0 }],
	};

	for (const trade of trades) {
		result.tradesVolume += trade.quantity * trade.entry_price;
		result.pnl += trade.realized_pnl;
		result.fees += trade.fees_paid;

		const date = new Date(trade.created_at).toISOString().split('T')[0];
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

async function fetchWallet(
	address: string,
	leaderboard: RangerLeaderboard,
	_concurrentFetches: number,
): Promise<Partial<RangerWallet>> {
	let result: Partial<RangerWallet> = {};

	try {
		const leaderboardPos = leaderboard.data.find(w => w.wallet === address);
		if (!leaderboardPos) throw new Error('Wallet not found in leaderboard.');
		result.rank = leaderboardPos.position;
		result.leaderboardVolume = leaderboardPos.trade_volume;
	} catch (err) {
		console.error(err);
		result.rank = null;
		result.leaderboardVolume = null;
	}

	try {
		const referals = await getReferrals(address);
		result.referals = referals
			.sort((r1, r2) => r2.trading_volume - r1.trading_volume)
			.map(r => ({
				address: r.user_id,
				volume: r.trading_volume,
			}));
		result.refVolume = referals.reduce((acc, r) => acc + r.trading_volume, 0);
	} catch (err) {
		console.error(err);
		result.referals = null;
		result.refVolume = null;
	}

	try {
		const tradeHistory = await getTradeHistory(address);
		result = { ...result, ...processTrades(tradeHistory) };
	} catch (err) {
		console.error(err);
		result.trades = null;
		result.tradesVolume = null;
		result.pnl = null;
		result.fees = null;
		result.days = null;
		result.weeks = null;
		result.months = null;
	}

	return result;
}

export async function fetchWallets(
	addresses: string[],
	concurrentFetches: number,
	concurrentWallets: number,
	updateWallet: (address: string, wallet: Partial<Wallet>) => void,
	setProgress?: (progress: number) => void,
) {
	const leaderboard = await getLeaderboard();
	await promiseAll(
		addresses.map(address => async () => {
			try {
				updateWallet(address, {
					trades: undefined,
					rank: undefined,
					leaderboardVolume: undefined,
					tradesVolume: undefined,
					referals: undefined,
					refVolume: undefined,
					pnl: undefined,
					fees: undefined,
					days: undefined,
					weeks: undefined,
					months: undefined,
				});
				const result = await fetchWallet(
					address,
					leaderboard,
					concurrentFetches,
				);
				updateWallet(address, result);
			} catch (err) {
				console.error(err);
				updateWallet(address, {
					trades: null,
					rank: null,
					leaderboardVolume: null,
					tradesVolume: null,
					referals: null,
					refVolume: null,
					pnl: null,
					fees: null,
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
