import Image from 'next/image';
import * as React from 'react';
import { MdTouchApp } from 'react-icons/md';

import {
	HoverCard,
	HoverCardContent,
	HoverCardTrigger,
} from '@/components/ui/hover-card';
import { CHAINS } from '@/constants';

export function ChainsComponent(
	chains: { id: number; txns: number }[],
	idKey: string = 'id',
) {
	if (!chains || chains?.length === 0) {
		return <p className="flex justify-center items-center">0</p>;
	}

	return (
		<div className="flex flex-row items-center gap-2 relative">
			<div className="flex flex-row items-center gap-2 relative">
				<div className="lg:hidden flex flex-row items-center gap-2 max-w-20">
					<p>{chains.length}</p>
					<div className="flex flex-row items-center gap-0 overflow-x-auto max-w-full">
						{chains!.map(chain => {
							const chainData = CHAINS.find(
								c => (c[idKey as keyof typeof c] || c.id) === chain.id,
							);
							if (!chainData) {
								console.debug('chain not found', chain);
								return null;
							}
							return (
								<div key={chain.id} className="w-6 h-6 flex-shrink-0">
									<Image
										src={chainData!.image}
										className="rounded-full"
										alt={chainData!.name}
										width={24}
										height={24}
										title={chainData!.name}
									/>
								</div>
							);
						})}
					</div>
				</div>
			</div>

			<div className="hidden lg:block">
				<HoverCard>
					<HoverCardTrigger>
						<p className="cursor-pointer flex flex-row items-center gap-1">
							{chains.length}
							<MdTouchApp />
						</p>
					</HoverCardTrigger>
					<HoverCardContent className="p-4 rounded-lg shadow-md min-h-fit max-h-40 max-w-fit">
						<div className="flex flex-col gap-2 overflow-y-auto max-h-36">
							{chains!.map(chain => {
								const chainData = CHAINS.find(
									c => (c[idKey as keyof typeof c] || c.id) === chain.id,
								);
								if (!chainData) {
									console.debug('chain not found', chain);
									return null;
								}
								return (
									<div
										key={chain.id}
										className="flex flex-row items-center gap-2"
									>
										<Image
											src={chainData!.image}
											id={String(chain.id)}
											className="rounded-full"
											alt={chainData!.name}
											width={24}
											height={24}
											title={chainData!.name}
										/>
										<div className="flex flex-row items-center gap-1">
											<div className="text-md font-semibold capitalize">
												{chainData?.name || chain.id.toString()}:
											</div>
											<div className="text-sm">{chain.txns}</div>
										</div>
									</div>
								);
							})}
						</div>
					</HoverCardContent>
				</HoverCard>
			</div>
		</div>
	);
}
