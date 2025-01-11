import type { DateFrame } from '@/types/wallet';

export type OrbiterWallet = {
	id: number;
	address: string;
	txns?: number | null;
	volume?: number | null;
	rank?: number | null;
	points?: number | null;
	srcChains?: { id: number; txns: number }[] | null;
	dstChains?: { id: number; txns: number }[] | null;
	days?: DateFrame | null;
	weeks?: DateFrame | null;
	months?: DateFrame | null;
};

export type OrbiterTxn = {
	sourceChain: string;
	targetChain: string;
	sourceSymbol: string;
	sourceAmount: string;
	sourceTime: string;
};

export type OrbiterTxnResponse = {
	message: string;
	result: {
		count: number;
		limit: number;
		offset: number;
		rows: OrbiterTxn[];
	};
	status: string;
};

export type OrbiterRankResponse = {
	code: number;
	result: {
		point: string;
		rank: number;
	};
};
