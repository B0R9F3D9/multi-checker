// eslint-disable-next-line @typescript-eslint/no-unused-vars
import axios, { AxiosError } from 'axios';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
	const address = req.url.split('?')[1].split('=')[1];

	try {
		const response = await axios.get(
			`https://api.jumper.exchange/v1/leaderboard/${address}`,
		);
		return NextResponse.json(response.data);
	} catch (error: AxiosError | any) {
		return NextResponse.json(
			{ status: error.status || undefined, message: error.message },
			{ status: 500 },
		);
	}
}
