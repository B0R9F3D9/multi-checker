type ProjectCategory = 'swap' | 'bridge' | 'chain' | 'other';
type ProjectChain = 'evm' | 'svm' | 'cosmos';

export type Project = {
	name: string;
	path: string;
	image: string;
	twitter: string;
	discord: string;
	category: ProjectCategory | ProjectCategory[];
	chain: ProjectChain | ProjectChain[];
	hasDescription?: boolean;
	isDisabled?: boolean;
};
