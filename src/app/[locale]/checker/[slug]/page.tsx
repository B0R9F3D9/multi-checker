'use client';

import { DialogDescription, DialogTitle } from '@radix-ui/react-dialog';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
	FaDiscord,
	FaRegTrashAlt,
	FaSpinner,
	FaTelegram,
} from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';
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
import { useRouter } from '@/i18n/routing';
import { getProject, splitAddresses, toChecksumAddress } from '@/lib/utils';
import { useCheckerStore } from '@/stores/checkerStore';

export default function CheckerPage() {
	const { slug } = useParams();
	const t = useTranslations('CheckerPage');
	const tProject = useTranslations('Projects');
	const { toast } = useToast();
	const router = useRouter();

	const project = getProject(slug as string);

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
	const [getColumns, setGetColumns] = useState<any>(null);
	const [loadingError, setLoadingError] = useState<boolean>(false);

	useEffect(() => {
		setWallets([]);
		(async () => {
			try {
				const api = await import(`@/app/[locale]/checker/_${slug}/api`);
				const columns = await import(`@/app/[locale]/checker/_${slug}/columns`);
				setFetchWallets(api.fetchWallets);
				setGetColumns(() => columns.getColumns);
			} catch {
				setLoadingError(true);
			}
		})();
	}, [slug]);

	async function handleCheckWallets() {
		setWallets(
			splitAddresses(addresses).map((address, i) => ({
				id: i + 1,
				address: toChecksumAddress(address),
			})),
		);
		await checkWallets(setShowProgress, setProgress);
	}

	useEffect(() => {
		setAddresses(wallets.map(wallet => wallet.address).join('\n'));
	}, [wallets]);

	if (!project || loadingError || project.isDisabled)
		return (
			<div className="text-4xl text-center font-bold">
				{t('projectNotFound')}
			</div>
		);
	if (!getColumns)
		return (
			<div className="flex justify-center items-center">
				<FaSpinner className="animate-spin text-4xl" />
			</div>
		);

	return (
		<div className="flex flex-col justify-center items-center gap-4 p-4">
			<Image
				className="rounded-2xl object-cover shadow-md"
				src={project!.image}
				alt={project!.name}
				width={100}
				height={100}
			/>
			<div className="flex flex-row gap-3 justify-center items-center">
				<a href={project.discord || project.telegram} target="_blank">
					<Button variant="outline" size="icon">
						{project.discord ? <FaDiscord /> : <FaTelegram />}
					</Button>
				</a>
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
				<a href={project.twitter} target="_blank">
					<Button variant="outline" size="icon">
						<FaXTwitter />
					</Button>
				</a>
			</div>
			<Textarea
				rows={5}
				value={showAddresses ? addresses : t('addressesPlaceholderDisabled')}
				disabled={!showAddresses}
				placeholder={t('addressesPlaceholder')}
				onChange={e => setAddresses(e.target.value)}
				className="w-full max-w-lg text-lg"
			/>
			<div className="flex flex-row gap-2 w-full max-w-lg">
				{project.supportsDB ? (
					<Button
						onClick={() =>
							window.confirm(t('clearDB')) &&
							window.indexedDB.deleteDatabase(project.name.toLowerCase()) &&
							router.refresh()
						}
						size="icon"
						variant="outline"
					>
						<FaRegTrashAlt />
					</Button>
				) : null}
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
