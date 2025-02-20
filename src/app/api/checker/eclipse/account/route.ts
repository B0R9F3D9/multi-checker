// eslint-disable-next-line @typescript-eslint/no-unused-vars
import axios, { AxiosError } from 'axios';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import type {
	EclipseAccount,
	EclipseResponse,
} from '@/app/[locale]/checker/_eclipse/types';

export async function GET(req: NextRequest) {
	const address = req.url.split('?')[1].split('=')[1];

	try {
		const resp = await axios.get<EclipseResponse<EclipseAccount>>(
			'https://api.eclipsescan.xyz/v1/account',
			{
				params: {
					address,
				},
				headers: {
					Referer: 'https://eclipsescan.xyz',
				},
			},
		);

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
