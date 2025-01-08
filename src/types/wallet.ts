import type { BebopWallet } from '@/app/[locale]/checker/bebop/types';
import type { EclipseWallet } from '@/app/[locale]/checker/eclipse/types';
import type { LayerzeroWallet } from '@/app/[locale]/checker/layerzero/types';
import type { MayanWallet } from '@/app/[locale]/checker/mayan/types';
import type { OdosWallet } from '@/app/[locale]/checker/odos/types';

export type Wallet =
	| LayerzeroWallet
	| EclipseWallet
	| OdosWallet
	| BebopWallet
	| MayanWallet;

export type DateFrame = { date: string; txns: number }[];
