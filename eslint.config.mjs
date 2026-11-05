import borgarLint from '@borgar/eslint-config';
import eslint from '@eslint/js';
import globals from 'globals';

// The shared preset targets TypeScript projects; this one is plain JS.
const withoutTypescriptRules = config => ({
  ...config,
  rules: Object.fromEntries(
    Object.entries(config.rules).filter(([ name ]) => !name.startsWith('@typescript-eslint/'))
  )
});

export default [
  {
    ignores: [ 'lib/*', 'coverage/*', 'node_modules/*' ]
  },
  eslint.configs.recommended,
  withoutTypescriptRules(borgarLint.config.recommended),
  borgarLint.config.stylistic({
    commaDangle: false,
    singleBlocks: false,
    lineLength: Infinity
  }),
  {
    rules: {
      // keep the project's established layout
      '@stylistic/brace-style': [ 'error', 'stroustrup', { allowSingleLine: true } ],
      '@stylistic/no-multiple-empty-lines': [ 'error', { max: 3 } ],
      '@stylistic/quotes': [ 'error', 'single', { avoidEscape: true } ]
    }
  },
  {
    files: [ 'src/**/*.js', 'test/**/*.js', 'bin/textile', 'webpack.config.js' ],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'commonjs',
      globals: { ...globals.node }
    },
    rules: {
      'no-use-before-define': [ 'error', { functions: false } ]
    }
  },
  {
    files: [ 'test/**/*.js' ],
    rules: {
      // fixtures are long multi-line strings that read best unchanged
      'prefer-const': 'off',
      'no-multi-str': 'off',
      '@stylistic/quotes': 'off',
      '@stylistic/function-paren-newline': 'off',
      '@stylistic/no-multiple-empty-lines': 'off'
    }
  },
  {
    files: [ 'docs/**/*.js' ],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'script',
      globals: { ...globals.browser, textile: 'readonly' }
    }
  }
];
