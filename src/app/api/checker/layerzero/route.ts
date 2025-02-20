// eslint-disable-next-line @typescript-eslint/no-unused-vars
import axios, { AxiosError } from 'axios';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

function generateSentryTrace() {
	function generateRandomString(length: number) {
		const chars = '0123456789abcdef';
		return new Array(length)
			.fill(null)
			.map(() => chars[Math.floor(Math.random() * chars.length)])
			.join('');
	}

	const part1 = generateRandomString(32);
	const part2 = generateRandomString(16);
	const part3 = generateRandomString(1);
	return `${part1}-${part2}-${part3}`;
}

export async function GET(req: NextRequest) {
	const address = req.url.split('?')[1].split('=')[1];

	try {
		const input = JSON.stringify({
			filters: {
				address,
				stage: 'mainnet',
				created: {
					lte: new Date().toISOString(),
					gte: new Date('2024-05-01T00:00:00.000Z').toISOString(),
				},
			},
		});

		const response = await axios.get(
			`https://layerzeroscan.com/api/trpc/messages.list?input=${encodeURIComponent(
				input,
			)}`,
			{
				headers: {
					Referer: `https://layerzeroscan.com/address/${address}`,
					'Sentry-Trace': generateSentryTrace(),
				},
			},
		);

		return NextResponse.json(response.data);
	} catch (error: AxiosError | any) {
		return NextResponse.json(
			{ status: error.status || undefined, message: error.message },
			{ status: 500 },
		);
	}
}
