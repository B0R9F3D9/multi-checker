import axios from 'axios';
import { type ClassValue, clsx } from 'clsx';
import { keccak256 } from 'js-sha3';

import { PROJECTS } from '@/constants';

export function cn(...inputs: ClassValue[]) {
	return clsx(inputs);
}

export function splitAddresses(addresses: string): string[] {
	const separators = /[\n\r,;\t ]+/;
	return addresses.trim().replace(separators, '\n').split(separators);
}

export function promiseAll<T>(
	tasks: (() => Promise<T>)[],
	taskLimit: number,
	setProgress?: (progress: number) => void,
	maxPerMinute?: number,
): Promise<T[]> {
	if (tasks.length === 0) return Promise.resolve([]);
	const results: T[] = [];
	let runningTasks = 0;
	let currentIndex = 0;
	let completedTasks = 0;
	let taskCountInMinute = 0;
	let startTime = Date.now();

	setProgress?.(0);

	const waitForNextMinute = async () => {
		const elapsedTime = Date.now() - startTime;
		if (elapsedTime < 60000) {
			await new Promise(resolve => setTimeout(resolve, 60000 - elapsedTime));
		}
		startTime = Date.now();
		taskCountInMinute = 0;
	};

	return new Promise((resolve, reject) => {
		const next = async () => {
			if (completedTasks >= tasks.length) {
				resolve(results);
				return;
			}

			if (runningTasks >= taskLimit || currentIndex >= tasks.length) {
				return;
			}

			if (maxPerMinute && taskCountInMinute >= maxPerMinute) {
				await waitForNextMinute();
			}

			const taskIndex = currentIndex++;
			const task = tasks[taskIndex];

			runningTasks++;
			taskCountInMinute++;
			task()
				.then(result => (results[taskIndex] = result))
				.catch(err => reject(err))
				.finally(() => {
					runningTasks--;
					completedTasks++;
					setProgress?.((completedTasks / tasks.length) * 100);
					next();
				});

			next();
		};

		for (let i = 0; i < Math.min(taskLimit, tasks.length); i++) {
			next();
		}
	});
}

export async function getTokenPrice(ticker: string) {
	if (ticker.includes('USD')) return 1;
	const resp = await axios.get('https://api.binance.com/api/v1/ticker/price', {
		params: { symbol: ticker + 'USDT' },
	});
	return parseFloat(resp.data.price!);
}

export function getProject(name: string) {
	return PROJECTS.find(project => project.path.split('/')[2] === name);
}

export function generateUUID4(): string {
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
		const r = (Math.random() * 16) | 0;
		const v = c === 'x' ? r : (r & 0x3) | 0x8;
		return v.toString(16);
	});
}

export function getWeekStart(date: string) {
	const d = new Date(date);
	d.setUTCDate(d.getUTCDate() - d.getUTCDay() + 1);
	return d.toISOString().split('T')[0];
}

export function base58Decode(input: string): Uint8Array {
	const BASE58_ALPHABET =
		'123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
	const base = BASE58_ALPHABET.length;
	const result: number[] = [];

	for (const char of input) {
		const charIndex = BASE58_ALPHABET.indexOf(char);
		if (charIndex === -1) {
			throw new Error(`Invalid base58 character: ${char}`);
		}

		let carry = charIndex;
		for (let j = 0; j < result.length; ++j) {
			const value = result[j] * base + carry;
			result[j] = value & 0xff;
			carry = value >> 8;
		}

		while (carry > 0) {
			result.push(carry & 0xff);
			carry >>= 8;
		}
	}

	for (const char of input) {
		if (char === BASE58_ALPHABET[0]) {
			result.push(0);
		} else {
			break;
		}
	}

	return new Uint8Array(result.reverse());
}

export function toChecksumAddress(address: string): string {
	if (!/^0x[a-fA-F0-9]{40}$/.test(address)) return address;

	const lowercaseAddress = address.toLowerCase().replace(/^0x/, '');
	const hash = keccak256(lowercaseAddress);

	let checksumAddress = '0x';
	for (let i = 0; i < lowercaseAddress.length; i++) {
		const char = lowercaseAddress[i];
		const hashChar = parseInt(hash[i], 16);
		if (hashChar > 7) checksumAddress += char.toUpperCase();
		else checksumAddress += char;
	}
	return checksumAddress;
}

export function sortByDate(a: { date: string }, b: { date: string }) {
	return new Date(a.date).getTime() - new Date(b.date).getTime();
}
