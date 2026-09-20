-- Run this in Supabase Dashboard -> SQL Editor -> New query -> Run
-- Adds 1-5 star ratings for routes, given by signed-in visitors.
-- One rating per account per route (rating again to change it). Creators
-- cannot rate their own routes. Everyone can read the average and the count.

create table if not exists public.route_ratings (
  user_id uuid not null references auth.users(id) on delete cascade,
  route_id text not null references public.routes(id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  updated_at timestamptz not null default now(),
  primary key (user_id, route_id)
);

alter table public.route_ratings enable row level security;

-- Nobody touches the table directly; writes go through rate_route() below.
-- Visitors may read only the non-identifying columns, which is enough for the average.
revoke all on public.route_ratings from anon, authenticated;
grant select (route_id, rating) on public.route_ratings to anon, authenticated;

drop policy if exists "anyone can read rating values" on public.route_ratings;
create policy "anyone can read rating values"
  on public.route_ratings for select
  using (true);

-- Average and count per route (runs with the caller's permissions).
create or replace view public.route_rating_stats as
select
  route_id,
  count(*)::int as rating_count,
  round(avg(rating), 1)::float as rating_avg
from public.route_ratings
group by route_id;

alter view public.route_rating_stats set (security_invoker = true);
grant select on public.route_rating_stats to anon, authenticated;

-- Give (or change) the signed-in user's rating. A null rating removes it.
create or replace function public.rate_route(p_route_id text, p_rating smallint)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then
    raise exception 'not signed in';
  end if;
  if not exists (
    select 1 from public.routes
    where id = p_route_id and published and owner_id is distinct from v_user
  ) then
    raise exception 'route not found';
  end if;
  if p_rating is null then
    delete from public.route_ratings where user_id = v_user and route_id = p_route_id;
    return;
  end if;
  if p_rating < 1 or p_rating > 5 then
    raise exception 'rating must be 1-5';
  end if;
  insert into public.route_ratings (user_id, route_id, rating, updated_at)
  values (v_user, p_route_id, p_rating, now())
  on conflict (user_id, route_id) do update
    set rating = excluded.rating, updated_at = now();
end;
$$;

-- The ratings the signed-in user already gave (to show their stars).
create or replace function public.my_ratings()
returns table (route_id text, rating smallint)
language sql
stable
security definer
set search_path = ''
as $$
  select route_id, rating from public.route_ratings where user_id = auth.uid();
$$;

revoke execute on function public.rate_route(text, smallint) from public, anon;
revoke execute on function public.my_ratings() from public, anon;
grant execute on function public.rate_route(text, smallint) to authenticated;
grant execute on function public.my_ratings() to authenticated;
