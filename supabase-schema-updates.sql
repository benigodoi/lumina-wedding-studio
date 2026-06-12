-- Run these in the Supabase SQL editor (Dashboard → SQL Editor).
-- Required for the latest app features.

-- 1. REQUIRED: weddings are now mirrored to Google Calendar; the app stores
--    the Google event id on the wedding row. Without this column every
--    wedding insert/upsert will fail.
alter table public.weddings
  add column if not exists "googleEventId" text;

-- 2. REQUIRED for persisting the sync email field on the Calendar tab.
--    (The app tolerates this column missing, but the field won't persist.)
alter table public.user_preferences
  add column if not exists sync_email text;

-- 3. RECOMMENDED: if `id` is currently the sole primary key on these tables,
--    two users syncing the same shared Google Calendar event (or seeding the
--    same demo data pre-fix) would collide. A composite key scopes ids per user.
--    Skip if you already have composite keys or surrogate keys.
--    CAUTION: the app currently upserts with onConflict: 'id'. If you apply
--    this change, the upsert targets in src/App.tsx must be changed to
--    'user_id,id' at the same time — do both together.
--
-- alter table public.weddings drop constraint weddings_pkey;
-- alter table public.weddings add primary key (user_id, id);
-- alter table public.google_events drop constraint google_events_pkey;
-- alter table public.google_events add primary key (user_id, id);

-- 4. RECOMMENDED: verify Row Level Security is enabled so users can only
--    touch their own rows.
--
-- alter table public.weddings enable row level security;
-- alter table public.google_events enable row level security;
-- alter table public.user_preferences enable row level security;
-- create policy "own rows" on public.weddings
--   for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
-- create policy "own rows" on public.google_events
--   for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
-- create policy "own rows" on public.user_preferences
--   for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
