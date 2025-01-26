import type { DateFrame } from '@/types/wallet';

export type PhoenixWallet = {
	id: number;
	address: string;
	txns?: number | null;
	volume?: number | null;
	pairs?: number | null;
	days?: DateFrame | null;
	weeks?: DateFrame | null;
	months?: DateFrame | null;
};

export type PhoenixTxn = {
	date: string;
	market: string;
	trade_direction: 'SELL' | 'BUY';
	price: number;
	base_units_filled: number;
	trade_type: 'TAKER' | 'MAKER';
	fees_paid_in_quote_units: number;
	slot: number;
	unix_timestamp: number;
	taker_transaction: string;
	maker_transaction: string;
};

export type PhoenixTxnsResponse = {
	url: string;
	repeat: boolean;
};
