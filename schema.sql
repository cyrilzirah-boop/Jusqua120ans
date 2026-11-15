-- jusqua120ans : schéma Supabase (base de données partagée de l'appli)
create table if not exists public.docs(
  path text primary key,
  parent text not null,
  id text not null,
  data jsonb not null default '{}'::jsonb,
  owner uuid default auth.uid(),
  updated_at timestamptz not null default now()
);
create index if not exists docs_parent_idx on public.docs(parent);
create table if not exists public.couple_members(
  code text not null, uid uuid not null default auth.uid(), joined_at timestamptz default now(),
  primary key(code,uid)
);
create table if not exists public.admins(uid uuid primary key);

alter table public.docs enable row level security;
alter table public.couple_members enable row level security;
alter table public.admins enable row level security;

create or replace function public.is_member(c text) returns boolean
language sql stable security definer set search_path=public as $$
  select exists(select 1 from couple_members where code=c and uid=auth.uid())
$$;
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path=public as $$
  select exists(select 1 from admins where uid=auth.uid())
$$;
-- rejoindre l'espace d'un couple (famille : 8 membres maximum)
create or replace function public.join_couple(c text) returns jsonb
language plpgsql security definer set search_path=public as $$
declare n int; d jsonb;
begin
  if auth.uid() is null or c !~ '^[a-z0-9]{4,10}$' then return null; end if;
  if not exists(select 1 from couple_members where code=c and uid=auth.uid()) then
    select count(*) into n from couple_members where code=c;
    if n >= 8 then raise exception 'espace complet'; end if;
    insert into couple_members(code,uid) values(c,auth.uid());
  end if;
  select data into d from docs where path='couples/'||c;
  return d;
end $$;
grant execute on function public.join_couple(text) to authenticated;

create policy members_self on public.couple_members for select to authenticated using (uid=auth.uid());
create policy admins_self on public.admins for select to authenticated using (uid=auth.uid());

create policy docs_read on public.docs for select to authenticated using (
  parent in ('actu','notes','cercle')
  or (path like 'couples/%' and public.is_member(split_part(path,'/',2)))
  or path like 'data/users/'||auth.uid()::text||'/%'
);
create policy docs_insert on public.docs for insert to authenticated with check (
  path = 'notes/'||auth.uid()::text
  or path = 'cercle/'||auth.uid()::text
  or path like 'data/users/'||auth.uid()::text||'/%'
  or (path like 'couples/%' and public.is_member(split_part(path,'/',2)))
  or (parent='actu' and public.is_admin())
);
create policy docs_update on public.docs for update to authenticated using (
  path = 'notes/'||auth.uid()::text
  or path = 'cercle/'||auth.uid()::text
  or path like 'data/users/'||auth.uid()::text||'/%'
  or (path like 'couples/%' and public.is_member(split_part(path,'/',2)))
  or (parent='actu' and public.is_admin())
);
create policy docs_delete on public.docs for delete to authenticated using (
  path = 'cercle/'||auth.uid()::text
  or path like 'data/users/'||auth.uid()::text||'/%'
  or (path like 'couples/%' and public.is_member(split_part(path,'/',2)))
  or ((parent='cercle' or parent='actu') and public.is_admin())
);
-- temps réel
alter publication supabase_realtime add table public.docs;
alter table public.docs replica identity full;
