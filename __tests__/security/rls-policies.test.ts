/**
 * RLS Security Policy Tests
 *
 * These tests verify that migration 016 SQL contains the expected
 * security fixes. True RLS behavior requires integration testing
 * against a running Supabase instance (supabase db reset + psql).
 *
 * What we test here:
 * - Migration file exists and contains critical fixes
 * - Fix patterns are correct (auth.uid() validation, policy splits)
 */

import * as fs from 'fs';
import * as path from 'path';

const MIGRATION_PATH = path.join(
  __dirname, '../../supabase/migrations/016_rls_security_fixes.sql',
);

let migrationSQL: string;

beforeAll(() => {
  migrationSQL = fs.readFileSync(MIGRATION_PATH, 'utf-8');
});

describe('Migration 016 — RLS Security Fixes', () => {
  it('migration file exists', () => {
    expect(fs.existsSync(MIGRATION_PATH)).toBe(true);
  });

  it('contains check_cooldown_nearby with auth.uid() validation', () => {
    expect(migrationSQL).toContain('check_cooldown_nearby');
    expect(migrationSQL).toContain('p_user_id != auth.uid()');
    expect(migrationSQL).toContain('RAISE EXCEPTION');
    expect(migrationSQL).toContain('Unauthorized');
  });

  it('contains deduct_quota with auth.uid() validation', () => {
    expect(migrationSQL).toContain('deduct_quota');
    expect(migrationSQL).toContain("p_user_id != auth.uid()::text");
  });

  it('drops the overly-broad push_tokens "own tokens" policy', () => {
    expect(migrationSQL).toContain('DROP POLICY IF EXISTS "own tokens" ON push_tokens');
  });

  it('creates separate push_tokens policies for SELECT, INSERT, UPDATE', () => {
    expect(migrationSQL).toContain('push_tokens_select');
    expect(migrationSQL).toContain('push_tokens_insert');
    expect(migrationSQL).toContain('push_tokens_update');
  });

  it('does NOT create a push_tokens DELETE policy', () => {
    // Verify no DELETE policy for push_tokens
    const lines = migrationSQL.split('\n');
    const pushDeleteLines = lines.filter(l =>
      l.includes('push_tokens') && l.includes('DELETE') && l.includes('POLICY'),
    );
    expect(pushDeleteLines).toHaveLength(0);
  });

  it('drops and recreates discoveries_update with WITH CHECK', () => {
    expect(migrationSQL).toContain('DROP POLICY IF EXISTS discoveries_update ON discoveries');
    expect(migrationSQL).toContain('CREATE POLICY discoveries_update ON discoveries');
    expect(migrationSQL).toContain('WITH CHECK (user_id = auth.uid())');
  });

  it('drops old profiles policy and creates filtered version', () => {
    expect(migrationSQL).toContain('DROP POLICY IF EXISTS "Profiles are viewable by all auth users"');
    expect(migrationSQL).toContain('profiles_select');
    expect(migrationSQL).toContain('deletion_requested_at IS NULL');
  });

  it('uses SECURITY DEFINER for check_cooldown_nearby function', () => {
    // Match the CREATE OR REPLACE FUNCTION ... SECURITY DEFINER pattern
    expect(migrationSQL).toMatch(/check_cooldown_nearby[\s\S]*?SECURITY DEFINER/);
  });

  it('uses SECURITY DEFINER for deduct_quota function', () => {
    expect(migrationSQL).toMatch(/deduct_quota[\s\S]*?SECURITY DEFINER/);
  });
});
