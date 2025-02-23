// eslint-disable-next-line @typescript-eslint/no-unused-vars
import axios, { AxiosError } from 'axios';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
	const address = req.url.split('?')[1].split('=')[1];

	try {
		const response = await axios.post(
			'https://www.app.ranger.finance/api/referral/get-referrals',
			{
				publicKey: address,
			},
			{
				headers: {
					Referer: 'https://www.app.ranger.finance/leaderboard',
					Origin: 'https://www.app.ranger.finance',
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
