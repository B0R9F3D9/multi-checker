'use client';

import { DialogDescription, DialogTitle } from '@radix-ui/react-dialog';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { PiWarningCircle } from 'react-icons/pi';

import { DataTable } from '@/components/data-table/DataTable';
import { SettingsDialog } from '@/components/data-table/SettingsDialog';
import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTrigger,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { getProject, splitAddresses } from '@/lib/utils';
import { useCheckerStore } from '@/stores/checkerStore';

import { fetchWallets } from './api';
import { getColumns } from './columns';

const project = getProject('bebop');

export default function CheckerPage() {
	const t = useTranslations('CheckerPage');
	const tProject = useTranslations('Projects');
	const { toast } = useToast();
	const {
		wallets,
		checkWallets,
		recheckWallet,
		deleteWallet,
		setFetchWallets,
		setWallets,
	} = useCheckerStore();

	const [addresses, setAddresses] = useState<string>('');
	const [showAddresses, setShowAddresses] = useState(true);
	const [progress, setProgress] = useState(0);
	const [showProgress, setShowProgress] = useState(false);

	async function handleCheckWallets() {
		setWallets(
			splitAddresses(addresses).map((address, i) => ({
				id: i + 1,
				address,
			})),
		);
		await checkWallets(setShowProgress, setProgress);
	}

	useEffect(() => {
		setWallets([]);
		setFetchWallets(fetchWallets);
	}, []);

	useEffect(() => {
		setAddresses(wallets.map(wallet => wallet.address).join('\n'));
	}, [wallets]);

	return (
		<div className="flex flex-col justify-center items-center gap-4 p-4">
			<Image
				className="rounded-2xl object-cover shadow-md"
				src={project!.image}
				alt={project!.name}
				width={100}
				height={100}
			/>
			<div className="flex flex-row gap-2 justify-center items-center">
				<h1 className="text-2xl font-bold">{project!.name}</h1>
				{project!.hasDescription ? (
					<Dialog>
						<DialogTrigger>
							<PiWarningCircle size={24} />
						</DialogTrigger>
						<DialogContent>
							<DialogHeader>
								<DialogTitle className="text-2xl text-center font-semibold">
									{project!.name}
								</DialogTitle>
							</DialogHeader>
							<DialogDescription>
								{tProject(`${project!.name}.description`)}
							</DialogDescription>
						</DialogContent>
					</Dialog>
				) : null}
			</div>
			<Textarea
				rows={5}
				value={showAddresses ? addresses : t('addressesPlaceholderDisabled')}
				disabled={!showAddresses}
				placeholder={t('addressesPlaceholder')}
				onChange={e => setAddresses(e.target.value)}
				className="w-full max-w-lg"
			/>
			<div className="flex flex-row gap-2 w-full max-w-lg">
				<Button
					onClick={handleCheckWallets}
					disabled={addresses.trim().length === 0}
					variant="outline"
					className="flex-grow"
				>
					{t('checkBtn')}
				</Button>
				<SettingsDialog t={t} />
			</div>
			{showProgress && <Progress value={progress} className="max-w-lg" />}
			<DataTable
				columns={getColumns(
					toast,
					showAddresses,
					setShowAddresses,
					recheckWallet,
					deleteWallet,
					t,
				)}
				data={wallets}
				t={t}
			/>
		</div>
	);
}
