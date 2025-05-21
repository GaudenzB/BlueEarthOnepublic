/* eslint-env node */
/* global module process */

/**
 * ESLint Configuration
 * 
 * This configuration provides comprehensive linting rules for the entire codebase,
 * with specific overrides for client and server code.
 * 
 * Features:
 * - TypeScript integration with strict type checking
 * - React best practices, including hooks rules
 * - Environment-specific rules (development vs. production)
 * - Consistent code style enforcement with Prettier integration
 */

const isProd = process.env.NODE_ENV === 'production';

module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
    es2021: true,
    jest: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:import/errors',
    'plugin:import/warnings',
    'plugin:import/typescript',
    'prettier', // Must be last to override other configs
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: './tsconfig.json',
  },
  plugins: [
    'react', 
    '@typescript-eslint',
    'import',
    'react-hooks',
  ],
  settings: {
    react: {
      version: 'detect',
    },
    'import/resolver': {
      typescript: {
        project: './tsconfig.json',
      },
      node: {
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
        moduleDirectory: ['node_modules', '.'],
      },
    },
    'import/parsers': {
      '@typescript-eslint/parser': ['.ts', '.tsx']
    },
  },
  rules: {
    // General code quality
    'no-console': isProd ? 'warn' : 'off',
    'no-debugger': isProd ? 'error' : 'off',
    'no-duplicate-imports': 'error',
    'no-unused-expressions': 'error',
    'prefer-const': 'error',
    'eqeqeq': ['error', 'always', { null: 'ignore' }],
    'no-return-await': 'error',
    'no-irregular-whitespace': 'error',
    'no-var': 'error',
    
    // Import organization
    'import/no-unresolved': 'error',
    'import/named': 'error',
    'import/default': 'error',
    'import/namespace': 'error',
    'import/no-absolute-path': 'error',
    'import/no-self-import': 'error',
    'import/first': 'error',
    'import/order': [
      'error',
      {
        'groups': [
          'builtin',
          'external',
          'internal',
          'parent',
          'sibling',
          'index'
        ],
        'pathGroups': [
          {
            'pattern': '@/**',
            'group': 'internal'
          },
          {
            'pattern': '@shared/**',
            'group': 'internal'
          },
          {
            'pattern': '@blueearth/core/**',
            'group': 'internal'
          },
          {
            'pattern': '@modules/**',
            'group': 'internal'
          }
        ],
        'newlines-between': 'always',
        'alphabetize': { order: 'asc' }
      }
    ],
    
    // TypeScript rules
    '@typescript-eslint/explicit-module-boundary-types': ['warn', {
      'allowArgumentsExplicitlyTypedAsAny': true,
      'allowDirectConstAssertionInArrowFunctions': true,
      'allowHigherOrderFunctions': true,
      'allowTypedFunctionExpressions': true,
    }],
    '@typescript-eslint/no-unused-vars': ['warn', { 
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_',
      caughtErrorsIgnorePattern: '^_',
    }],
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/consistent-type-imports': 'error',
    '@typescript-eslint/no-non-null-assertion': 'warn',
    '@typescript-eslint/ban-ts-comment': ['error', {
      'ts-expect-error': 'allow-with-description',
      'ts-ignore': 'allow-with-description',
      'ts-nocheck': 'allow-with-description',
      'minimumDescriptionLength': 10
    }],
    '@typescript-eslint/no-unnecessary-condition': 'warn',
    '@typescript-eslint/prefer-optional-chain': 'error',
    '@typescript-eslint/prefer-nullish-coalescing': 'error',
    '@typescript-eslint/array-type': ['error', { default: 'array' }],
    '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
    '@typescript-eslint/consistent-indexed-object-style': ['error', 'record'],
    '@typescript-eslint/consistent-generic-constructors': ['error', 'type-annotation'],
    '@typescript-eslint/naming-convention': [
      'warn',
      {
        selector: 'interface',
        format: ['PascalCase'],
        custom: {
          regex: '^I[A-Z]',
          match: false
        }
      },
      {
        selector: 'enum',
        format: ['PascalCase']
      },
      {
        selector: 'typeAlias',
        format: ['PascalCase']
      },
      {
        selector: 'typeParameter',
        format: ['PascalCase']
      }
    ],
    '@typescript-eslint/prefer-for-of': 'error',
    '@typescript-eslint/prefer-function-type': 'error',
    '@typescript-eslint/restrict-template-expressions': 'off', // Allow any type in template literals
    '@typescript-eslint/no-unsafe-assignment': 'off', // Causes too many issues with external libraries
    '@typescript-eslint/no-unsafe-member-access': 'off', // Causes too many issues with external libraries
    '@typescript-eslint/no-unsafe-call': 'off', // Causes too many issues with external libraries
    '@typescript-eslint/no-unsafe-return': 'off', // Causes too many issues with external libraries
    
    // React rules
    'react/prop-types': 'off',
    'react/react-in-jsx-scope': 'off',
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
    'react/no-array-index-key': 'warn',
    'react/jsx-pascal-case': 'error',
    'react/jsx-curly-brace-presence': ['error', { props: 'never', children: 'never' }],
    'react/jsx-boolean-value': ['error', 'never'],
    'react/display-name': 'off',
    'react/self-closing-comp': ['error', { component: true, html: true }],
    'react/jsx-key': ['error', { checkFragmentShorthand: true }],
    'react/jsx-no-duplicate-props': 'error',
    'react/jsx-no-useless-fragment': 'warn',
    'react/jsx-sort-props': ['warn', {
      callbacksLast: true,
      shorthandFirst: true,
      ignoreCase: true,
      reservedFirst: true,
    }],
    'react/function-component-definition': ['warn', {
      namedComponents: 'function-declaration',
      unnamedComponents: 'arrow-function'
    }],
    // Dev pragmatism: unescaped ' and " aren't a crash-risk.
    // Treat them as warnings so CI doesn't fail.
    'react/no-unescaped-entities': 'warn',
  },
  ignorePatterns: [
    'dist', 
    'node_modules', 
    '*.js.map', 
    'coverage',
    'migrations',
    '.husky',
    'build'
  ],
  overrides: [
    // Test & Story files override
    {
      files: ['**/__tests__/**/*', '**/*.stories.*'],
      rules: {
        'react/display-name': 'off',
      },
    },
    // JavaScript files override
    {
      files: ['*.js'],
      rules: {
        '@typescript-eslint/no-var-requires': 'off',
      },
    },
    // Server code overrides
    {
      files: ['server/**/*.ts', 'modules/*/server/**/*.ts'],
      rules: {
        'no-console': 'off', // Allow console.log in server code
        '@typescript-eslint/explicit-function-return-type': ['warn', {
          allowExpressions: true,
          allowTypedFunctionExpressions: true,
        }],
      },
    },
    // Configuration files override
    {
      files: ['*.config.js', 'config/**/*.js'],
      rules: {
        'no-console': 'off',
      },
    },
    // Core module override
    {
      files: ['core/**/*.ts'],
      rules: {
        '@typescript-eslint/explicit-function-return-type': ['error', {
          allowExpressions: true,
          allowHigherOrderFunctions: true,
          allowTypedFunctionExpressions: true,
        }],
        '@typescript-eslint/no-explicit-any': 'warn',
      },
    },
    // Module server code overrides
    {
      files: ['modules/*/server/**/*.ts'],
      rules: {
        '@typescript-eslint/explicit-function-return-type': ['warn', {
          allowExpressions: true,
          allowTypedFunctionExpressions: true,
        }],
      },
    },
    // Test files override
    {
      files: ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/*.spec.tsx'],
      env: {
        jest: true,
      },
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-non-null-assertion': 'off',
        '@typescript-eslint/unbound-method': 'off',
        // Relaxed rules for test files
        '@typescript-eslint/no-unused-vars': ['warn', { 
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        }],
        // Allow more flexible imports in tests
        'import/no-unresolved': 'warn',
        // Don't enforce React naming conventions in tests
        'react/function-component-definition': 'off',
        // Allow import paths flexibility for mocks
        'import/no-absolute-path': 'off',
      },
    },
  ],
};