/**
 * Lint-staged Configuration
 * 
 * This configuration runs ESLint and Prettier on staged files before commits,
 * ensuring that only formatted and lint-error free code is committed.
 */

module.exports = {
  // JavaScript and TypeScript files
  "*.{js,jsx,ts,tsx}": [
    "eslint --fix --max-warnings=0",
    "prettier --write"
  ],
  
  // Style files
  "*.{css,scss}": [
    "prettier --write"
  ],
  
  // Data files
  "*.{json,yaml,yml}": [
    "prettier --write"
  ],
  
  // Markdown and documentation
  "*.{md,mdx}": [
    "prettier --write"
  ],
  
  // HTML files
  "*.html": [
    "prettier --write"
  ]
};