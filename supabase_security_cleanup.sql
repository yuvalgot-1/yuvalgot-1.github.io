-- Run this in Supabase Dashboard -> SQL Editor -> New query -> Run
-- Security cleanup from the 14-point review (2026-11-23). Safe to run again.

-- 1. Remove the old anonymous likes/ratings (supabase_reactions.sql).
-- The app stopped using them when ratings moved to signed-in accounts
-- (supabase_ratings.sql), but set_reaction() is still callable by anyone
-- without signing in. Each call with a new random device id adds a row, so a
-- script could fill the database (500MB on the free plan).
drop function if exists public.set_reaction(text, text, smallint, boolean);
drop view if exists public.route_stats;
drop table if exists public.route_reactions;

-- 2. Listing the image bucket: creators only.
-- supabase_image_flags.sql re-creates a policy that lets ANY signed-in account
-- list every file in the bucket. If it ran after supabase_accounts.sql, a visitor
-- who registers can list file names, including photos of draft routes.
-- (Viewing a single image by its URL still works for everyone: the bucket is public.)
drop policy if exists "authenticated users can list route images" on storage.objects;
drop policy if exists "creators can list route images" on storage.objects;
create policy "creators can list route images"
  on storage.objects for select
  using (bucket_id = 'route-images' and public.is_creator());

-- 3. Check that every table in public has RLS on (should return no rows).
select tablename from pg_tables where schemaname = 'public' and not rowsecurity;
