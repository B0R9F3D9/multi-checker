import type { DateFrame } from '@/types/wallet';

export type RangerWallet = {
	id: number;
	address: string;
	trades?: number | null;
	rank?: number | null;
	leaderboardVolume?: number | null;
	tradesVolume?: number | null;
	referals?: { address: string; volume: number }[] | null;
	refVolume?: number | null;
	pnl?: number | null;
	fees?: number | null;
	days?: DateFrame | null;
	weeks?: DateFrame | null;
	months?: DateFrame | null;
};

export type RangerLeaderboard = {
	data: {
		position: number;
		rank_name: string;
		trade_volume: number;
		wallet: string;
	}[];
};

export type RangerRefferal = {
	id: string;
	user_id: string;
	referer_id: string;
	referred_status: string;
	trading_volume: number;
	total_rewards: number;
	last_trade_at: string;
	date_joined: string;
};

type RangerWsResponse<T> = {
	id: string;
	payload: T;
	type?: string;
};

export type RangerTrade = {
	created_at: string;
	entry_price: number;
	fees_paid: number;
	platform: 'JUPITER' | 'FLASH' | 'DRIFT' | 'ZETA';
	quantity: number;
	realized_pnl: number;
	side: 'Long' | 'Short';
	slot: number;
	symbol: string;
};

export type RangerTradeHistory = RangerWsResponse<{
	data: {
		trade_history: RangerTrade[];
	};
}>;
