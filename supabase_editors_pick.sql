-- Run this in Supabase Dashboard -> SQL Editor -> New query -> Run
-- Adds an is_featured flag so creators can mark a route as "בחירת
-- העורכים" (editor's pick). No RLS changes needed: the existing
-- "creators can update routes" policy from supabase_accounts.sql
-- already lets any allow-listed creator update this column.

alter table public.routes add column if not exists is_featured boolean not null default false;
