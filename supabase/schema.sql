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

-- Web push subscriptions for the weekly insight, one row per browser/device.
create table public.push_subscriptions (
  endpoint text primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  p256dh text not null,
  auth text not null,
  time_zone text not null,
  rotation_index integer not null default 0,
  last_sent_week text,
  created_at timestamptz not null default now()
);

alter table public.push_subscriptions enable row level security;

create policy "Users can read their own push subscriptions"
  on public.push_subscriptions for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can add their own push subscriptions"
  on public.push_subscriptions for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own push subscriptions"
  on public.push_subscriptions for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own push subscriptions"
  on public.push_subscriptions for delete to authenticated
  using ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.push_subscriptions to authenticated;
