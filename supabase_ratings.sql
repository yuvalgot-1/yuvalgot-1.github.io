-- Run this in Supabase Dashboard -> SQL Editor -> New query -> Run
-- Adds 1-5 star ratings for routes, given by signed-in visitors.
-- One rating per account per route (rating again to change it). Creators
-- cannot rate their own routes. Everyone can read the average and the count.
--
-- No client-callable SECURITY DEFINER functions: the security advisor flags those.
-- Safe to run again, and also replaces the earlier version of this file.

-- 0. Remove the earlier version (rate_route / my_ratings functions and the stats view) --
drop function if exists public.rate_route(text, smallint);
drop function if exists public.my_ratings();
drop view if exists public.route_rating_stats;
drop policy if exists "anyone can read rating values" on public.route_ratings;

-- 1. Each user's own ratings ---------------------------------------------------------
create table if not exists public.route_ratings (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  route_id text not null references public.routes(id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  updated_at timestamptz not null default now(),
  primary key (user_id, route_id)
);

-- The earlier version created the table without this default, and "if not exists" above
-- leaves an existing table as it is.
alter table public.route_ratings alter column user_id set default auth.uid();

alter table public.route_ratings enable row level security;

revoke all on public.route_ratings from anon, authenticated;
grant select, insert, update, delete on public.route_ratings to authenticated;

drop policy if exists "users read own ratings" on public.route_ratings;
drop policy if exists "users rate routes" on public.route_ratings;
drop policy if exists "users change own ratings" on public.route_ratings;
drop policy if exists "users remove own ratings" on public.route_ratings;

create policy "users read own ratings"
  on public.route_ratings for select
  using (user_id = auth.uid());

-- Only published routes, and never your own.
create policy "users rate routes"
  on public.route_ratings for insert
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.routes r
      where r.id = route_id and r.published and r.owner_id is distinct from auth.uid()
    )
  );

create policy "users change own ratings"
  on public.route_ratings for update
  using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.routes r
      where r.id = route_id and r.published and r.owner_id is distinct from auth.uid()
    )
  );

create policy "users remove own ratings"
  on public.route_ratings for delete
  using (user_id = auth.uid());

-- 2. Public totals per route: who rated is never exposed ---------------------------
create table if not exists public.route_rating_totals (
  route_id text primary key references public.routes(id) on delete cascade,
  rating_count int not null,
  rating_sum int not null
);

alter table public.route_rating_totals enable row level security;

revoke all on public.route_rating_totals from anon, authenticated;
grant select on public.route_rating_totals to anon, authenticated;

drop policy if exists "anyone can read rating totals" on public.route_rating_totals;
create policy "anyone can read rating totals"
  on public.route_rating_totals for select
  using (true);

-- Keeps the totals in step with the ratings. It only runs as a trigger, so
-- nobody is allowed to call it directly.
create or replace function public.update_rating_totals()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op in ('UPDATE', 'DELETE') then
    update public.route_rating_totals
      set rating_count = rating_count - 1, rating_sum = rating_sum - old.rating
      where route_id = old.route_id;
    delete from public.route_rating_totals where route_id = old.route_id and rating_count <= 0;
  end if;
  if tg_op in ('INSERT', 'UPDATE') then
    insert into public.route_rating_totals (route_id, rating_count, rating_sum)
    values (new.route_id, 1, new.rating)
    on conflict (route_id) do update
      set rating_count = public.route_rating_totals.rating_count + 1,
          rating_sum = public.route_rating_totals.rating_sum + new.rating;
  end if;
  return null;
end;
$$;

revoke execute on function public.update_rating_totals() from public, anon, authenticated;

drop trigger if exists route_ratings_totals on public.route_ratings;
create trigger route_ratings_totals
  after insert or update or delete on public.route_ratings
  for each row execute function public.update_rating_totals();

-- Start the totals from any ratings that already exist.
insert into public.route_rating_totals (route_id, rating_count, rating_sum)
select route_id, count(*), sum(rating) from public.route_ratings group by route_id
on conflict (route_id) do update
  set rating_count = excluded.rating_count, rating_sum = excluded.rating_sum;
