import axios from 'axios';

import { getWeekStart, promiseAll, solanaAddressToBytea } from '@/lib/utils';
import type { Wallet } from '@/types/wallet';

import type { HyperlaneResponse, HyperlaneTxn, HyperlaneWallet } from './types';

async function getTxns(address: string): Promise<HyperlaneTxn[]> {
	const resp = await axios.post<HyperlaneResponse>(
		'https://explorer4.hasura.app/v1/graphql',
		{
			query:
				'query ($search: bytea, $originChains: [Int!], $destinationChains: [Int!], $startTime: timestamp, $endTime: timestamp) @cached(ttl: 5) {\n  q0: message_view(\n    where: {_and: [{sender: {_eq: $search}}]}\n    order_by: {id: desc}\n    limit: 10000\n  ) {\n    id\n    msg_id\n    nonce\n    sender\n    recipient\n    is_delivered\n    send_occurred_at\n    delivery_occurred_at\n    delivery_latency\n    origin_chain_id\n    origin_domain_id\n    origin_tx_id\n    origin_tx_hash\n    origin_tx_sender\n    destination_chain_id\n    destination_domain_id\n    destination_tx_id\n    destination_tx_hash\n    destination_tx_sender\n    __typename\n  }\n  q1: message_view(\n    where: {_and: [{recipient: {_eq: $search}}]}\n    order_by: {id: desc}\n    limit: 50\n  ) {\n    id\n    msg_id\n    nonce\n    sender\n    recipient\n    is_delivered\n    send_occurred_at\n    delivery_occurred_at\n    delivery_latency\n    origin_chain_id\n    origin_domain_id\n    origin_tx_id\n    origin_tx_hash\n    origin_tx_sender\n    destination_chain_id\n    destination_domain_id\n    destination_tx_id\n    destination_tx_hash\n    destination_tx_sender\n    __typename\n  }\n  q2: message_view(\n    where: {_and: [{origin_tx_sender: {_eq: $search}}]}\n    order_by: {id: desc}\n    limit: 50\n  ) {\n    id\n    msg_id\n    nonce\n    sender\n    recipient\n    is_delivered\n    send_occurred_at\n    delivery_occurred_at\n    delivery_latency\n    origin_chain_id\n    origin_domain_id\n    origin_tx_id\n    origin_tx_hash\n    origin_tx_sender\n    destination_chain_id\n    destination_domain_id\n    destination_tx_id\n    destination_tx_hash\n    destination_tx_sender\n    __typename\n  }\n  q3: message_view(\n    where: {_and: [{destination_tx_sender: {_eq: $search}}]}\n    order_by: {id: desc}\n    limit: 50\n  ) {\n    id\n    msg_id\n    nonce\n    sender\n    recipient\n    is_delivered\n    send_occurred_at\n    delivery_occurred_at\n    delivery_latency\n    origin_chain_id\n    origin_domain_id\n    origin_tx_id\n    origin_tx_hash\n    origin_tx_sender\n    destination_chain_id\n    destination_domain_id\n    destination_tx_id\n    destination_tx_hash\n    destination_tx_sender\n    __typename\n  }\n}',
			variables: {
				search: address.startsWith('0x')
					? '\\x' + address.toLowerCase().slice(2)
					: solanaAddressToBytea(address),
			},
		},
	);
	return [
		...resp.data.data.q0,
		...resp.data.data.q1,
		...resp.data.data.q2,
		...resp.data.data.q3,
	];
}

function parseResult(txns: HyperlaneTxn[]): Partial<HyperlaneWallet> {
	const result = {
		txns: txns.length,
		days: [{ date: '', txns: 0 }],
		weeks: [{ date: '', txns: 0 }],
		months: [{ date: '', txns: 0 }],
		srcChains: [{ id: 0, txns: 0 }],
		dstChains: [{ id: 0, txns: 0 }],
	};

	for (const txn of txns) {
		const srcChain = result.srcChains.find(
			chain => chain.id === txn.origin_chain_id,
		);
		if (srcChain) srcChain.txns += 1;
		else result.srcChains.push({ id: txn.origin_chain_id, txns: 1 });

		const dstChain = result.dstChains.find(
			chain => chain.id === txn.destination_chain_id,
		);
		if (dstChain) dstChain.txns += 1;
		else
			result.dstChains.push({
				id: txn.destination_chain_id,
				txns: 1,
			});

		const date = txn.send_occurred_at.split('T')[0];
		const day = result.days.find(day => day.date === date);
		if (day) day.txns += 1;
		else result.days.push({ date, txns: 1 });

		const weekDate = getWeekStart(date);
		const week = result.weeks.find(week => week.date === weekDate);
		if (week) week.txns += 1;
		else result.weeks.push({ date: weekDate, txns: 1 });

		const month = result.months.find(month => month.date === date.slice(0, 7));
		if (month) month.txns += 1;
		else result.months.push({ date: date.slice(0, 7), txns: 1 });
	}

	result.srcChains = result.srcChains
		.filter(item => item.id !== 0)
		.sort((a, b) => b.txns - a.txns);
	result.dstChains = result.dstChains
		.filter(item => item.id !== 0)
		.sort((a, b) => b.txns - a.txns);
	result.days = result.days
		.filter(item => item.date !== '')
		.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
	result.weeks = result.weeks
		.filter(item => item.date !== '')
		.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
	result.months = result.months
		.filter(item => item.date !== '')
		.sort(
			(a, b) =>
				new Date(a.date + '-01').getTime() - new Date(b.date + '-01').getTime(),
		);

	return result;
}

async function fetchWallet(address: string, concurrentFetches: number) {
	const txns = await getTxns(address);
	return parseResult(txns);
}

export async function fetchWallets(
	addresses: string[],
	concurrentFetches: number,
	concurrentWallets: number,
	updateWallet: (address: string, wallet: Partial<Wallet>) => void,
	setProgress?: (progress: number) => void,
) {
	await promiseAll(
		addresses.map(address => async () => {
			try {
				const result = await fetchWallet(address, concurrentFetches);
				updateWallet(address, result);
			} catch (err) {
				console.error(err);
				updateWallet(address, {
					txns: null,
					days: null,
					weeks: null,
					months: null,
					srcChains: null,
					dstChains: null,
				});
			}
		}),
		concurrentWallets,
		setProgress,
	);
}
