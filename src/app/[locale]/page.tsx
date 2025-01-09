// 'use client';

import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { FaDiscord } from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';

import { Button } from '@/components/ui/button';
import { PROJECTS } from '@/constants';
import { Link } from '@/i18n/routing';
import { Card, CardFooter, CardHeader, CardTitle } from '@/ui/card';

export default function HomePage() {
	const t = useTranslations('HomePage');

	return (
		<div className="flex flex-wrap justify-center gap-5 p-5">
			{PROJECTS.map(project => (
				<div key={project.name} className="relative max-w-xs w-full">
					<Card
						className={`shadow-md ${project.isDisabled ? 'opacity-50' : ''}`}
					>
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

						<CardTitle className="flex justify-center items-center">
							<Button
								className="text-center text-xl font-semibold inline-block p-0 mb-1"
								variant="link"
								asChild
								disabled={project.isDisabled}
							>
								<Link href={project.isDisabled ? '#' : project.path}>
									{project.name}
								</Link>
							</Button>
						</CardTitle>

						<CardFooter className="flex justify-center gap-2">
							<Button
								variant="outline"
								size="icon"
								disabled={project.isDisabled}
							>
								<a
									href={project.isDisabled ? '#' : project.discord}
									target="_blank"
								>
									<FaDiscord />
								</a>
							</Button>
							<Link href={project.isDisabled ? '#' : project.path}>
								<Button variant="outline" disabled={project.isDisabled}>
									{t('goToChecker')}
								</Button>
							</Link>
							<Button
								variant="outline"
								size="icon"
								disabled={project.isDisabled}
							>
								<a
									href={project.isDisabled ? '#' : project.twitter}
									target="_blank"
								>
									<FaXTwitter />
								</a>
							</Button>
						</CardFooter>
					</Card>

					{project.isDisabled && (
						<div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-md">
							<span className="text-white text-lg font-semibold -rotate-45">
								{t('comingSoon')}
							</span>
						</div>
					)}
				</div>
			))}
		</div>
	);
}
