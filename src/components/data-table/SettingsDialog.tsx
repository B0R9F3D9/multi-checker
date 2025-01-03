import React from 'react';
import { LuSettings } from 'react-icons/lu';

import { Checkbox } from '@/components/ui/checkbox';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { useCheckerStore } from '@/stores/checkerStore';
import { useTableStore } from '@/stores/tableStore';

import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '../ui/select';

export function SettingsDialog({ t }: { t: (key: string) => string }) {
	const { table } = useTableStore();
	const {
		concurrentFetches,
		setConcurrentFetches,
		concurrentWallets,
		setConcurrentWallets,
	} = useCheckerStore();
	if (!table) return null;

	return (
		<Dialog>
			<DialogTrigger asChild>
				<Button variant="outline" size="icon">
					<LuSettings />
				</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle className="text-center mb-3">
						{t('settings')}
					</DialogTitle>
					<DialogDescription asChild>
						<div className="flex gap-4">
							<div className="flex-1">
								<ScrollArea className="h-40 rounded-md border">
									<div className="p-2">
										<p className="text-center font-bold mb-2">{t('columns')}</p>
										{table
											.getAllColumns()
											.filter(column => column.getCanHide())
											.map(column => (
												<React.Fragment key={column.id}>
													<div className="flex items-center space-x-2 py-1">
														<Checkbox
															checked={column.getIsVisible()}
															onCheckedChange={(value: boolean) =>
																column.toggleVisibility(!!value)
															}
															id={column.id}
														/>
														<label>{t(column.id)}</label>
													</div>
													<Separator className="my-1" />
												</React.Fragment>
											))}
									</div>
								</ScrollArea>
							</div>

							<div className="flex-1">
								<div>
									<div className="mb-4">
										<p className="font-medium">{t('concurrentFetches')}</p>
										<Select
											value={String(concurrentFetches)}
											onValueChange={value =>
												setConcurrentFetches(Number(value))
											}
										>
											<SelectTrigger className="h-8 min-w-max">
												<SelectValue placeholder={String(concurrentFetches)} />
											</SelectTrigger>
											<SelectContent side="top">
												{[1, 3, 5, 7, 10].map(value => (
													<SelectItem key={value} value={`${value}`}>
														{value}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>

									<div>
										<p className="font-medium">{t('concurrentWallets')}</p>
										<Select
											value={String(concurrentWallets)}
											onValueChange={value =>
												setConcurrentWallets(Number(value))
											}
										>
											<SelectTrigger className="h-8 min-w-max">
												<SelectValue placeholder={String(concurrentWallets)} />
											</SelectTrigger>
											<SelectContent side="top">
												{[1, 3, 5, 7, 10].map(value => (
													<SelectItem key={value} value={`${value}`}>
														{value}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>
								</div>
							</div>
						</div>
					</DialogDescription>
				</DialogHeader>
			</DialogContent>
		</Dialog>
	);
}
