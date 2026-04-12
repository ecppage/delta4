-- Delta4 MVP Schema
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)

-- ══════════════════════════════════════
-- PROFILES (extends Supabase auth.users)
-- ══════════════════════════════════════
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  display_name text,
  timezone text default 'America/New_York',
  weekly_email_enabled boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert with check (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ══════════════════════════════════════
-- TASKS
-- ══════════════════════════════════════
create table public.tasks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  category text not null default 'revenue',
  st integer not null default 5 check (st >= 1 and st <= 10),
  lt integer not null default 5 check (lt >= 1 and lt <= 10),
  delta numeric generated always as (round((st * 0.4 + lt * 0.6)::numeric, 1)) stored,
  date date not null default current_date,
  duration integer, -- minutes
  recurrence text default 'none' check (recurrence in ('none','daily','weekdays','weekly','biweekly','monthly','quarterly')),
  recurrence_end date,
  is_deleted boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.tasks enable row level security;

create policy "Users can CRUD own tasks"
  on public.tasks for all using (auth.uid() = user_id);

create index idx_tasks_user_date on public.tasks(user_id, date);
create index idx_tasks_user_active on public.tasks(user_id) where is_deleted = false;


-- ══════════════════════════════════════
-- COMPLETIONS
-- ══════════════════════════════════════
create table public.completions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  task_id uuid references public.tasks(id) on delete cascade not null,
  completed_date date not null,
  delta_earned numeric not null,
  created_at timestamptz default now(),
  unique(task_id, completed_date)
);

alter table public.completions enable row level security;

create policy "Users can CRUD own completions"
  on public.completions for all using (auth.uid() = user_id);

create index idx_completions_user_date on public.completions(user_id, completed_date);


-- ══════════════════════════════════════
-- WEEKLY SNAPSHOTS (for email digests)
-- ══════════════════════════════════════
create table public.weekly_snapshots (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  week_start date not null,
  week_end date not null,
  tasks_planned integer default 0,
  tasks_completed integer default 0,
  delta_planned numeric default 0,
  delta_earned numeric default 0,
  top_category text,
  top_task_title text,
  top_task_delta numeric,
  category_breakdown jsonb default '{}',
  created_at timestamptz default now(),
  unique(user_id, week_start)
);

alter table public.weekly_snapshots enable row level security;

create policy "Users can view own snapshots"
  on public.weekly_snapshots for select using (auth.uid() = user_id);

create policy "Service can insert snapshots"
  on public.weekly_snapshots for insert with check (true);


-- ══════════════════════════════════════
-- HELPER VIEWS
-- ══════════════════════════════════════

-- Daily summary for analytics
create or replace view public.daily_stats as
select
  c.user_id,
  c.completed_date as date,
  count(*) as tasks_completed,
  sum(c.delta_earned) as delta_earned
from public.completions c
group by c.user_id, c.completed_date;


-- Updated_at auto-touch
create or replace function public.touch_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger tasks_updated_at
  before update on public.tasks
  for each row execute procedure public.touch_updated_at();

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.touch_updated_at();
