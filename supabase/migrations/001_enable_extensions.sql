-- Enable required PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS postgis;      -- Geospatial queries (ST_DWithin, GEOGRAPHY)
CREATE EXTENSION IF NOT EXISTS btree_gist;   -- GiST index support for DATERANGE
CREATE EXTENSION IF NOT EXISTS pg_cron;      -- Scheduled jobs (monthly quota reset)
