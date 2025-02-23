export type RangerWallet = {
	id: number;
	address: string;
	rank?: number | null;
	volume?: number | null;
	referals?: { address: string; volume: number }[] | null;
	refVolume?: number | null;
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
