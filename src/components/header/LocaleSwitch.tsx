'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';

import type { Locale } from '@/i18n/routing';
import { routing, usePathname, useRouter } from '@/i18n/routing';
import { Button } from '@/ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/ui/dropdown-menu';

export default function LocaleSwitcher() {
	const router = useRouter();
	const pathname = usePathname();
	const params = useParams();
	const locale = useLocale();
	const t = useTranslations('LocaleSwitcher');

	const handleLocaleChange = (locale: Locale) => {
		router.replace(
			// @ts-expect-error -- TypeScript will validate that only known `params`
			// are used in combination with a given `pathname`. Since the two will
			// always match for the current route, we can skip runtime checks
			{ pathname, params },
			{ locale },
		);
	};

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="outline">
					{locale === 'en' ? '🇺🇸 EN' : locale === 'ua' ? '🇺🇦 UA' : '🇷🇺 RU'}
					<span className="sr-only">{t('label')}</span>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="start">
				{routing.locales.map(cur => (
					<DropdownMenuItem key={cur} onClick={() => handleLocaleChange(cur)}>
						{cur === 'en'
							? '🇺🇸 English'
							: cur === 'ua'
								? '🇺🇦 Українська'
								: '🇷🇺 Русский'}
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
