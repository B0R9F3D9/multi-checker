import type { DateFrame } from '@/types/wallet';

export type MonadWallet = {
	id: number;
	address: string;
	txns?: number | null;
	balance?: number | null;
	contracts?: number | null;
	fee?: number | null;
	days?: DateFrame | null;
	weeks?: DateFrame | null;
	months?: DateFrame | null;
};

export type MonadTxn = {
	addTokens: object[];
	from: string;
	hash: string;
	isContract: boolean;
	subTokens: object[];
	timestamp: number;
	to: string;
	tokenApproval: object | null;
	transactionAddress: string;
	transactionFee: string;
	txContract: object[];
	txName: string;
	txStatus: number;
};

export type MonadTxnResponse = {
	code: number;
	reason: string;
	message: string;
	result: {
		data: MonadTxn[];
		nextPageCursor: string | null;
		total: number;
	} | null;
};

export type MonadBalanceResponse = {
	code: number;
	reason: string;
	message: string;
	result: {
		data: {
			balance: string;
			contractAddress: string;
			decimal: number;
			imageURL: string;
			name: string;
			price: string;
			symbol: string;
			verified: boolean;
		}[];
		firstSeen: number;
		total: number;
		usdValue: number;
	};
};
