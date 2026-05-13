// ESLint flat config. The headline rule is `no-restricted-syntax` on
// raw <button> in JSX outside `components/common/`: every clickable should
// import Button or IconButton from common (see docs/contributing.md and
// docs/ui-design-system.md).
//
// The rule is OFF for:
//   - components/common/**           — the primitives themselves
//   - components/{Toaster,ConfirmDialog}.tsx — infrastructure overlays
//   - **/__tests__/**                — tests use raw DOM regularly
//   - api/**, scripts/**             — server/build code, no JSX
//
// Six panel files have intentional inline disables for bespoke chrome
// (canvas pill buttons, math/text block drag handles, collapsible tree
// disclosures, mode pickers). Each disable carries a one-line rationale.

import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import reactPlugin from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';

const NO_RAW_BUTTON = {
  selector: "JSXOpeningElement[name.name='button']",
  message:
    'Use Button or IconButton from src/components/common/ instead of a raw <button>. ' +
    'If this is intentional chrome (canvas pill, etc.), add an // eslint-disable-next-line no-restricted-syntax comment with a one-line rationale.',
};

export default [
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'public/**',
      'functions/**',
      'coverage/**',
      '**/*.d.ts',
    ],
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
      globals: {
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        navigator: 'readonly',
        location: 'readonly',
        fetch: 'readonly',
        crypto: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        requestAnimationFrame: 'readonly',
        cancelAnimationFrame: 'readonly',
        matchMedia: 'readonly',
        prompt: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      react: reactPlugin,
      'react-hooks': reactHooks,
    },
    settings: { react: { version: 'detect' } },
    linterOptions: {
      // Pre-existing files carry `// eslint-disable-next-line` comments
      // for rules we don't enable here (e.g. @typescript-eslint/no-any).
      // Don't surface those as warnings.
      reportUnusedDisableDirectives: 'off',
    },
    rules: {
      'no-restricted-syntax': ['error', NO_RAW_BUTTON],
      'react-hooks/rules-of-hooks': 'error',
      // 'react-hooks/exhaustive-deps' is intentionally off — the team
      // has audited every hook and many are deliberately stable.
    },
  },
  // Primitive layer: the rule's whole point is that THIS folder owns
  // <button> styling. Turn the rule off here.
  {
    files: ['src/components/common/**/*.{ts,tsx}'],
    rules: { 'no-restricted-syntax': 'off' },
  },
  // Chrome infrastructure that lives outside common/ for legacy reasons.
  {
    files: [
      'src/components/Toaster.tsx',
      'src/components/ConfirmDialog.tsx',
    ],
    rules: { 'no-restricted-syntax': 'off' },
  },
  // Tests reach into the DOM directly.
  {
    files: ['**/__tests__/**', '**/*.test.{ts,tsx}'],
    rules: { 'no-restricted-syntax': 'off' },
  },
];
