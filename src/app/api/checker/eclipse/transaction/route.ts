import axios, { type AxiosError } from 'axios';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import type {
	EclipseResponse,
	EclipseTxn,
} from '@/app/[locale]/checker/eclipse/types';

export async function GET(req: NextRequest) {
	const address = req.url.split('?')[1].split('=')[1].split('&')[0];
	const page = req.url.split('?')[1].split('=')[2];

	try {
		const resp = await axios.get<
			EclipseResponse<{ transactions: EclipseTxn[] }>
		>('https://api.eclipsescan.xyz/v1/account/transaction', {
			params: {
				address,
				page,
				page_size: 40,
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
