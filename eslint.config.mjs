import js from '@eslint/js';
import typescriptParser from '@typescript-eslint/parser';
import typescriptPlugin from '@typescript-eslint/eslint-plugin';
import nextPlugin from '@next/eslint-plugin-next';
import globals from 'globals';
import simpleImportSort from 'eslint-plugin-simple-import-sort';

export default [
  {
    ignores: [
      'node_modules/**',
      '.next/**',
      'out/**',
      'build/**',
      'dist/**',
      'coverage/**',
      '.idx/**',
      '*.config.js',
      '*.config.mjs',
      'react-shim.js',
    ],
  },
  js.configs.recommended,
  {
    files: ['**/*.{js,mjs,cjs,jsx,ts,tsx}'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
        project: false,
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021,
        React: 'readonly',
        JSX: 'readonly',
        NodeJS: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': typescriptPlugin,
      '@next/next': nextPlugin,
      'simple-import-sort': simpleImportSort,
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs['core-web-vitals'].rules,
      '@next/next/no-page-custom-font': 'off',
      semi: ['error', 'always'],
      quotes: ['error', 'single', { avoidEscape: true, allowTemplateLiterals: true }],
      'jsx-quotes': ['error', 'prefer-double'],
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-non-null-assertion': 'warn',
      '@typescript-eslint/no-unused-expressions': 'off',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'prefer-const': 'error',
      'no-var': 'error',
      'object-shorthand': 'error',
      'quote-props': ['error', 'as-needed'],
      'prefer-template': 'error',
      'prefer-arrow-callback': 'error',
      'no-useless-concat': 'error',
      'no-multi-spaces': 'error',
      'no-trailing-spaces': 'error',
      'eol-last': ['error', 'always'],
      'comma-dangle': ['error', 'always-multiline'],
      'arrow-spacing': 'error',
      'space-before-blocks': 'error',
      'keyword-spacing': 'error',
      'react/no-unescaped-entities': 'off',
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'no-undef': 'off',
      'no-unused-vars': 'off',
      'no-redeclare': 'off',
      '@typescript-eslint/no-redeclare': 'error',
      'simple-import-sort/imports': [
        'error',
        {
          groups: [
            // Side effect imports first
            ['^\\u0000'],
            // React and Next.js packages
            ['^react', '^next'],
            // External packages (node_modules)
            ['^@?\\w'],
            // Internal packages (@/ alias)
            ['^@/'],
            // Parent imports (../)
            ['^\\.\\.(?!/?$)', '^\\.\\./?$'],
            // Sibling imports (./)
            ['^\\./(?=.*/)(?!/?$)', '^\\.(?!/?$)', '^\\./?$'],
            // Style imports
            ['^.+\\.s?css$'],
          ],
        },
      ],
      'simple-import-sort/exports': 'error',
    },
  },
];
