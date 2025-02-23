import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { FaDiscord, FaTelegram } from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';
import { PiWarningCircle } from 'react-icons/pi';

import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog';
import { PROJECTS } from '@/constants';
import { Link } from '@/i18n/routing';
import { Card, CardFooter, CardHeader, CardTitle } from '@/ui/card';

export default function HomePage() {
	const t = useTranslations('HomePage');
	const tProject = useTranslations('Projects');

	return (
		<div className="flex flex-wrap justify-center gap-5 p-5">
			{PROJECTS.map(project => (
				<div key={project.name} className="relative max-w-xs w-full">
					<Card className="shadow-md">
						<CardHeader className="flex items-center justify-center">
							<Link href={project.isDisabled ? '#' : project.path}>
								<Image
									className="rounded-2xl object-cover shadow-md -mb-3"
									src={project.image}
									alt={project.name}
									width={100}
									height={100}
								/>
							</Link>
						</CardHeader>

						<CardTitle className="relative flex flex-row justify-center items-center gap-2 mb-2">
							<Link href={project.isDisabled ? '#' : project.path}>
								<h1 className="text-xl font-semibold hover:text-sky-300">
									{project.name}
								</h1>
							</Link>
							{project.hasDescription ? (
								<Dialog>
									<DialogTrigger>
										<PiWarningCircle size={22} />
									</DialogTrigger>
									<DialogContent>
										<DialogHeader>
											<DialogTitle className="text-2xl text-center font-semibold">
												{project.name}
											</DialogTitle>
										</DialogHeader>
										<DialogDescription>
											{tProject(`${project.name}.description`)}
										</DialogDescription>
									</DialogContent>
								</Dialog>
							) : null}
						</CardTitle>

						<CardFooter className="flex justify-center gap-2">
							<a href={project.discord || project.telegram} target="_blank">
								<Button variant="outline" size="icon">
									{project.discord ? <FaDiscord /> : <FaTelegram />}
								</Button>
							</a>
							{project.isDisabled ? (
								<Button variant="outline" disabled>
									{t('comingSoon')}
								</Button>
							) : (
								<Link href={project.path}>
									<Button variant="outline">{t('goToChecker')}</Button>
								</Link>
							)}
							<a href={project.twitter} target="_blank">
								<Button variant="outline" size="icon">
									<FaXTwitter />
								</Button>
							</a>
						</CardFooter>
					</Card>
				</div>
			))}
		</div>
	);
}
