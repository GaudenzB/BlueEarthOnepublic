// @ts-check

/**
 * TEMPORARY SOFT MODE ESLINT CONFIG
 * 
 * This configuration is designed to prevent ESLint from blocking development
 * by downgrading problematic rules from errors to warnings.
 */

export default [
  {
    ignores: ["dist/*", "node_modules/*"]
  },
  {
    files: ["**/*.js", "**/*.jsx", "**/*.ts", "**/*.tsx"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        console: "readonly",
        process: "readonly",
      },
    },
    // Empty rules means nothing will cause errors
    rules: {
      // Downgrade commonly problematic rules to warnings
      "no-unused-vars": "warn",
      "@typescript-eslint/no-unused-vars": "warn",
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-require-imports": "warn",
      "no-undef": "warn",
      "no-case-declarations": "warn",
    },
  },
  // Node-only scripts
  {
    files: ["**/*.{js,mjs}", "scripts/**/*", "setup-*.{js,mjs}"],
    languageOptions: {
      globals: {
        console: "readonly",
        process: "readonly",
        __dirname: "readonly",
        require: "readonly",
        module: "readonly",
      },
    },
    rules: {
      "no-undef": "off", // console, process, __dirname, etc.
    },
  },
  // Jest tests
  {
    files: ["**/*.test.{ts,tsx,js}", "test/**/*.{ts,js}"],
    languageOptions: {
      globals: {
        jest: "readonly",
        test: "readonly",
        expect: "readonly",
        describe: "readonly",
        beforeEach: "readonly",
        afterEach: "readonly",
        it: "readonly",
      },
    },
  },
];