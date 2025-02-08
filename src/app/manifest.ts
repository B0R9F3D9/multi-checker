import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
	return {
		name: 'Multi Checker',
		short_name: 'MultiChecker',
		description: 'Multi Checker made by B0R9F3D9',
		theme_color: '#000000',
		background_color: '#000000',
		display: 'standalone',
		start_url: '/',
		icons: [
			{
				src: '/favicon-192x192.png',
				sizes: '192x192',
				type: 'image/png',
				purpose: 'maskable',
			},
			{
				src: '/favicon-512x512.png',
				sizes: '512x512',
				type: 'image/png',
				purpose: 'maskable',
			},
			{
				src: '/favicon-144x144.png',
				sizes: '144x144',
				type: 'image/png',
				purpose: 'any',
			},
		],
	};
}
