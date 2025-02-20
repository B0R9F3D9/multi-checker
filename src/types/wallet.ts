import type { BebopWallet } from '@/app/[locale]/checker/_bebop/types';
import type { EclipseWallet } from '@/app/[locale]/checker/_eclipse/types';
import type { HyperlaneWallet } from '@/app/[locale]/checker/_hyperlane/types';
import type { JumperWallet } from '@/app/[locale]/checker/_jumper/types';
import type { JupiterWallet } from '@/app/[locale]/checker/_jupiter/types';
import type { LayerzeroWallet } from '@/app/[locale]/checker/_layerzero/types';
import type { MayanWallet } from '@/app/[locale]/checker/_mayan/types';
import type { MeteoraWallet } from '@/app/[locale]/checker/_meteora/types';
import type { OdosWallet } from '@/app/[locale]/checker/_odos/types';
import type { OrbiterWallet } from '@/app/[locale]/checker/_orbiter/types';
import type { PhoenixWallet } from '@/app/[locale]/checker/_phoenix/types';

export type Wallet =
	| LayerzeroWallet
	| EclipseWallet
	| OdosWallet
	| BebopWallet
	| MayanWallet
	| HyperlaneWallet
	| JumperWallet
	| OrbiterWallet
	| PhoenixWallet
	| MeteoraWallet
	| JupiterWallet;

export type DateFrame = { date: string; txns: number }[];
