import { useTranslations } from 'next-intl';

export default function Custom404() {
	const t = useTranslations('NotFoundPage');
	return (
		<div className="flex flex-col items-center justify-center">
			<h1 className="text-3xl font-bold">{t('title')}</h1>
			<p className="text-lg">{t('message')}</p>
		</div>
	);
}
