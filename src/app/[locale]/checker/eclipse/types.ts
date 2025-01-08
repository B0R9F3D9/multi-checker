import type { DateFrame } from '@/types/wallet';

export type EclipseWallet = {
	id: number;
	address: string;
	txns?: number | null;
	taps?: number | null;
	domain?: string | null;
	balance?: number | null;
	volume?: number | null;
	fee?: number | null;
	days?: DateFrame | null;
	weeks?: DateFrame | null;
	months?: DateFrame | null;
};

export type EclipseTapsResponse = {
	jsonrpc: string;
	result: {
		context: {
			apiVersion: string;
			slot: number;
		};
		value: {
			data: string[];
			executable: boolean;
			lamports: number;
			owner: string;
		} | null;
	};
	id: string;
};

export type EclipseTxn = {
	blockTime: number;
	txHash: string;
	fee: number;
	status: string;
	signer: string[];
	sol_value: string;
	programIds: string[];
};

type EclipseInstruction = {
	accounts: string[];
	program_id: string;
	transfers: {
		amount: number;
		destination: string;
		event: string;
		source_owner: string;
	}[];
};

export type EclipseTxnDetail = {
	parsed_instructions: EclipseInstruction[];
	program_id: string;
};

export type EclipseAccount = {
	account: string;
	lamports: number;
};

export type EclipseDomain = {
	favorite: string;
	items: {
		name: string;
		address: string;
		class: string;
		isSubdomain: boolean;
		program: string;
	}[];
};

export type EclipseResponse<T> = {
	success: boolean;
	errors?: {
		message: string;
	};
	data?: T | null;
	metadata?: {
		tokens: {
			string: {
				token_address: string;
				token_decimals: number;
				token_type: string;
				token_name?: string;
				token_symbol?: string;
				token_icon?: string;
				price_usdt?: number | null;
			};
		};
	};
};
