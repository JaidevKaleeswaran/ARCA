import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'aws', 'landing', 'ad-studio', 'node_modules']),
  {
    files: ['src/**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: {
        ...globals.browser,
        process: 'readonly',
      },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-useless-escape': 'warn',
      'no-useless-assignment': 'off',
      'no-empty': ['warn', { allowEmptyCatch: true }],
      'react-refresh/only-export-components': 'off',
      'react-hooks/refs': 'off',
      'react-hooks/static-components': 'off',
      'react-hooks/exhaustive-deps': 'warn',
      'react-hooks/set-state-in-effect': 'warn',
    },
  },
  {
    files: ['server/**/*.{js,mjs}', 'scripts/**/*.{js,mjs}', 'tests/**/*.{js,mjs}'],
    extends: [js.configs.recommended],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.browser,
      },
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-useless-escape': 'warn',
      'no-useless-assignment': 'off',
      'no-empty': ['warn', { allowEmptyCatch: true }],
    },
  },
])
