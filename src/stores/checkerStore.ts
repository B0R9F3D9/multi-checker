import { create } from 'zustand';

import type { Wallet } from '@/types/wallet';

interface CheckerState {
	concurrentFetches: number;
	setConcurrentFetches: (concurrentFetches: number) => void;

	concurrentWallets: number;
	setConcurrentWallets: (concurrentWallets: number) => void;

	wallets: Wallet[];
	setWallets: (wallets: Wallet[]) => void;
	updateWallet: (address: string, wallet: Partial<Wallet>) => void;

	fetchWallets: (
		addresses: string[],
		concurrentFetches: number,
		concurrentWallets: number,
		updateWallet: (address: string, wallet: Partial<Wallet>) => void,
		setProgress?: (progress: number) => void,
	) => Promise<void>;
	setFetchWallets: (
		fetchWallets: (
			addresses: string[],
			concurrentFetches: number,
			concurrentWallets: number,
			updateWallet: (address: string, wallet: Partial<Wallet>) => void,
			setProgress?: (progress: number) => void,
		) => Promise<void>,
	) => void;

	checkWallets: (
		setShowProgress: (show: boolean) => void,
		setProgress: (progress: number) => void,
	) => Promise<void>;

	recheckWallet: (address: string) => Promise<void>;

	deleteWallet: (address: string) => void;
}

export const useCheckerStore = create<CheckerState>((set, get) => ({
	concurrentFetches: 3,
	setConcurrentFetches: concurrentFetches => set({ concurrentFetches }),

	concurrentWallets: 3,
	setConcurrentWallets: concurrentWallets => set({ concurrentWallets }),

	wallets: [],
	setWallets: wallets => set({ wallets }),
	updateWallet: (address, updatedWallet) => {
		const { wallets, setWallets } = get();
		setWallets(
			wallets.map(wallet =>
				wallet.address === address ? { ...wallet, ...updatedWallet } : wallet,
			),
		);
	},

	fetchWallets: async () => Promise.resolve(),
	setFetchWallets: fetchWallets => set({ fetchWallets }),

	checkWallets: async (setShowProgress, setProgress) => {
		const {
			updateWallet,
			wallets,
			fetchWallets,
			concurrentFetches,
			concurrentWallets,
		} = get();
		setShowProgress(wallets.length > 1);
		await fetchWallets(
			wallets.map(wallet => wallet.address),
			concurrentFetches,
			concurrentWallets,
			updateWallet,
			setProgress,
		);
		setShowProgress(false);
	},

	recheckWallet: async address => {
		const { updateWallet, fetchWallets, concurrentFetches, concurrentWallets } =
			get();
		await fetchWallets(
			[address],
			concurrentFetches,
			concurrentWallets,
			updateWallet,
		);
	},

	deleteWallet: address => {
		const { wallets, setWallets } = get();
		const filteredWallets = wallets
			.filter(wallet => wallet.address !== address)
			.map((wallet, index) => ({ ...wallet, id: index + 1 }));
		setWallets(filteredWallets);
	},
}));
