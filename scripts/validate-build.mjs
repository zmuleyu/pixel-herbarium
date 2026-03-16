#!/usr/bin/env node
// Pre-build validation: checks env vars, assets, submit config, typecheck and tests.
// Usage: npm run build:validate

import { execSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';

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

// 2. Check EAS submit credentials
console.log('\n--- Checking EAS submit config ---');
try {
  const eas = JSON.parse(readFileSync('eas.json', 'utf8'));
  const ios = eas?.submit?.production?.ios;
  const creds = ['appleId', 'ascAppId', 'appleTeamId'];
  const emptyCreds = creds.filter((k) => !ios?.[k]);
  if (emptyCreds.length > 0) {
    console.warn(`WARNING: Empty EAS submit fields: ${emptyCreds.join(', ')}`);
    console.warn('  Fill these in eas.json before running eas submit.');
  } else {
    console.log('EAS submit credentials configured.');
  }
} catch {
  console.warn('WARNING: Could not read eas.json');
}

// 3. Check required assets
console.log('\n--- Checking assets ---');
const requiredAssets = ['assets/icon.png', 'assets/splash-icon.png'];
for (const asset of requiredAssets) {
  if (existsSync(asset)) {
    console.log(`  ✓ ${asset}`);
  } else {
    console.error(`  ✗ ${asset} MISSING`);
    failed = true;
  }
}

// 4. TypeScript check
console.log('\n--- Running typecheck ---');
try {
  execSync('npx tsc --noEmit', { stdio: 'inherit' });
  console.log('TypeScript check passed.');
} catch {
  console.error('FAIL: TypeScript errors found');
  failed = true;
}

// 5. Tests
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
