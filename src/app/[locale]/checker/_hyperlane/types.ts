import type { DateFrame } from '@/types/wallet';

export type HyperlaneWallet = {
	id: number;
	address: string;
	txns?: number | null;
	days?: DateFrame | null;
	weeks?: DateFrame | null;
	months?: DateFrame | null;
	srcChains?: { id: number; txns: number }[] | null;
	dstChains?: { id: number; txns: number }[] | null;
};

export type HyperlaneTxn = {
	is_delivered: boolean;
	send_occurred_at: string;
	origin_chain_id: number;
	destination_chain_id: number;
	origin_tx_sender: string;
	origin_tx_hash: string;
};

export type HyperlaneResponse = {
	data: {
		q0: HyperlaneTxn[];
		q1: HyperlaneTxn[];
		q2: HyperlaneTxn[];
		q3: HyperlaneTxn[];
	};
};
