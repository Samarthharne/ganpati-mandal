-- Ganpati Mandal shared backend
-- Run this once in the Supabase SQL Editor (Dashboard → SQL → New query).

create table if not exists public.shared_records (
  collection text not null,
  id text not null,
  payload jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (collection, id)
);

alter table public.shared_records enable row level security;

drop policy if exists "Allow public read" on public.shared_records;
drop policy if exists "Allow public insert" on public.shared_records;
drop policy if exists "Allow public update" on public.shared_records;
drop policy if exists "Allow public delete" on public.shared_records;

create policy "Allow public read" on public.shared_records
  for select using (true);

create policy "Allow public insert" on public.shared_records
  for insert with check (true);

create policy "Allow public update" on public.shared_records
  for update using (true);

create policy "Allow public delete" on public.shared_records
  for delete using (true);

alter table public.shared_records replica identity full;

do $$
begin
  if not exists (
    select 1
    from pg_publication_rel prel
    join pg_publication pub on pub.oid = prel.prpubid
    join pg_class rel on rel.oid = prel.prrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where pub.pubname = 'supabase_realtime'
      and nsp.nspname = 'public'
      and rel.relname = 'shared_records'
  ) then
    execute 'alter publication supabase_realtime add table public.shared_records';
  end if;
end
$$;
