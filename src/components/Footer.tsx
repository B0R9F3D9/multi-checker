import { useTranslations } from 'next-intl';
import { FaGithub } from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';

import { Link } from '@/i18n/routing';
import { Button } from '@/ui/button';

export default function Footer() {
	const t = useTranslations('Footer');
	return (
		<div className="flex items-center justify-between p-4 border-t">
			<a href="https://github.com/b0r9f3d9" target="_blank">
				<Button variant="outline" size="icon">
					<FaGithub />
				</Button>
			</a>
			<Link className="hover:text-sky-300" href="/about">
				{t('link')}
			</Link>
			<a href="https://x.com/b0r9f3d9" target="_blank">
				<Button variant="outline" size="icon">
					<FaXTwitter />
				</Button>
			</a>
		</div>
	);
}
