-- Run this once in your Supabase project: SQL Editor > New query > paste > Run.
-- One row per signed-in user, holding their whole Tally data blob.

create table if not exists public.tally_data (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null default '{"courses": []}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.tally_data enable row level security;

create policy "Users can read their own tally_data"
  on public.tally_data for select
  using (auth.uid() = user_id);

create policy "Users can insert their own tally_data"
  on public.tally_data for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own tally_data"
  on public.tally_data for update
  using (auth.uid() = user_id);
