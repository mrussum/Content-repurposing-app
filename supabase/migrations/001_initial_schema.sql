-- Enable required extensions
create extension if not exists "pgcrypto";

-- ─── profiles ────────────────────────────────────────────────────────────────
create table public.profiles (
  id                      uuid references auth.users on delete cascade primary key,
  email                   text not null,
  full_name               text,
  avatar_url              text,
  plan                    text not null default 'free'
                            check (plan in ('free', 'pro', 'agency')),
  stripe_customer_id      text unique,
  stripe_subscription_id  text unique,
  generations_used        int not null default 0,
  generations_reset_at    timestamptz not null default now(),
  has_onboarded           boolean not null default false,
  buffer_access_token     text,
  created_at              timestamptz default now(),
  updated_at              timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- ─── brand_voices ─────────────────────────────────────────────────────────────
create table public.brand_voices (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references public.profiles(id) on delete cascade not null,
  name        text not null default 'My Brand Voice',
  samples     text[] not null,
  summary     text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

alter table public.brand_voices enable row level security;

create policy "Users can manage own brand voices"
  on public.brand_voices for all
  using (auth.uid() = user_id);

-- ─── generations ──────────────────────────────────────────────────────────────
create table public.generations (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references public.profiles(id) on delete cascade not null,
  content_input   text not null,
  result          jsonb not null,
  tone            text not null,
  audience        text not null,
  brand_voice_id  uuid references public.brand_voices(id) on delete set null,
  word_count      int,
  created_at      timestamptz default now()
);

alter table public.generations enable row level security;

create policy "Users can manage own generations"
  on public.generations for all
  using (auth.uid() = user_id);

-- ─── published_posts ──────────────────────────────────────────────────────────
create table public.published_posts (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references public.profiles(id) on delete cascade not null,
  generation_id   uuid references public.generations(id) on delete set null,
  platform        text not null,
  content         text not null,
  buffer_post_id  text,
  status          text not null default 'draft'
                    check (status in ('draft', 'scheduled', 'published', 'failed')),
  scheduled_at    timestamptz,
  published_at    timestamptz,
  created_at      timestamptz default now()
);

alter table public.published_posts enable row level security;

create policy "Users can manage own published posts"
  on public.published_posts for all
  using (auth.uid() = user_id);

-- ─── Triggers ─────────────────────────────────────────────────────────────────

-- Auto-create profile row on new user signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Auto-update updated_at timestamps
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();

create trigger brand_voices_updated_at
  before update on public.brand_voices
  for each row execute procedure public.handle_updated_at();

-- ─── Helper RPC ───────────────────────────────────────────────────────────────

-- Used by the regenerate API to update a single format key in generations.result
create or replace function public.update_generation_format(
  p_generation_id uuid,
  p_format_key    text,
  p_new_value     jsonb
)
returns void
language plpgsql
security definer
as $$
begin
  update public.generations
  set result = jsonb_set(result, array[p_format_key], p_new_value, true)
  where id = p_generation_id
    and user_id = auth.uid();
end;
$$;

-- ─── Indexes ──────────────────────────────────────────────────────────────────
create index generations_user_id_created_at on public.generations(user_id, created_at desc);
create index published_posts_user_id_status on public.published_posts(user_id, status);
create index brand_voices_user_id on public.brand_voices(user_id);
