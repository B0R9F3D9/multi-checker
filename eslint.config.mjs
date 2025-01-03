import { FlatCompat } from '@eslint/eslintrc';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
	baseDirectory: __dirname,
});

const eslintConfig = [
	...compat.extends('next/core-web-vitals', 'next/typescript'),
	{
		ignores: ['node_modules', 'out', '.next', 'public'],
		rules: {
			'@typescript-eslint/no-unused-vars': 'off',
			'@typescript-eslint/consistent-type-imports': 'error',
			'@typescript-eslint/no-explicit-any': 'off',
			'react-hooks/exhaustive-deps': 'off',
			'no-restricted-imports': [
				'error',
				{
					name: 'next/link',
					message: 'Please import from `@/i18n/routing` instead.',
				},
				{
					name: 'next/navigation',
					importNames: [
						'redirect',
						'permanentRedirect',
						'useRouter',
						'usePathname',
					],
					message: 'Please import from `@/i18n/routing` instead.',
				},
			],
		},
	},
];

export default eslintConfig;
