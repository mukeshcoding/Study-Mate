-- StudyMate's Base44-independent database schema.
-- Apply this to a new Supabase project before pointing the app at it.

create extension if not exists pgcrypto;

create or replace function public.set_updated_date()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_date = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null default '',
  education_level text not null default '',
  avatar_url text not null default '',
  theme text not null default 'dark' check (theme in ('dark', 'light', 'system')),
  notifications_enabled boolean not null default true,
  daily_goal_minutes integer not null default 120 check (daily_goal_minutes > 0),
  daily_study_minutes integer not null default 0 check (daily_study_minutes >= 0),
  daily_study_day date,
  goal_met_day date,
  xp integer not null default 0 check (xp >= 0),
  level integer not null default 1 check (level >= 1),
  current_streak integer not null default 0 check (current_streak >= 0),
  longest_streak integer not null default 0 check (longest_streak >= 0),
  last_study_day date,
  focus_preset text not null default '25/5',
  onboarding_complete boolean not null default false,
  earned_achievements jsonb not null default '[]'::jsonb,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now()
);

create or replace function public.create_studymate_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'full_name', '')
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = case
          when public.profiles.full_name = '' then excluded.full_name
          else public.profiles.full_name
        end;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_studymate on auth.users;
create trigger on_auth_user_created_studymate
  after insert or update of email on auth.users
  for each row execute function public.create_studymate_profile();

create table if not exists public.subjects (
  id text primary key default gen_random_uuid()::text,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  color text not null default 'indigo',
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  unique (id, user_id)
);

create table if not exists public.tasks (
  id text primary key default gen_random_uuid()::text,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  notes text,
  due_date timestamptz,
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high', 'urgent')),
  subject_id text,
  subject_name text,
  completed boolean not null default false,
  completed_date timestamptz,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now()
);

create table if not exists public.exams (
  id text primary key default gen_random_uuid()::text,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  subject_id text,
  subject_name text,
  exam_date timestamptz not null,
  notes text,
  completed boolean not null default false,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now()
);

create table if not exists public.study_sessions (
  id text primary key default gen_random_uuid()::text,
  user_id uuid not null references auth.users(id) on delete cascade,
  subject_id text,
  subject_name text,
  duration_minutes integer not null check (duration_minutes >= 0),
  started_at timestamptz,
  completed_at timestamptz,
  preset text,
  completed boolean not null default true,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now()
);

create table if not exists public.habits (
  id text primary key default gen_random_uuid()::text,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  frequency text not null default 'daily' check (frequency in ('daily', 'weekly')),
  color text not null default 'indigo',
  icon text not null default 'Check',
  target_per_week integer not null default 7 check (target_per_week > 0),
  active boolean not null default true,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  unique (id, user_id)
);

create table if not exists public.habit_logs (
  id text primary key default gen_random_uuid()::text,
  user_id uuid not null references auth.users(id) on delete cascade,
  habit_id text not null,
  date date not null,
  completed boolean not null default true,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  constraint habit_logs_own_habit foreign key (habit_id, user_id)
    references public.habits(id, user_id) on delete cascade
);

create table if not exists public.notes (
  id text primary key default gen_random_uuid()::text,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  content text,
  subject_id text,
  subject_name text,
  pinned boolean not null default false,
  color text not null default 'indigo',
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now()
);

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'profiles', 'subjects', 'tasks', 'exams', 'study_sessions', 'habits', 'habit_logs', 'notes'
  ] loop
    execute format('drop trigger if exists set_updated_date on public.%I', table_name);
    execute format(
      'create trigger set_updated_date before update on public.%I for each row execute function public.set_updated_date()',
      table_name
    );
  end loop;
end;
$$;

alter table public.profiles enable row level security;
alter table public.subjects enable row level security;
alter table public.tasks enable row level security;
alter table public.exams enable row level security;
alter table public.study_sessions enable row level security;
alter table public.habits enable row level security;
alter table public.habit_logs enable row level security;
alter table public.notes enable row level security;

drop policy if exists "Users can view their own profile" on public.profiles;
create policy "Users can view their own profile" on public.profiles
  for select to authenticated using (id = (select auth.uid()));
drop policy if exists "Users can update safe profile fields" on public.profiles;
create policy "Users can update safe profile fields" on public.profiles
  for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));
grant select on public.profiles to authenticated;
revoke update on public.profiles from authenticated;
grant update (
  full_name, education_level, avatar_url, theme, notifications_enabled,
  daily_goal_minutes, daily_study_minutes, daily_study_day, goal_met_day,
  xp, level, current_streak, longest_streak, last_study_day, focus_preset,
  onboarding_complete, earned_achievements
) on public.profiles to authenticated;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'subjects', 'tasks', 'exams', 'study_sessions', 'habits', 'habit_logs', 'notes'
  ] loop
    execute format('grant select, insert, update, delete on public.%I to authenticated', table_name);
    execute format('drop policy if exists "Users own rows" on public.%I', table_name);
    execute format(
      'create policy "Users own rows" on public.%I for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()))',
      table_name
    );
  end loop;
end;
$$;

create index if not exists subjects_user_created_idx on public.subjects (user_id, created_date desc);
create index if not exists tasks_user_created_idx on public.tasks (user_id, created_date desc);
create index if not exists tasks_user_due_idx on public.tasks (user_id, due_date);
create index if not exists exams_user_date_idx on public.exams (user_id, exam_date);
create index if not exists sessions_user_created_idx on public.study_sessions (user_id, created_date desc);
create index if not exists habits_user_created_idx on public.habits (user_id, created_date desc);
create index if not exists habit_logs_user_date_idx on public.habit_logs (user_id, date);
create index if not exists habit_logs_habit_date_idx on public.habit_logs (habit_id, date);
create index if not exists notes_user_created_idx on public.notes (user_id, created_date desc);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 10485760, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Users upload their own avatars" on storage.objects;
create policy "Users upload their own avatars" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
drop policy if exists "Users update their own avatars" on storage.objects;
create policy "Users update their own avatars" on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
drop policy if exists "Users delete their own avatars" on storage.objects;
create policy "Users delete their own avatars" on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
