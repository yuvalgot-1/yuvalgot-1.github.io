-- Run this in Supabase Dashboard -> SQL Editor -> New query -> Run
-- Lets a signed-in visitor delete their own account from the account screen.
-- Their saved routes and ratings go with it (on delete cascade), and the rating
-- totals update through the ratings trigger.
--
-- Creator accounts (and any account that owns routes) cannot delete themselves:
-- their routes would be left without an owner. The site operators handle those.
--
-- Deleting from auth.users needs more rights than a visitor has, so this one function
-- is SECURITY DEFINER. The security advisor will list it as "callable by authenticated
-- users" - that is intended; it only ever deletes the caller's own account.
-- Safe to run again.

create or replace function public.delete_my_account()
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
  if public.is_creator() or exists (select 1 from public.routes where owner_id = v_user) then
    raise exception 'creator accounts are deleted by the site operators' using hint = 'creator';
  end if;
  delete from auth.users where id = v_user;
end;
$$;

revoke execute on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
