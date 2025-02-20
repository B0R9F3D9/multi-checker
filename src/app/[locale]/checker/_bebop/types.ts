import type { DateFrame } from '@/types/wallet';

export type BebopWallet = {
	id: number;
	address: string;
	txns?: number | null;
	chains?: { id: number; txns: number }[] | null;
	volume?: number | null;
	days?: DateFrame | null;
	weeks?: DateFrame | null;
	months?: DateFrame | null;
};

type BebopToken = Record<string, { amount: string; amountUsd: number }>;

export type BebopTxn = {
	chain_id: number;
	txHash: string;
	status: string;
	sellTokens: BebopToken[];
	buyTokens: BebopToken[];
	volumeUsd: number;
	gasFeeUsd: number;
	timestamp: string;
};

export type BebopTxnResponse = {
	results: BebopTxn[];
	metadata: {
		timestamp: string;
		results: number;
		tokens: {
			[key: string]: {
				[key: string]: {
					name: string;
					symbol: string;
					decimals: number;
					displayDecimals: number;
					icon: string;
				};
			};
		};
	};
};
