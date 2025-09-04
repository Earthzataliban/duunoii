import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [{
  ignores: [
    "node_modules/**", 
    ".next/**", 
    "out/**", 
    "build/**", 
    "next-env.d.ts",
    "coverage/**",
    "jest.config.js"
  ]
}, ...compat.extends('next/core-web-vitals', 'next/typescript'), {
  rules: {
    '@typescript-eslint/no-empty-object-type': 'off',
    '@typescript-eslint/no-require-imports': 'off',
  },
}];

export default eslintConfig;
