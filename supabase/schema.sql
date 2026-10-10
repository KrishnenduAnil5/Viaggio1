-- ====================================================================
-- VIAGGIO: DATABASE SCHEMA & ROW LEVEL SECURITY SETUP
-- Project: Viaggio Visa Management
-- ====================================================================

-- 1. EXTENSIONS
create extension if not exists "uuid-ossp";

-- 2. ENUMS & DOMAINS
do $$ begin
  create type user_role as enum ('user', 'admin');
exception
  when duplicate_object then null;
end $$;

-- 3. PROFILES TABLE
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null unique,
  full_name text,
  role user_role not null default 'user',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 4. VISA REMINDERS (TRACKING EXISTING VISAS & EXPIRIES)
create table if not exists public.visa_reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  country text not null,
  visa_type text not null,
  issue_date date not null,
  expiry_date date not null,
  reminder_intervals integer[] not null default '{90, 60, 30}',
  status text not null default 'valid',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 5. PASSPORT DETAILS & REMINDERS
create table if not exists public.passport_details (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  issuing_country text not null,
  passport_number text not null,
  issue_date date not null,
  expiry_date date not null,
  reminder_intervals integer[] not null default '{180, 90, 30}',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 6. VISA APPLICATIONS (JOURNEY TRACKING)
create table if not exists public.visa_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  country text not null,
  visa_type text not null,
  reference_number text,
  status text not null default 'in_progress',
  current_stage text not null default 'Application Created',
  submission_date date,
  estimated_decision_date date,
  notes text,
  internal_admin_notes text,
  is_urgent boolean not null default false,
  urgent_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 7. VISA JOURNEY STEPS
create table if not exists public.visa_journey_steps (
  id uuid primary key default gen_random_uuid(),
  application_id uuid references public.visa_applications(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  step_order integer not null,
  step_title text not null,
  step_description text,
  status text not null default 'pending', -- 'completed', 'current', 'pending'
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

-- 8. APPLICATION UPDATES (ADMIN & VERIFIED FEED)
create table if not exists public.application_updates (
  id uuid primary key default gen_random_uuid(),
  application_id uuid references public.visa_applications(id) on delete cascade not null,
  author_id uuid references auth.users(id) on delete set null,
  title text not null,
  message text not null,
  is_internal_note boolean not null default false,
  created_at timestamptz not null default now()
);

-- 9. USER DOCUMENTS
create table if not exists public.user_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  application_id uuid references public.visa_applications(id) on delete set null,
  file_name text not null,
  file_path text not null,
  file_size integer not null default 0,
  file_type text not null,
  category text not null default 'other',
  status text not null default 'verified',
  admin_comment text,
  created_at timestamptz not null default now()
);

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.visa_reminders enable row level security;
alter table public.passport_details enable row level security;
alter table public.visa_applications enable row level security;
alter table public.visa_journey_steps enable row level security;
alter table public.application_updates enable row level security;
alter table public.user_documents enable row level security;

-- Helper function to check if current authenticated user is an administrator
create or replace function public.is_admin()
returns boolean language sql security definer as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- PROFILES POLICIES
-- Users can read their own profile; Admins can read all profiles
create policy "Users and admins can view profiles"
  on public.profiles for select
  using (auth.uid() = id or public.is_admin());

-- Users can insert their own profile on signup
create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Users can update their own profile (name, avatar), but non-admins cannot change role
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id or public.is_admin())
  with check (
    auth.uid() = id or public.is_admin()
  );

-- VISA REMINDERS POLICIES
create policy "Users can view own visa reminders"
  on public.visa_reminders for select
  using (auth.uid() = user_id or public.is_admin());

create policy "Users can insert own visa reminders"
  on public.visa_reminders for insert
  with check (auth.uid() = user_id);

create policy "Users can update own visa reminders"
  on public.visa_reminders for update
  using (auth.uid() = user_id or public.is_admin());

create policy "Users can delete own visa reminders"
  on public.visa_reminders for delete
  using (auth.uid() = user_id or public.is_admin());

-- PASSPORT DETAILS POLICIES
create policy "Users can view own passport details"
  on public.passport_details for select
  using (auth.uid() = user_id or public.is_admin());

create policy "Users can insert own passport details"
  on public.passport_details for insert
  with check (auth.uid() = user_id);

create policy "Users can update own passport details"
  on public.passport_details for update
  using (auth.uid() = user_id or public.is_admin());

create policy "Users can delete own passport details"
  on public.passport_details for delete
  using (auth.uid() = user_id or public.is_admin());

-- VISA APPLICATIONS POLICIES
create policy "Users can view own applications"
  on public.visa_applications for select
  using (auth.uid() = user_id or public.is_admin());

create policy "Users can insert own applications"
  on public.visa_applications for insert
  with check (auth.uid() = user_id);

create policy "Users and admins can update applications"
  on public.visa_applications for update
  using (auth.uid() = user_id or public.is_admin());

create policy "Users can delete own applications"
  on public.visa_applications for delete
  using (auth.uid() = user_id or public.is_admin());

-- VISA JOURNEY STEPS POLICIES
create policy "Users can view own journey steps"
  on public.visa_journey_steps for select
  using (auth.uid() = user_id or public.is_admin());

create policy "Users and admins can insert journey steps"
  on public.visa_journey_steps for insert
  with check (auth.uid() = user_id or public.is_admin());

create policy "Users and admins can update journey steps"
  on public.visa_journey_steps for update
  using (auth.uid() = user_id or public.is_admin());

create policy "Users and admins can delete journey steps"
  on public.visa_journey_steps for delete
  using (auth.uid() = user_id or public.is_admin());

-- APPLICATION UPDATES POLICIES
-- Normal users only see non-internal notes; admins see everything
create policy "Users view public updates; admins view all"
  on public.application_updates for select
  using (
    (not is_internal_note and exists (
      select 1 from public.visa_applications
      where visa_applications.id = application_updates.application_id
        and visa_applications.user_id = auth.uid()
    ))
    or public.is_admin()
  );

create policy "Admins and authorized users can insert updates"
  on public.application_updates for insert
  with check (public.is_admin() or auth.uid() = author_id);

-- USER DOCUMENTS POLICIES
create policy "Users can view own documents"
  on public.user_documents for select
  using (auth.uid() = user_id or public.is_admin());

create policy "Users can insert own documents"
  on public.user_documents for insert
  with check (auth.uid() = user_id);

create policy "Users and admins can update documents"
  on public.user_documents for update
  using (auth.uid() = user_id or public.is_admin());

create policy "Users can delete own documents"
  on public.user_documents for delete
  using (auth.uid() = user_id or public.is_admin());

-- ====================================================================
-- SUPABASE STORAGE BUCKET CONFIGURATION
-- ====================================================================
insert into storage.buckets (id, name, public)
values ('travel-documents', 'travel-documents', false)
on conflict (id) do nothing;

create policy "Authenticated users can upload own documents"
  on storage.objects for insert
  with check (
    bucket_id = 'travel-documents'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can read own documents, admins can read all"
  on storage.objects for select
  using (
    bucket_id = 'travel-documents'
    and (auth.uid()::text = (storage.foldername(name))[1] or public.is_admin())
  );

create policy "Users can delete own documents"
  on storage.objects for delete
  using (
    bucket_id = 'travel-documents'
    and (auth.uid()::text = (storage.foldername(name))[1] or public.is_admin())
  );

-- ====================================================================
-- AUTOMATIC PROFILE CREATION TRIGGER ON SIGNUP
-- ====================================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    case when new.email = 'admin@gmail.com' then 'admin'::user_role else 'user'::user_role end
  )
  on conflict (id) do update
  set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
