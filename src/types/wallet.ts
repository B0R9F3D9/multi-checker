import type { EclipseWallet } from '@/app/[locale]/checker/eclipse/types';
import type { LayerzeroWallet } from '@/app/[locale]/checker/layerzero/types';

export type Wallet = LayerzeroWallet | EclipseWallet;

export type DateFrame = { date: string; txns: number }[];
