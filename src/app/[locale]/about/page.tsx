import { useTranslations } from 'next-intl';
import { FaGithub } from 'react-icons/fa';

import { Button } from '@/components/ui/button';

export default function HomePage() {
	const t = useTranslations('AboutPage');

	return (
		<div className="flex flex-col justify-center items-center gap-5 p-5">
			<h1 className="text-3xl font-bold">{t('title')}</h1>
			<p className="text-lg">
				{t.rich('description', {
					button: chunks => (
						<a
							className="hover:text-sky-300"
							href="https://github.com/b0r9f3d9"
							target="_blank"
						>
							B0R9F3D9
						</a>
					),
				})}
			</p>
		</div>
	);
}
