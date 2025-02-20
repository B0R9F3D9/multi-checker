import Image from 'next/image';
import { MdTouchApp } from 'react-icons/md';

import {
	HoverCard,
	HoverCardContent,
	HoverCardTrigger,
} from '@/components/ui/hover-card';

import type { LayerzeroWallet } from './types';

export function getProtocolsComponent(protocols: LayerzeroWallet['protocols']) {
	if (protocols?.length === 0) {
		return <p className="flex justify-center items-center">0</p>;
	}

	return (
		<div className="flex flex-row items-center gap-2 relative">
			<div className="lg:hidden flex flex-row items-center gap-2 max-w-20">
				<p>{protocols!.length}</p>
				<div className="flex flex-row items-center gap-0 overflow-x-auto max-w-full">
					{protocols!.map(protocol => (
						<div key={protocol.id} className="w-6 h-6 flex-shrink-0">
							<Image
								className="rounded-md"
								src={`https://icons-ckg.pages.dev/lz-scan/protocols/${protocol.id}.svg`}
								alt={protocol.name}
								width={24}
								height={24}
								title={protocol.name.replace(/^\w/, c => c.toUpperCase())}
							/>
						</div>
					))}
				</div>
			</div>

			<div className="hidden lg:block">
				<HoverCard>
					<HoverCardTrigger>
						<p className="cursor-pointer flex flex-row items-center gap-1">
							{protocols!.length}
							<MdTouchApp />
						</p>
					</HoverCardTrigger>
					<HoverCardContent className="p-4 rounded-lg shadow-md min-h-fit max-h-40 max-w-fit">
						<div className="flex flex-col gap-2 overflow-y-auto max-h-36">
							{protocols!.map(protocol => (
								<div
									key={protocol.id}
									className="flex flex-row items-center gap-2"
								>
									<Image
										src={`https://icons-ckg.pages.dev/lz-scan/protocols/${protocol.id}.svg`}
										alt={protocol.name}
										width={24}
										height={24}
										title={protocol.name.replace(/^\w/, c => c.toUpperCase())}
									/>
									<div className="flex flex-row items-center gap-1">
										<div className="text-md font-semibold capitalize">
											{protocol.name}:
										</div>
										<div className="text-sm">{protocol.txns}</div>
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
