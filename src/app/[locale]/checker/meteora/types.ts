import type { DateFrame } from '@/types/wallet';

export type MeteoraWallet = {
	id: number;
	address: string;
	txns?: number | null;
	positions?: number | null;
	fees?: number | null;
	days?: DateFrame | null;
	weeks?: DateFrame | null;
	months?: DateFrame | null;
};

export type MeteoraPair = {
	address: string;
	name: string;
	mint_x: string;
	mint_y: string;
	reserve_x: string;
	reserve_y: string;
	reserve_x_amount: number;
	reserve_y_amount: number;
	bin_step: number;
	base_fee_percentage: string;
	max_fee_percentage: string;
	protocol_fee_percentage: string;
	liquidity: string;
	reward_mint_x: string;
	reward_mint_y: string;
	fees_24h: number;
	today_fees: number;
	trade_volume_24h: number;
	cumulative_trade_volume: string;
	cumulative_fee_volume: string;
	current_price: number;
	apr: number;
	apy: number;
	farm_apr: number;
	farm_apy: number;
	hide: boolean;
};

export type MeteoraPosition = {
	tx_id: string;
	position_address: string;
	pair_address: string;
	token_x_amount: number;
	token_y_amount: number;
	token_x_usd_amount: number;
	token_y_usd_amount: number;
	onchain_timestamp: number;
};
