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
		],
	},
};

export default withNextIntl(nextConfig);
