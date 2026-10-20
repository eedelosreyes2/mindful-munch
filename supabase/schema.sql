create table public.snacks (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  text text not null,
  reason text,
  logged_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index snacks_user_id_logged_at_idx on public.snacks (user_id, logged_at);

alter table public.snacks enable row level security;

create policy "Users can read their own snacks"
  on public.snacks for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can add their own snacks"
  on public.snacks for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can edit their own snacks"
  on public.snacks for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own snacks"
  on public.snacks for delete to authenticated
  using ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.snacks to authenticated;
