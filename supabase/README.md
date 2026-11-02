# Supabase migrations

I apply the initial schema by opening the Supabase SQL editor for the OTCP project, pasting the full contents of `migrations/20261102170000_initial_schema.sql`, and running it once. Re-running the script is safe for most objects because it uses idempotent `IF NOT EXISTS` / `CREATE OR REPLACE` patterns.
