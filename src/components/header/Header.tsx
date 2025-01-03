'use client';

import { BiAtom } from 'react-icons/bi';

import { Link } from '@/i18n/routing';
import { Button } from '@/ui/button';

import LocaleSwitcher from './LocaleSwitch';
import ThemeSwitch from './ThemeSwitch';

export default function Header() {
	return (
		<div className="relative flex items-center justify-between p-4 border-b w-full">
			<div className="flex-shrink-0">
				<LocaleSwitcher />
			</div>

			<div className="absolute left-1/2 transform -translate-x-1/2 flex items-center">
				<Button asChild variant="link">
					<Link href="/" className="flex items-center gap-2">
						<BiAtom />
						<h1 className="text-xl font-semibold">Multi Checker</h1>
					</Link>
				</Button>
			</div>

			<div className="flex-shrink-0">
				<ThemeSwitch />
			</div>
		</div>
	);
}
