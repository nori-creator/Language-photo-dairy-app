-- Lexilog — initial schema
-- Backs the in-app data model (see src/types). Row Level Security ensures
-- each user only sees their own rows. Social tables come in a later phase.

-- ---------- profiles ----------
create table if not exists profiles (
  id              uuid primary key references auth.users (id) on delete cascade,
  native_language text not null default 'ja',
  target_language text not null default 'zh-TW',
  plan            text not null default 'free' check (plan in ('free', 'pro')),
  streak          int  not null default 0,
  last_active_date date,
  habit_hour      int,
  goal_name       text,
  goal_required_words int,
  created_at      timestamptz not null default now()
);

-- ---------- categories (Pokédex groupings) ----------
create table if not exists categories (
  id           text primary key,        -- e.g. 'fruit'
  name         text not null,
  emoji        text not null,
  target_words text[] default '{}'      -- curated words → locked "?" slots
);

-- ---------- cards ----------
create table if not exists cards (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  photo_url     text,
  sticker_url   text,                    -- cut-out PNG
  target_language text not null,

  -- dictionary-sourced (authoritative)
  word          text not null,
  reading       text,
  ipa           text,
  meaning       text,
  part_of_speech text,
  level         text,

  -- AI-enriched
  examples      jsonb default '[]',
  collocations  jsonb default '[]',
  synonyms      jsonb default '[]',
  antonyms      jsonb default '[]',
  etymology     text,
  note          text,

  audio_url     text,
  category_id   text references categories (id),

  -- SRS state
  srs_ease      numeric not null default 2.5,
  srs_interval_days int not null default 0,
  srs_repetitions int not null default 0,
  srs_due_at    timestamptz not null default now(),
  srs_lapses    int not null default 0,

  -- capture metadata
  captured_at   timestamptz not null default now(),
  lat           double precision,
  lng           double precision,
  location_name text
);
create index if not exists cards_user_due_idx on cards (user_id, srs_due_at);
create index if not exists cards_user_category_idx on cards (user_id, category_id);

-- ---------- diary entries ----------
create table if not exists diary_entries (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  entry_date date not null,
  note       text,
  layout     jsonb default '{}',
  unique (user_id, entry_date)
);

create table if not exists diary_entry_cards (
  entry_id uuid references diary_entries (id) on delete cascade,
  card_id  uuid references cards (id) on delete cascade,
  x        real default 0,
  y        real default 0,
  rotation real default 0,
  scale    real default 1,
  primary key (entry_id, card_id)
);

-- ---------- daily quota ----------
create table if not exists daily_quota (
  user_id     uuid references auth.users (id) on delete cascade,
  quota_date  date not null,
  count       int not null default 0,
  primary key (user_id, quota_date)
);

-- ---------- Row Level Security ----------
alter table profiles    enable row level security;
alter table cards       enable row level security;
alter table diary_entries enable row level security;
alter table diary_entry_cards enable row level security;
alter table daily_quota enable row level security;

create policy "own profile"  on profiles      for all using (auth.uid() = id) with check (auth.uid() = id);
create policy "own cards"     on cards         for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own diary"     on diary_entries for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own quota"     on daily_quota   for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own diary cards" on diary_entry_cards for all
  using (exists (select 1 from diary_entries e where e.id = entry_id and e.user_id = auth.uid()))
  with check (exists (select 1 from diary_entries e where e.id = entry_id and e.user_id = auth.uid()));

-- categories are shared/read-only to clients
create policy "read categories" on categories for select using (true);
alter table categories enable row level security;
