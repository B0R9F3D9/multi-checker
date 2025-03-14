import type { DateFrame } from '@/types/wallet';

export type JumperWallet = {
	id: number;
	address: string;
	txns?: number | null;
	volume?: number | null;
	rank?: number | null;
	points?: number | null;
	srcChains?: { id: number; txns: number }[] | null;
	dstChains?: { id: number; txns: number }[] | null;
	protocols?: { name: string; txns: number; id: string }[] | null;
	days?: DateFrame | null;
	weeks?: DateFrame | null;
	months?: DateFrame | null;
};

type JumperToken = {
	amount: string;
	amountUSD: string;
	chainId: number;
	timestamp: number;
};

export type JumperTxn = {
	sending: JumperToken;
	receiving: JumperToken;
	tool: string;
};

export type JumperTxnResponse = {
	transfers: JumperTxn[];
};

export type JumperRankPointsResponse = {
	status: number;
	data: {
		id: string;
		walletAddress: string;
		points: string;
		position: string;
	};
	message: string;
	meta: {
		timestamp: string;
		path: string;
		method: string;
	};
};
