import * as React from 'react';
import { MdTouchApp } from 'react-icons/md';

import {
	HoverCard,
	HoverCardContent,
	HoverCardTrigger,
} from '@/components/ui/hover-card';

import { getSolScanButton } from './utils';

export function ReferralsComponent(
	referrals: { address: string; volume: number }[],
) {
	if (!referrals || referrals.length === 0) {
		return <p className="flex justify-center items-center">0</p>;
	}

	return (
		<div className="flex flex-row items-center gap-2 relative">
			<p className="lg:hidden">{referrals.length}</p>

			<div className="hidden lg:block">
				<HoverCard>
					<HoverCardTrigger>
						<p className="cursor-pointer flex flex-row items-center gap-1">
							{referrals.length}
							<MdTouchApp />
						</p>
					</HoverCardTrigger>
					<HoverCardContent className="p-4 rounded-lg shadow-md min-h-fit max-h-40">
						<div className="flex flex-col gap-3 overflow-y-auto max-h-36">
							{referrals.map((referral, index) => (
								<div
									key={index}
									className="flex flex-row items-center justify-between gap-3"
								>
									<div className="flex flex-row items-center gap-2">
										<div className="w-8 h-8 flex-shrink-0 flex items-center justify-center overflow-hidden">
											<div className="scale-75 origin-center">
												{getSolScanButton(referral.address)}
											</div>
										</div>
										<div className="text-md font-semibold truncate max-w-[120px]">
											{referral.address.slice(0, 4)}...
											{referral.address.slice(-4)}
										</div>
										<div className="text-sm">
											:{' '}
											{referral.volume.toLocaleString('en-US', {
												style: 'currency',
												currency: 'USD',
											})}
										</div>
									</div>
								</div>
							))}
						</div>
					</HoverCardContent>
				</HoverCard>
			</div>
		</div>
	);
}
