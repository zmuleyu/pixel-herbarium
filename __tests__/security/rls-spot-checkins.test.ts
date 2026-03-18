// __tests__/security/rls-spot-checkins.test.ts
import * as fs from 'fs';
import * as path from 'path';

const SQL_PATH = path.join(__dirname, '../../supabase/migrations/021_sakura_spots.sql');

let sql: string;
beforeAll(() => { sql = fs.readFileSync(SQL_PATH, 'utf-8'); });

describe('Migration 021 — sakura_spots', () => {
  it('file exists', () => expect(fs.existsSync(SQL_PATH)).toBe(true));

  it('creates sakura_spots with INTEGER primary key', () => {
    expect(sql).toContain('CREATE TABLE sakura_spots');
    expect(sql).toContain('id                INTEGER PRIMARY KEY');
  });

  it('uses 4-date BloomWindow columns', () => {
    expect(sql).toContain('bloom_early_start');
    expect(sql).toContain('bloom_peak_start');
    expect(sql).toContain('bloom_peak_end');
    expect(sql).toContain('bloom_late_end');
  });

  it('adds PostGIS geography column', () => {
    expect(sql).toContain("GEOGRAPHY(Point, 4326)");
    expect(sql).toContain('GIST (location)');
  });

  it('enables RLS on sakura_spots', () => {
    expect(sql).toContain('ALTER TABLE sakura_spots ENABLE ROW LEVEL SECURITY');
  });
});

describe('Migration 021 — spot_checkins', () => {
  it('spot_id is INTEGER (matches sakura_spots.id type)', () => {
    expect(sql).toContain('spot_id                 INTEGER');
  });

  it('has stamp_variant CHECK constraint', () => {
    expect(sql).toContain("CHECK (stamp_variant IN ('normal', 'mankai'))");
  });

  it('has bloom_status CHECK constraint with correct values', () => {
    expect(sql).toContain("CHECK (bloom_status_at_checkin IN ('pre','budding','partial','peak','falling','ended'))");
  });

  it('has UNIQUE constraint on (user_id, spot_id)', () => {
    expect(sql).toContain('UNIQUE (user_id, spot_id)');
  });

  it('enables RLS on spot_checkins', () => {
    expect(sql).toContain('ALTER TABLE spot_checkins ENABLE ROW LEVEL SECURITY');
  });
});

describe('Migration 021 — checkin_spot RPC', () => {
  it('creates checkin_spot function', () => {
    expect(sql).toContain('CREATE OR REPLACE FUNCTION checkin_spot');
  });

  it('uses SECURITY DEFINER', () => {
    expect(sql).toContain('SECURITY DEFINER');
  });

  it('uses xmax trick to detect new rows', () => {
    expect(sql).toContain('xmax = 0');
  });

  it('uses upsert before quota UPDATE (prevents silent no-op)', () => {
    const upsertIdx = sql.indexOf('INSERT INTO user_quotas');
    const updateIdx = sql.indexOf('UPDATE user_quotas');
    expect(upsertIdx).toBeGreaterThan(-1);
    expect(updateIdx).toBeGreaterThan(upsertIdx);
  });

  it('uses jsonb_build_object for pg_cron headers (not string concat in JSON literal)', () => {
    expect(sql).toContain('jsonb_build_object(');
    expect(sql).not.toContain("headers := '{\"Authorization");
  });

  it('guards against unauthenticated calls (auth.uid() NULL check)', () => {
    expect(sql).toContain('v_uid IS NULL');
  });
});
