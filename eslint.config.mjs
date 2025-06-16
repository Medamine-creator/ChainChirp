import globals  from 'globals'
import path     from 'node:path'
import js       from '@eslint/js'
import tsParser from '@typescript-eslint/parser'
import tsPlugin from '@typescript-eslint/eslint-plugin'

import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname  = path.dirname(__filename)

export default [
  /* ───────────────────────── Ignored paths ───────────────────────── */
  {
    ignores : [
      '.github',
      'docs',
      'dist',
      'node_modules',
      'scripts',
      'tests',
      '*.config.*',
    ],
  },

  /* ───────────── TypeScript sources (rules & parser options) ──────── */
  {
    files : ['src/**/*.ts', 'src/**/*.d.ts'],

    languageOptions : {
      globals : { ...globals.node, ...globals.browser },
      ecmaVersion   : 'latest',
      sourceType    : 'module',
      parser        : tsParser,
      parserOptions : {
        project         : ['./tsconfig.json'],
        tsconfigRootDir : process.cwd(),
      },
    },

    plugins : {
      '@typescript-eslint' : tsPlugin,
    },

    /* Merge core & TS recommended rules, then overlay spacing style */
    rules : {
      ...js.configs.recommended.rules,
      ...tsPlugin.configs.recommended.rules,

      /* ─── Style preferences ─────────────────────────────────────── */
      semi                    : [2, 'never'],
      'one-var'               : 'off',
      'return-await'          : 'off',
      indent                  : 'off',
      'no-multi-spaces'       : 'off',
      'operator-linebreak'    : 'off',
      'array-bracket-spacing' : ['error', 'always'],

      'key-spacing' : ['error', {
        multiLine : { beforeColon : true, afterColon : true },
        align     : { beforeColon : true, afterColon : true },
      }],

      /* ─── TS rule customisations ─────────────────────────────────── */
      '@typescript-eslint/indent'                        : 'off',
      '@typescript-eslint/return-await'                  : [1, 'in-try-catch'],
      '@typescript-eslint/explicit-function-return-type' : 'off',
      '@typescript-eslint/strict-boolean-expressions'    : 'off',
      '@typescript-eslint/restrict-plus-operands'        : 'off',
      '@typescript-eslint/no-base-to-string'             : 'off',
      '@typescript-eslint/naming-convention'             : 'off',
      '@typescript-eslint/array-type'                    : 'off',
      '@typescript-eslint/key-spacing'                   : 'off',
      '@typescript-eslint/consistent-type-imports'       : 'off',
      '@typescript-eslint/require-array-sort-compare'    : 'off',
      '@typescript-eslint/no-useless-constructor'        : 'off',

      '@typescript-eslint/no-unused-vars' : ['error', {
        argsIgnorePattern              : '^_',
        varsIgnorePattern              : '^_',
        caughtErrorsIgnorePattern      : '^_',
        destructuredArrayIgnorePattern : '^_',
        ignoreRestSiblings             : true,
      }],

      '@typescript-eslint/no-invalid-void-type' : ['error', {
        allowInGenericTypeArguments : true,
      }],
    },
  },
]