import type { DateFrame } from '@/types/wallet';

export type MayanWallet = {
	id: number;
	address: string;
	txns?: number | null;
	days?: DateFrame | null;
	weeks?: DateFrame | null;
	months?: DateFrame | null;
	volume?: number | null;
	srcChains?: { name: string; txns: number }[] | null;
	dstChains?: { name: string; txns: number }[] | null;
};

export type MayanTxn = {
	sourceChain: string;
	destChain: string;
	fromAmount: string;
	fromTokenPrice: string;
	fromTokenSymbol: string;
	toTokenSymbol: string;
	initiatedAt: string;
};

export type MayanResponse = {
	data: MayanTxn[];
	metadata: {
		count: number;
		volume: number;
	};
};
