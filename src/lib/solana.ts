import axios from 'axios';

import type { DatabaseService } from './db';
import { generateUUID4, promiseAll } from './utils';

type HeliusRpcResponse<T> = {
	id: string;
	jsonrpc: string;
	result: T;
};

type HeliusSignature = {
	blockTime: number;
	confirmaionStatus: string;
	err: {
		[key: string]:
			| {
					[key: string]: number;
			  }[]
			| number[];
	} | null;
	signature: string;
	slot: number;
};

type HeliusTxnToken = {
	acountIndex: number;
	mint: string;
	owner: string;
	programId: string;
	uiTokenAmount: {
		amount: string;
		decimals: number;
		uiAmount: string;
		uiAmountString: string;
	};
};

export type HeliusTxn = {
	blockTime: number;
	meta: {
		computeUnitsConsumed: number;
		fee: number;
		innerInstructions: {
			index: number;
			instuctions: {
				parsed: {
					info: any;
					type: string;
				};
				program: string;
				programId: string;
				stackHeight: number;
			}[];
		}[];
		logMessages: string[];
		postBalances: number[];
		postTokenBalances: HeliusTxnToken[];
		preBalances: number[];
		preTokenBalances: HeliusTxnToken[];
		rewards: number[];
		status: {
			Ok: any;
		};
	};
	slot: number;
	transaction: {
		message: {
			accountKeys: {
				pubkey: string;
				signer: boolean;
				writable: boolean;
				source: string;
			}[];
			addressTableLookups: any[];
			instructions: {
				accounts?: string[];
				data?: string;
				parsed?: {
					info: any;
					type: string;
				};
				program?: string;
				programId: string;
				stackHeight: number;
			}[];
			recentBlockhash: string;
		};
		signatures: string[];
	};
	version: number | string;
};

async function getSignatures(
	address: string,
	before?: string,
	// txns: HeliusSignature[] = [],
): Promise<{ signatures: HeliusSignature[]; haveMore: boolean }> {
	const resp = await axios.post<HeliusRpcResponse<HeliusSignature[]>>(
		'https://grateful-jerrie-fast-mainnet.helius-rpc.com/',
		{
			id: generateUUID4(),
			jsonrpc: '2.0',
			method: 'getSignaturesForAddress',
			params: before ? [address, { before }] : [address, {}],
		},
	);
	return {
		signatures: resp.data.result.filter(txn => txn.err === null),
		haveMore: resp.data.result.length === 1000,
	};
	// txns.push(...resp.data.result!);
	// if (resp.data.result.length === 1000)
	// 	return await getSignatures(address, resp.data.result[999].signature, txns);
	// return txns.filter(txn => txn.err === null);
}

async function fetchTxnsBatch(txnHashes: HeliusSignature[]) {
	const requests = txnHashes.map(txnHash => ({
		id: generateUUID4(),
		jsonrpc: '2.0',
		method: 'getTransaction',
		params: [
			txnHash.signature,
			{ encoding: 'jsonParsed', maxSupportedTransactionVersion: 0 },
		],
	}));

	const resp = await axios.post<HeliusRpcResponse<HeliusTxn>[]>(
		'https://grateful-jerrie-fast-mainnet.helius-rpc.com/',
		requests,
	);

	return resp.data!.map(txn => txn.result);
}

export async function getTxns(
	address: string,
	concurrentFetches: number,
	lastCachedHash?: string,
): Promise<HeliusTxn[]> {
	let { signatures, haveMore } = await getSignatures(address);
	if (signatures.length === 0 || signatures[0].signature === lastCachedHash)
		return [];

	while (haveMore) {
		const response = await getSignatures(
			address,
			signatures[signatures.length - 1].signature,
		);
		signatures = [...signatures, ...response.signatures];
		haveMore = response.haveMore;
	}

	const batches = [];
	for (let i = 0; i < signatures.length; i += 250) {
		batches.push(signatures.slice(i, i + 250));
	}

	const tasks = batches.map(batch => async () => await fetchTxnsBatch(batch));
	return (await promiseAll(tasks, concurrentFetches)).flat();
}
