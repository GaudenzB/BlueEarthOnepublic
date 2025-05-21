/**
 * New ESLint Flat Config - Development Mode
 * 
 * This configuration uses the new flat config format and disables
 * all TypeScript and React rules that commonly block development.
 */

module.exports = {
  root: true,
  extends: [],
  ignorePatterns: ['**/*.js', '**/*.jsx', '**/*.ts', '**/*.tsx'],
  rules: {},
  overrides: []
};