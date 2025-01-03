export const PROJECTS = [
	{
		name: 'LayerZero',
		image: '/layerzero.webp',
		path: '/checker/layerzero',
		twitter: 'https://x.com/LayerZero_Core',
		discord: 'https:/discord.com/invite/ktbvm8Nkcr',
		isDisabled: false,
		hasWarning: true,
	},
	{
		name: 'Eclipse',
		image: '/eclipse.webp',
		path: '/checker/eclipse',
		twitter: 'https://x.com/eclipsefnd',
		discord: 'https:/discord.com/invite/eclipse-fnd',
		isDisabled: false,
	},
	{
		name: 'Odos',
		image: '/odos.webp',
		path: '/checker/odos',
		twitter: 'https://x.com/odosprotocol',
		discord: 'https:/discord.com/invite/odos',
		isDisabled: true,
	},
	{
		name: 'Bebop',
		image: '/bebop.webp',
		path: '/checker/bebop',
		twitter: 'https://x.com/bebop_dex',
		discord: 'https:/discord.com/invite/bebop',
		isDisabled: true,
	},
];

export function getProject(name: string) {
	return PROJECTS.find(project => project.name.toLowerCase() === name);
}
