// eslint-disable-next-line @typescript-eslint/no-unused-vars
import axios, { AxiosError } from 'axios';
import { NextResponse } from 'next/server';

export async function GET() {
	try {
		const response = await axios.post(
			'https://www.app.ranger.finance/api/referral/get-leaderboard-rank',
			{
				granularity: 'all',
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
