import axios from 'axios';
import { type ClassValue, clsx } from 'clsx';

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
	limit: number,
	setProgress?: (progress: number) => void,
): Promise<T[]> {
	const results: T[] = [];
	let runningTasks = 0;
	let currentIndex = 0;
	let completedTasks = 0;
	setProgress?.(0);

	return new Promise((resolve, reject) => {
		const next = () => {
			if (currentIndex === tasks.length && runningTasks === 0) {
				resolve(results);
				return;
			}

			if (runningTasks >= limit || currentIndex >= tasks.length) {
				return;
			}

			const taskIndex = currentIndex++;
			const task = tasks[taskIndex];

			runningTasks++;
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

		for (let i = 0; i < limit; i++) {
			next();
		}
	});
}

export async function getEthPrice(): Promise<number> {
	const resp = await axios.get('https://api.binance.com/api/v1/ticker/price', {
		params: { symbol: 'ETHUSDT' },
	});
	return parseFloat(resp.data.price!);
}

export function getProject(name: string) {
	return PROJECTS.find(project => project.name.toLowerCase() === name);
}

export function generateUUID(): string {
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
		const r = (Math.random() * 16) | 0;
		const v = c === 'x' ? r : (r & 0x3) | 0x8;
		return v.toString(16);
	});
}
