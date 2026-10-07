import nx from '@nx/eslint-plugin'
import i18next from 'eslint-plugin-i18next'

// Text a reader sees must go through t(): JSX text, and the attributes below
export const literalStrings = (files) => ({
  files,
  ignores: ['**/*.stories.tsx', '**/*.spec.*'],
  plugins: { i18next },
  rules: {
    'i18next/no-literal-string': ['error', {
      mode: 'jsx-only',
      'jsx-attributes': { include: ['title', 'subtitle', 'label', 'placeholder', 'alt', 'aria-label', 'aria-description', 'aria-valuetext', 'noun', 'children', 'description'] },
      words: { exclude: [/^[\p{P}\p{S}\p{N}\p{M}\p{Cf}\s]+$/u, '[A-Z_-]+', /^[\w./-]*\d[\w./-]*$/u, '\\.torrent', 'Sensorr', 'Plex', 'TMDB', 'MediUX'] },
    }],
  },
})

export default [
  ...nx.configs['flat/base'],
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    rules: {
      'no-empty': ['error', { allowEmptyCatch: true }],
      'prefer-const': ['error', { destructuring: 'all' }],
      'no-irregular-whitespace': ['error', { skipTemplates: true }],
      '@typescript-eslint/no-unused-expressions': ['error', { allowShortCircuit: true, allowTernary: true }],
      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: true,
          allow: [],
          depConstraints: [
            {
              sourceTag: '*',
              onlyDependOnLibsWithTags: ['*'],
            },
          ],
        },
      ],
    },
  },
  ...nx.configs['flat/typescript'],
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      'no-extra-semi': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/no-empty-function': 'off',
    },
    languageOptions: {
      parserOptions: {
        project: './tsconfig.*?.json',
      },
    },
  },
  ...nx.configs['flat/javascript'],
  {
    files: ['**/*.js', '**/*.jsx'],
    rules: {
      'no-extra-semi': 'off',
      '@typescript-eslint/no-empty-function': 'off',
    },
  },
]
