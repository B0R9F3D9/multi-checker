import type { DateFrame } from '@/types/wallet';

export type LayerzeroWallet = {
	id: number;
	address: string;
	txns?: number | null;
	days?: DateFrame | null;
	weeks?: DateFrame | null;
	months?: DateFrame | null;
	srcChains?: { name: string; txns: number }[] | null;
	dstChains?: { name: string; txns: number }[] | null;
	protocols?: { id: string; name: string; txns: number }[] | null;
	contracts?: number | null;
};

export type LayerzeroTxn = {
	dstChainKey: string;
	srcChainKey: string;
	created: number;
	mainStatus: 'DELIVIRED' | 'INFLIGHT' | 'CONFIRMING';
	srcUaAddress: string;
	srcUaProtocol: {
		id: string;
		name: string;
	};
	dstUaProtocol: {
		id: string;
		name: string;
	};
};

export type LayerzeroResponse = {
	result: {
		data: {
			count: number;
			messages: LayerzeroTxn[];
		};
	};
};
