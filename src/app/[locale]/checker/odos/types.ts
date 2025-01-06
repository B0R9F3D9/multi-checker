import type { DateFrame } from '@/types/wallet';

export type OdosWallet = {
	id: number;
	address: string;
	txns?: number | null;
	chains?: { id: number; txns: number }[];
	tokens?: number;
	volume?: number | null;
	days?: DateFrame | null;
	weeks?: DateFrame | null;
	months?: DateFrame | null;
};

type OdosToken = {
	amount: string;
	amount_usd: number;
	token_address: string;
	token_decimals: number;
	usd_price: number;
};

export type OdosTxn = {
	block_time: string;
	chain_id: number;
	hash: string;
	inputs: OdosToken[];
	outputs: OdosToken[];
	success: boolean;
	order: number;
};

export type OdosTxnResponse = {
	totalCount: number;
	transactions: OdosTxn[];
};
