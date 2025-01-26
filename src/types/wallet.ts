import type { BebopWallet } from '@/app/[locale]/checker/bebop/types';
import type { EclipseWallet } from '@/app/[locale]/checker/eclipse/types';
import type { HyperlaneWallet } from '@/app/[locale]/checker/hyperlane/types';
import type { JumperWallet } from '@/app/[locale]/checker/jumper/types';
import type { LayerzeroWallet } from '@/app/[locale]/checker/layerzero/types';
import type { MayanWallet } from '@/app/[locale]/checker/mayan/types';
import type { OdosWallet } from '@/app/[locale]/checker/odos/types';
import type { OrbiterWallet } from '@/app/[locale]/checker/orbiter/types';
import type { PhoenixWallet } from '@/app/[locale]/checker/phoenix/types';

export type Wallet =
	| LayerzeroWallet
	| EclipseWallet
	| OdosWallet
	| BebopWallet
	| MayanWallet
	| HyperlaneWallet
	| JumperWallet
	| OrbiterWallet
	| PhoenixWallet;

export type DateFrame = { date: string; txns: number }[];
