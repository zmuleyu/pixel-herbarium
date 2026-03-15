#!/usr/bin/env node
// Pre-build validation: checks env vars, runs typecheck and tests.
// Usage: npm run build:validate

import { execSync } from 'node:child_process';

const REQUIRED_ENV = ['EXPO_PUBLIC_SUPABASE_URL', 'EXPO_PUBLIC_SUPABASE_ANON_KEY'];

let failed = false;

// 1. Check required env vars (warning only — EAS injects them at build time)
console.log('--- Checking environment variables ---');
const missing = REQUIRED_ENV.filter((v) => !process.env[v]);
if (missing.length > 0) {
  console.warn(`WARNING: Missing env vars (OK if running in EAS): ${missing.join(', ')}`);
} else {
  console.log('All required env vars present.');
}

// 2. TypeScript check
console.log('\n--- Running typecheck ---');
try {
  execSync('npx tsc --noEmit', { stdio: 'inherit' });
  console.log('TypeScript check passed.');
} catch {
  console.error('FAIL: TypeScript errors found');
  failed = true;
}

// 3. Tests
console.log('\n--- Running tests ---');
try {
  execSync('npx jest --ci --passWithNoTests', { stdio: 'inherit' });
} catch {
  console.error('FAIL: Tests failed');
  failed = true;
}

if (failed) {
  console.error('\nBuild validation FAILED. Fix errors before building.');
  process.exit(1);
}
console.log('\nBuild validation PASSED.');
