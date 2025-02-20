// eslint-disable-next-line @typescript-eslint/no-unused-vars
import axios, { type AxiosError } from 'axios';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import type {
	EclipseResponse,
	EclipseTxnDetail,
} from '@/app/[locale]/checker/_eclipse/types';

export async function GET(req: NextRequest) {
	const tx = req.url.split('?')[1].split('=')[1];

	try {
		const resp = await axios.get<
			EclipseResponse<{ transactions: EclipseTxnDetail[] }>
		>('https://api.eclipsescan.xyz/v1/transaction/detail', {
			params: {
				tx,
			},
			headers: {
				Referer: 'https://eclipsescan.xyz',
			},
		});

		if (!resp.data.success || resp.data.errors)
			throw new Error(resp.data.errors!.message);

		return NextResponse.json(resp.data);
	} catch (error: AxiosError | any) {
		return NextResponse.json(
			{ status: error.status || undefined, message: error.message },
			{ status: 500 },
		);
	}
}
