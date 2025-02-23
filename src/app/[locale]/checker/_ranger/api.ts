import axios from 'axios';

import { promiseAll } from '@/lib/utils';
import type { Wallet } from '@/types/wallet';

import type { RangerLeaderboard, RangerRefferal, RangerWallet } from './types';

async function getReferrals(address: string): Promise<RangerRefferal[]> {
	const resp = await axios.get<RangerRefferal[]>(
		`/api/checker/ranger/referrals?address=${address}`,
	);

	return resp.data;
}

async function getLeaderboard(): Promise<RangerLeaderboard> {
	const resp = await axios.get<RangerLeaderboard>(
		'/api/checker/ranger/leaderboard',
	);

	return resp.data;
}

async function fetchWallet(
	address: string,
	leaderboard: RangerLeaderboard,
	_concurrentFetches: number,
): Promise<Partial<RangerWallet>> {
	const leaderboardPos = leaderboard.data.find(w => w.wallet === address);
	if (!leaderboardPos) throw new Error('Wallet not found in leaderboard.');

	const result: Partial<RangerWallet> = {
		rank: leaderboardPos.position,
		volume: leaderboardPos.trade_volume,
	};

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
					rank: undefined,
					volume: undefined,
					referals: undefined,
					refVolume: undefined,
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
					rank: null,
					volume: null,
					referals: null,
					refVolume: null,
				});
			}
		}),
		concurrentWallets,
		setProgress,
	);
}
