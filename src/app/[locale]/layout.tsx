// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Analytics } from '@vercel/analytics/react';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { SpeedInsights } from '@vercel/speed-insights/next';
import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { Geist, Geist_Mono } from 'next/font/google';
import { notFound } from 'next/navigation';

import Footer from '@/components/Footer';
import Header from '@/components/header/Header';
import { ThemeProvider } from '@/components/theme-provider';
import { routing } from '@/i18n/routing';
import { Toaster } from '@/ui/toaster';

import '../globals.css';

const geistSans = Geist({
	variable: '--font-geist-sans',
	subsets: ['latin'],
	display: 'swap',
});

const geistMono = Geist_Mono({
	variable: '--font-geist-mono',
	subsets: ['latin'],
	display: 'swap',
});

export const metadata: Metadata = {
	title: 'Multi Checker',
	description: 'Multi Checker by b0r9f3d9',
};

export default async function RootLayout({
	children,
	params,
}: {
	children: React.ReactNode;
	params: Promise<{ locale: string }>;
}) {
	const { locale } = await params;
	if (!routing.locales.includes(locale as never)) {
		notFound();
	}
	const messages = await getMessages();

	return (
		<html lang={locale} suppressHydrationWarning>
			<meta name="apple-mobile-web-app-title" content="MultiChecker" />
			<body
				className={`${geistSans.variable} ${geistMono.variable} antialiased`}
			>
				<ThemeProvider
					attribute="class"
					defaultTheme="system"
					enableSystem
					disableTransitionOnChange
				>
					<div className="flex flex-col min-h-screen justify-between">
						<NextIntlClientProvider messages={messages}>
							<Header />
							{children}
							<Footer />
						</NextIntlClientProvider>
					</div>
					<Toaster />
				</ThemeProvider>
			</body>
		</html>
	);
}
