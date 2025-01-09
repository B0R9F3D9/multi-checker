import Image from 'next/image';
import { MdTouchApp } from 'react-icons/md';

import { CHAINS } from '@/constants';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/ui/hover-card';

import type { HyperlaneWallet } from './types';

export function getChainsComponent(
	chains: HyperlaneWallet['srcChains'] | HyperlaneWallet['dstChains'],
) {
	if (chains?.length === 0 || !chains) {
		return <p className="flex justify-center items-center">0</p>;
	}

	return (
		<div className="flex flex-row items-center gap-2 relative">
			<div className="flex flex-row items-center gap-2 relative">
				<div className="lg:hidden flex flex-row items-center gap-2 max-w-20">
					<p>{chains!.length}</p>
					<div className="flex flex-row items-center gap-0 overflow-x-auto max-w-full">
						{chains!.map(chain => {
							const chainData = CHAINS.find(
								c => c.id.toString() === chain.name,
							);
							if (!chainData) return null;
							return (
								<div key={chain.name} className="w-6 h-6 flex-shrink-0">
									<Image
										src={chainData.image}
										className="rounded-full"
										alt={chainData.name}
										width={24}
										height={24}
										title={chainData.name.replace(/^\w/, c => c.toUpperCase())}
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
							{chains!.length}
							<MdTouchApp />
						</p>
					</HoverCardTrigger>
					<HoverCardContent className="p-4 rounded-lg shadow-md min-h-fit max-h-40 max-w-fit">
						<div className="flex flex-col gap-2 overflow-y-auto max-h-36">
							{chains!.map(chain => {
								const chainData = CHAINS.find(
									c => c.id.toString() === chain.name,
								);
								if (!chainData) return null;
								return (
									<div
										key={chain.name}
										className="flex flex-row items-center gap-2"
									>
										<Image
											src={chainData.image}
											className="rounded-full"
											alt={chainData.name}
											width={24}
											height={24}
										/>
										<div className="flex flex-row items-center gap-1">
											<div className="text-md font-semibold capitalize">
												{chainData.name.replace(/^\w/, c => c.toUpperCase())}:
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
