import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
	pageExtensions: ['ts', 'tsx'],
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
			{
				protocol: 'https',
				hostname: 'raw.githubusercontent.com',
				port: '',
				pathname: '/hyperlane-xyz/hyperlane-registry/main/chains/**',
				search: '',
			},
			{
				protocol: 'https',
				hostname: 'pbs.twimg.com',
				port: '',
				pathname: '/profile_images/**',
				search: '',
			},
			{
				protocol: 'https',
				hostname: 'cdn.orbiter.finance',
				port: '',
				pathname: '/icon/chain/**',
				search: '',
			},
		],
	},
};

export default withNextIntl(nextConfig);
