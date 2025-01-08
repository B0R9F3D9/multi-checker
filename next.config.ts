import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
	experimental: {
		webpackMemoryOptimizations: true,
	},
	images: {
		remotePatterns: [
			{
				protocol: 'https',
				hostname: 'icons.llamao.fi',
				port: '',
				pathname: '/icons/chains/**',
				search: '',
			},
			{
				protocol: 'https',
				hostname: 'cdn.mayan.finance',
				port: '',
				pathname: '/**',
				search: '',
			},
			{
				protocol: 'https',
				hostname: 'explorer.mayan.finance',
				port: '',
				pathname: '/assets/**',
				search: '',
			},
		],
	},
};

export default withNextIntl(nextConfig);
