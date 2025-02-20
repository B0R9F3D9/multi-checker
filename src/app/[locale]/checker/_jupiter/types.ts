import type { DateFrame } from '@/types/wallet';

export type JupiterWallet = {
	id: number;
	address: string;
	txns?: number | null;
	srcVolume?: number | null;
	dstVolume?: number | null;
	tokens?: number | null;
	days?: DateFrame | null;
	weeks?: DateFrame | null;
	months?: DateFrame | null;
};

export type JupiterPriceResponse = {
	data: {
		[token: string]: {
			id: string;
			price: string;
			type: string;
		};
	};
	timeTaken: number;
};
