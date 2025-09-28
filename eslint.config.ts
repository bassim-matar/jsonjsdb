import js from '@eslint/js'
import tseslint from 'typescript-eslint'

const allowedProps = [
  'parent_id',
  'last_modif',
  'nb_row',
  'metaFolder_id',
  'metaDataset_id',
  'nb_missing',
  'nb_distinct',
  'nb_duplicate',
  'entity_id',
  'parent_entity_id',
  'old_value',
  'new_value',
]

export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ignores: ['**/*.json.js', '**/*.test.ts', '**/dist/**'],
  },
  {
    files: ['**/*.{ts,tsx}'],
    ignores: ['eslint.config.ts'],
    rules: {
      '@typescript-eslint/naming-convention': [
        'error',
        {
          selector: 'variableLike',
          format: ['camelCase'],
        },
        {
          selector: 'function',
          format: ['camelCase'],
        },
        {
          selector: 'method',
          format: ['camelCase'],
        },
        {
          selector: 'class',
          format: ['PascalCase'],
        },
        {
          selector: 'interface',
          format: ['PascalCase'],
        },
        {
          selector: 'typeAlias',
          format: ['PascalCase'],
        },
        {
          selector: 'property',
          format: ['camelCase'],
          leadingUnderscore: 'allow',
          trailingUnderscore: 'allow',
          filter: {
            regex: `^(${allowedProps.join('|')})$`,
            match: false,
          },
        },
        {
          selector: 'property',
          filter: {
            regex: `^(${allowedProps.join('|')})$`,
            match: true,
          },
          format: null,
        },
      ],
    },
  },
]
