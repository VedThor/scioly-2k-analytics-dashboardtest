-- SciOly 2K Analytics Dashboard
-- Run this in the Supabase SQL editor after creating a project.

create extension if not exists "pgcrypto";

create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete set null,
  name text not null,
  email text unique not null,
  role text not null default 'viewer' check (role in ('viewer', 'officer', 'admin')),
  grade integer check (grade between 9 and 12),
  profile_picture_url text,
  ovr_rating numeric(5, 2) not null default 60.00,
  study_rating integer,
  build_rating integer,
  potential_rating numeric(5, 2),
  total_points integer not null default 0,
  profile_events text[] not null default '{}'::text[],
  prev_ovr numeric(5, 2) not null default 60.00,
  prev_avg_placement numeric(6, 2),
  last_snapshot_date timestamptz,
  created_at timestamptz not null default now()
);

alter table public.students
add column if not exists auth_user_id uuid unique references auth.users(id) on delete set null;
alter table public.students add column if not exists potential_rating numeric(5, 2);
alter table public.students add column if not exists profile_events text[] not null default '{}'::text[];

create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  school_name text not null,
  team_designation text not null,
  team_ovr numeric(5, 2) not null default 60.00,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  unique (school_name, team_designation)
);

create table if not exists public.team_members (
  team_id uuid not null references public.teams(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (team_id, student_id)
);

insert into public.teams (school_name, team_designation)
values
  ('Obra D Tompkins High School', 'A'),
  ('Obra D Tompkins High School', 'B'),
  ('Obra D Tompkins High School', 'C')
on conflict (school_name, team_designation) do nothing;

create table if not exists public.events (
  id serial primary key,
  name text unique not null,
  category text not null check (category in ('study', 'build'))
);

create table if not exists public.tournaments (
  id serial primary key,
  name text not null,
  date date not null,
  avg_scioly_elo numeric(8, 2) not null default 1000.00,
  sos_multiplier numeric(6, 2) not null default 1.00,
  benchmark_school text not null default 'Baseline School',
  benchmark_elo numeric(8, 2) not null default 1000.00,
  benchmark_source text not null default 'equivalent' check (benchmark_source in ('direct', 'equivalent')),
  relative_difficulty_multiplier numeric(6, 2) not null default 1.00,
  attending_schools jsonb not null default '[]'::jsonb,
  medal_cutoff integer not null default 6,
  participation_points integer not null default 10,
  source_type text not null default 'duosmium_csv' check (source_type in ('duosmium_csv', 'manual', 'demo')),
  created_at timestamptz not null default now(),
  unique (name, date)
);

alter table public.tournaments add column if not exists medal_cutoff integer not null default 6;
alter table public.tournaments add column if not exists participation_points integer not null default 10;
alter table public.tournaments add column if not exists source_type text not null default 'duosmium_csv';

create table if not exists public.performances (
  id serial primary key,
  student_id uuid not null references public.students(id) on delete cascade,
  tournament_id integer not null references public.tournaments(id) on delete cascade,
  event_id integer not null references public.events(id) on delete restrict,
  rank integer not null check (rank > 0),
  placement_score numeric(8, 2) not null,
  participant_names text[] not null default '{}'::text[],
  is_medal boolean not null default false,
  medal_cutoff integer not null default 6,
  participation_points integer not null default 10,
  medal_points integer not null default 0,
  event_points integer not null default 0,
  team_designation text not null default 'A',
  created_at timestamptz not null default now(),
  unique (student_id, tournament_id, event_id)
);

alter table public.performances add column if not exists participant_names text[] not null default '{}'::text[];
alter table public.performances add column if not exists is_medal boolean not null default false;
alter table public.performances add column if not exists medal_cutoff integer not null default 6;
alter table public.performances add column if not exists participation_points integer not null default 10;
alter table public.performances add column if not exists medal_points integer not null default 0;
alter table public.performances add column if not exists event_points integer not null default 0;

create table if not exists public.grind_points (
  id serial primary key,
  student_id uuid not null references public.students(id) on delete cascade,
  activity_type text not null constraint grind_points_activity_type_check check (
    activity_type in (
      'solo_study',
      'partner_study',
      'solo_practice_test',
      'partner_practice_test',
      'build_testing',
      'id_specimens',
      'custom_activity'
    )
  ),
  points integer not null constraint grind_points_points_range_check check (points between 1 and 500),
  minutes integer not null default 0 constraint grind_points_minutes_range_check check (minutes between 0 and 240),
  quantity integer constraint grind_points_quantity_range_check check (quantity is null or quantity between 0 and 300),
  custom_label text,
  custom_category_id integer,
  metadata jsonb not null default '{}'::jsonb,
  is_approved boolean not null default false,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  submitted_at timestamptz not null default now(),
  approved_at timestamptz,
  approved_by uuid references public.students(id),
  notes text,
  constraint grind_points_approval_state_check check (
    (
      status = 'pending'
      and is_approved = false
      and approved_at is null
      and approved_by is null
    )
    or (
      status = 'approved'
      and is_approved = true
      and approved_at is not null
      and approved_by is not null
    )
    or (
      status = 'rejected'
      and is_approved = false
      and approved_at is not null
      and approved_by is not null
    )
  )
);

create table if not exists public.custom_point_categories (
  id serial primary key,
  name text not null unique,
  default_points integer not null default 0,
  max_points integer not null default 500,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.grind_points add column if not exists custom_label text;
alter table public.grind_points add column if not exists custom_category_id integer references public.custom_point_categories(id);
alter table public.grind_points add column if not exists metadata jsonb not null default '{}'::jsonb;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'grind_points_custom_category_id_fkey'
  ) then
    alter table public.grind_points
    add constraint grind_points_custom_category_id_fkey
    foreign key (custom_category_id) references public.custom_point_categories(id);
  end if;
end $$;

-- Existing deployments may predate the inline validation above. Add the same
-- constraints by stable name without making repeat runs fail.
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.grind_points'::regclass
      and conname = 'grind_points_activity_type_check'
  ) then
    alter table public.grind_points
    add constraint grind_points_activity_type_check check (
      activity_type in (
        'solo_study',
        'partner_study',
        'solo_practice_test',
        'partner_practice_test',
        'build_testing',
        'id_specimens',
        'custom_activity'
      )
    ) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.grind_points'::regclass
      and conname = 'grind_points_points_range_check'
  ) then
    alter table public.grind_points
    add constraint grind_points_points_range_check check (points between 1 and 500) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.grind_points'::regclass
      and conname = 'grind_points_minutes_range_check'
  ) then
    alter table public.grind_points
    add constraint grind_points_minutes_range_check check (minutes between 0 and 240) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.grind_points'::regclass
      and conname = 'grind_points_quantity_range_check'
  ) then
    alter table public.grind_points
    add constraint grind_points_quantity_range_check
    check (quantity is null or quantity between 0 and 300) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.grind_points'::regclass
      and conname = 'grind_points_approval_state_check'
  ) then
    alter table public.grind_points
    add constraint grind_points_approval_state_check check (
      (
        status = 'pending'
        and is_approved = false
        and approved_at is null
        and approved_by is null
      )
      or (
        status = 'approved'
        and is_approved = true
        and approved_at is not null
        and approved_by is not null
      )
      or (
        status = 'rejected'
        and is_approved = false
        and approved_at is not null
        and approved_by is not null
      )
    ) not valid;
  end if;
end $$;

create table if not exists public.seasons (
  id serial primary key,
  name text not null unique,
  start_date date not null,
  end_date date not null,
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  constraint seasons_date_order_check check (end_date >= start_date)
);

create table if not exists public.testoff_sessions (
  id serial primary key,
  season_id integer not null references public.seasons(id) on delete restrict,
  event_id integer not null references public.events(id) on delete restrict,
  name text not null,
  date date not null,
  max_score numeric(10, 3) not null,
  weight numeric(6, 3) not null default 1.000,
  notes text,
  created_by uuid references public.students(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint testoff_sessions_max_score_check check (max_score > 0),
  constraint testoff_sessions_weight_check check (weight > 0 and weight <= 10),
  unique (season_id, event_id, name, date)
);

create table if not exists public.testoff_results (
  id serial primary key,
  session_id integer not null references public.testoff_sessions(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  raw_score numeric(10, 3) not null,
  rank integer,
  ranking_score numeric(10, 3) not null default 0,
  notes text,
  entered_by uuid references public.students(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint testoff_results_raw_score_check check (raw_score >= 0),
  constraint testoff_results_rank_check check (rank is null or rank > 0),
  constraint testoff_results_ranking_score_check check (ranking_score between 0 and 1000),
  unique (session_id, student_id)
);

comment on column public.testoff_results.ranking_score is
  'Server-calculated normalized score: (raw_score / session.max_score) * 100 * session.weight.';

create table if not exists public.ovr_snapshots (
  id serial primary key,
  student_id uuid not null references public.students(id) on delete cascade,
  ovr_value numeric(5, 2) not null,
  total_points integer not null,
  avg_placement numeric(6, 2),
  medal_count integer not null default 0,
  potential_rating numeric(5, 2),
  recorded_at timestamptz not null default now()
);

alter table public.ovr_snapshots add column if not exists medal_count integer not null default 0;
alter table public.ovr_snapshots add column if not exists potential_rating numeric(5, 2);

create table if not exists public.audit_logs (
  id serial primary key,
  actor_id uuid references public.students(id),
  action text not null,
  target text not null,
  reason text,
  ip_address inet,
  entity_table text,
  entity_id text,
  payload_before jsonb,
  payload_after jsonb,
  undo_action text,
  is_reversible boolean not null default false,
  reversed_at timestamptz,
  reversed_by uuid references public.students(id),
  reversal_of integer references public.audit_logs(id),
  created_at timestamptz not null default now()
);

alter table public.audit_logs add column if not exists entity_table text;
alter table public.audit_logs add column if not exists entity_id text;
alter table public.audit_logs add column if not exists payload_before jsonb;
alter table public.audit_logs add column if not exists payload_after jsonb;
alter table public.audit_logs add column if not exists undo_action text;
alter table public.audit_logs add column if not exists is_reversible boolean not null default false;
alter table public.audit_logs add column if not exists reversed_at timestamptz;
alter table public.audit_logs add column if not exists reversed_by uuid references public.students(id);
alter table public.audit_logs add column if not exists reversal_of integer references public.audit_logs(id);

create table if not exists public.system_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

insert into public.system_settings (key, value)
values ('daily_point_log_limit', '10'::jsonb)
on conflict (key) do nothing;

insert into public.system_settings (key, value)
values ('default_admin_emails', '["aaravsinhaofficial@gmail.com"]'::jsonb)
on conflict (key) do nothing;

insert into public.custom_point_categories (name, default_points, max_points)
values
  ('Competition Participation', 10, 100),
  ('Other Practice', 50, 500)
on conflict (name) do nothing;

create or replace function public.current_student_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id
  from public.students
  where auth_user_id = auth.uid()
     or email = auth.jwt() ->> 'email'
  limit 1
$$;

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  profile_name text;
  profile_grade integer;
  profile_role text;
begin
  profile_name := coalesce(
    nullif(new.raw_user_meta_data ->> 'name', ''),
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    split_part(new.email, '@', 1),
    'New Student'
  );

  profile_grade := case
    when coalesce(new.raw_user_meta_data ->> 'grade', '') ~ '^\d+$'
      then (new.raw_user_meta_data ->> 'grade')::integer
    else null
  end;

  profile_role := case
    when exists (
      select 1
      from public.system_settings s,
           jsonb_array_elements_text(s.value) as email(value)
      where s.key = 'default_admin_emails'
        and lower(email.value) = lower(new.email)
    )
      then 'admin'
    else 'viewer'
  end;

  insert into public.students (
    auth_user_id,
    name,
    email,
    role,
    grade,
    profile_picture_url,
    ovr_rating,
    total_points,
    prev_ovr
  )
  values (
    new.id,
    profile_name,
    new.email,
    profile_role,
    profile_grade,
    coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture'),
    60.00,
    0,
    60.00
  )
  on conflict (email) do update
  set auth_user_id = coalesce(public.students.auth_user_id, excluded.auth_user_id),
      name = coalesce(nullif(public.students.name, ''), excluded.name),
      grade = coalesce(public.students.grade, excluded.grade),
      role = case
        when excluded.role = 'admin' then 'admin'
        else public.students.role
      end,
      profile_picture_url = coalesce(public.students.profile_picture_url, excluded.profile_picture_url);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

create or replace function public.current_student_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select role from public.students where id = public.current_student_id()),
    'viewer'
  )
$$;

create or replace function public.is_officer_or_admin()
returns boolean
language sql
stable
as $$
  select public.current_student_role() in ('officer', 'admin')
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select public.current_student_role() = 'admin'
$$;

create or replace function public.prepare_grind_point_submission()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  category_max integer;
  category_is_active boolean;
begin
  -- Browser clients may submit only for themselves. Approval fields are always
  -- reset before RLS is evaluated, so a crafted REST request cannot self-approve.
  if coalesce(auth.role(), '') = 'authenticated' then
    if new.student_id is distinct from public.current_student_id() then
      raise exception 'Point logs may only be submitted for the signed-in student';
    end if;

    new.status := 'pending';
    new.is_approved := false;
    new.approved_at := null;
    new.approved_by := null;
    new.submitted_at := now();
  end if;

  -- Standard activities are derived from their underlying evidence instead of
  -- trusting a caller-provided point total. Build/custom work remains officer-
  -- reviewed but is capped here as defense in depth.
  case new.activity_type
    when 'solo_study' then
      new.points := least(200, round(coalesce(new.minutes, 0) * 0.75)::integer);
    when 'partner_study' then
      new.points := least(200, coalesce(new.minutes, 0));
    when 'solo_practice_test' then
      new.points := 100;
    when 'partner_practice_test' then
      new.points := 150;
    when 'build_testing' then
      if new.points is null then
        raise exception 'Build testing requires a requested point value';
      end if;
      new.points := least(200, new.points);
    when 'id_specimens' then
      new.points := least(200, round(coalesce(new.quantity, 0) * 0.5)::integer);
    when 'custom_activity' then
      if new.points is null then
        raise exception 'Custom activity requires a requested point value';
      end if;
      category_max := 500;
      if new.custom_category_id is not null then
        select least(max_points, 500), is_active
        into category_max, category_is_active
        from public.custom_point_categories
        where id = new.custom_category_id;

        if not found then
          raise exception 'Unknown custom point category';
        end if;
        if category_is_active is not true then
          raise exception 'Custom point category is inactive';
        end if;
      end if;
      new.points := least(category_max, new.points);
    else
      raise exception 'Unsupported activity type: %', new.activity_type;
  end case;

  if new.points is null or new.points <= 0 then
    raise exception 'Point value must be greater than zero';
  end if;

  return new;
end;
$$;

create or replace function public.calculate_testoff_ranking_score()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  session_max_score numeric;
  session_weight numeric;
begin
  select max_score, weight
  into session_max_score, session_weight
  from public.testoff_sessions
  where id = new.session_id;

  if not found then
    raise exception 'Testoff session not found';
  end if;
  if new.raw_score < 0 or new.raw_score > session_max_score then
    raise exception 'Raw score must be between 0 and the session maximum (%)', session_max_score;
  end if;

  new.ranking_score := round((new.raw_score / session_max_score) * 100 * session_weight, 3);
  new.updated_at := now();
  return new;
end;
$$;

create or replace function public.refresh_testoff_ranking_scores()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  update public.testoff_results
  set ranking_score = ranking_score
  where session_id = new.id;

  return new;
end;
$$;

create or replace function public.calculate_student_ovr(target_student_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  grind_total integer;
  performance_total integer;
  approved_points integer;
  study numeric;
  build numeric;
  new_ovr numeric;
  medal_count integer;
  avg_place numeric;
  potential numeric;
begin
  select coalesce(sum(points), 0)
  into grind_total
  from public.grind_points
  where student_id = target_student_id
    and is_approved = true
    and status = 'approved';

  select coalesce(sum(event_points), 0)
  into performance_total
  from public.performances
  where student_id = target_student_id;

  approved_points := grind_total + performance_total;

  select greatest(60, least(99, 55 + avg(p.placement_score) / 4 + least(4, count(*) * 0.45)))
  into study
  from public.performances p
  join public.events e on e.id = p.event_id
  where p.student_id = target_student_id
    and e.category = 'study';

  select greatest(60, least(99, 55 + avg(p.placement_score) / 4 + least(4, count(*) * 0.45)))
  into build
  from public.performances p
  join public.events e on e.id = p.event_id
  where p.student_id = target_student_id
    and e.category = 'build';

  if study is not null and build is not null then
    new_ovr := study * 0.4 + build * 0.4 + approved_points * 0.002;
  elsif study is not null then
    new_ovr := study * 0.8 + approved_points * 0.002;
  elsif build is not null then
    new_ovr := build * 0.8 + approved_points * 0.002;
  else
    new_ovr := 60 + approved_points * 0.01;
  end if;

  select count(*)
  into medal_count
  from public.performances
  where student_id = target_student_id
    and is_medal = true;

  select round(avg(rank), 2)
  into avg_place
  from public.performances
  where student_id = target_student_id;

  select greatest(
    greatest(coalesce(study, 60), coalesce(build, 60), greatest(60, least(99, new_ovr))),
    least(
      99,
      greatest(60, least(99, new_ovr))
        + least(5, (
          select coalesce(sum(points), 0) / 120.0
          from public.grind_points
          where student_id = target_student_id
            and is_approved = true
            and status = 'approved'
            and submitted_at > now() - interval '30 days'
        ))
        + least(4, coalesce(medal_count, 0) * 0.8)
        + coalesce(greatest(0, (10 - avg_place) * 0.55), 0)
    )
  )
  into potential;

  update public.students
  set
    study_rating = case when study is null then null else round(study)::integer end,
    build_rating = case when build is null then null else round(build)::integer end,
    total_points = approved_points,
    potential_rating = round(greatest(60, least(99, potential)), 2),
    ovr_rating = greatest(60, least(99, round(new_ovr, 2)))
  where id = target_student_id;
end;
$$;

create or replace function public.recalculate_team_ovr(target_team_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  member_sum numeric;
  member_count integer;
begin
  select coalesce(sum(ovr_rating), 0), count(*)
  into member_sum, member_count
  from (
    select s.ovr_rating
    from public.team_members tm
    join public.students s on s.id = tm.student_id
    where tm.team_id = target_team_id
    order by s.ovr_rating desc
    limit 15
  ) top_members;

  update public.teams
  set team_ovr = case
        when member_count = 0 then 60.00
        else round(member_sum / member_count, 2)
      end,
      version = version + 1
  where id = target_team_id;
end;
$$;

create or replace function public.recalculate_student_and_teams()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  affected_student uuid;
  affected_team uuid;
begin
  affected_student := coalesce(new.student_id, old.student_id);
  perform public.calculate_student_ovr(affected_student);

  for affected_team in
    select team_id from public.team_members where student_id = affected_student
  loop
    perform public.recalculate_team_ovr(affected_team);
  end loop;

  return coalesce(new, old);
end;
$$;

create or replace function public.recalculate_team_after_membership()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op <> 'DELETE' and new.team_id is not null then
    perform public.recalculate_team_ovr(new.team_id);
  end if;

  if tg_op <> 'INSERT'
    and old.team_id is not null
    and (tg_op = 'DELETE' or old.team_id is distinct from new.team_id)
  then
    perform public.recalculate_team_ovr(old.team_id);
  end if;

  return coalesce(new, old);
end;
$$;

create or replace function public.replace_team_memberships(roster_groups jsonb)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  inserted_count integer;
begin
  if roster_groups is null or jsonb_typeof(roster_groups) <> 'array' then
    raise exception 'Roster groups must be a JSON array';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(roster_groups) as team_group
    where jsonb_typeof(team_group -> 'memberIds') <> 'array'
       or coalesce(team_group ->> 'teamId', '') = ''
  ) then
    raise exception 'Every roster group needs a teamId and memberIds array';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(roster_groups) as team_group
    where team_group ->> 'teamId' <> 'unassigned'
      and not exists (
        select 1 from public.teams t where t.id::text = team_group ->> 'teamId'
      )
  ) then
    raise exception 'One or more teams do not exist';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(roster_groups) as team_group
    cross join lateral jsonb_array_elements_text(team_group -> 'memberIds') as member(student_id)
    where not exists (
      select 1 from public.students s where s.id::text = member.student_id
    )
  ) then
    raise exception 'One or more students do not exist';
  end if;

  if exists (
    select member.student_id
    from jsonb_array_elements(roster_groups) as team_group
    cross join lateral jsonb_array_elements_text(team_group -> 'memberIds') as member(student_id)
    group by member.student_id
    having count(*) > 1
  ) then
    raise exception 'A student cannot be assigned to more than one roster group';
  end if;

  delete from public.team_members membership
  using jsonb_array_elements(roster_groups) as team_group
  where team_group ->> 'teamId' <> 'unassigned'
    and membership.team_id::text = team_group ->> 'teamId';

  insert into public.team_members (team_id, student_id)
  select
    (team_group ->> 'teamId')::uuid,
    member.student_id::uuid
  from jsonb_array_elements(roster_groups) as team_group
  cross join lateral jsonb_array_elements_text(team_group -> 'memberIds') as member(student_id)
  where team_group ->> 'teamId' <> 'unassigned';

  get diagnostics inserted_count = row_count;
  return inserted_count;
end;
$$;

create or replace function public.enforce_daily_point_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  daily_limit integer;
  submitted_count integer;
begin
  select coalesce(
    (
      select (value #>> '{}')::integer
      from public.system_settings
      where key = 'daily_point_log_limit'
    ),
    10
  )
  into daily_limit;

  select count(*)
  into submitted_count
  from public.grind_points
  where student_id = new.student_id
    and submitted_at >= date_trunc('day', now());

  if submitted_count >= daily_limit then
    raise exception 'Daily point log limit reached';
  end if;

  return new;
end;
$$;

create or replace function public.sync_grind_status()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'approved' then
    new.is_approved := true;
    new.approved_at := coalesce(new.approved_at, now());
  elsif new.status = 'rejected' then
    new.is_approved := false;
    new.approved_at := coalesce(new.approved_at, now());
  else
    new.is_approved := false;
  end if;

  return new;
end;
$$;

create or replace function public.create_weekly_ovr_snapshots()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  inserted_count integer;
begin
  insert into public.ovr_snapshots (student_id, ovr_value, total_points, avg_placement, medal_count, potential_rating, recorded_at)
  select
    s.id,
    s.ovr_rating,
    s.total_points,
    (
      select round(avg(p.rank), 2)
      from public.performances p
      where p.student_id = s.id
    ),
    (
      select count(*)
      from public.performances p
      where p.student_id = s.id
        and p.is_medal = true
    ),
    s.potential_rating,
    now()
  from public.students s;

  get diagnostics inserted_count = row_count;

  update public.students s
  set prev_ovr = s.ovr_rating,
      prev_avg_placement = (
        select round(avg(p.rank), 2)
        from public.performances p
        where p.student_id = s.id
      ),
      last_snapshot_date = now();

  return inserted_count;
end;
$$;

-- Helper functions used by RLS remain callable by signed-in users. Privileged
-- maintenance functions and trigger functions are not exposed as public RPCs.
revoke all on function public.current_student_id() from public, anon;
revoke all on function public.current_student_role() from public, anon;
revoke all on function public.is_officer_or_admin() from public, anon;
revoke all on function public.is_admin() from public, anon;
grant execute on function public.current_student_id() to authenticated, service_role;
grant execute on function public.current_student_role() to authenticated, service_role;
grant execute on function public.is_officer_or_admin() to authenticated, service_role;
grant execute on function public.is_admin() to authenticated, service_role;

revoke all on function public.calculate_student_ovr(uuid) from public, anon, authenticated;
revoke all on function public.recalculate_team_ovr(uuid) from public, anon, authenticated;
revoke all on function public.replace_team_memberships(jsonb) from public, anon, authenticated;
revoke all on function public.create_weekly_ovr_snapshots() from public, anon, authenticated;
grant execute on function public.calculate_student_ovr(uuid) to service_role;
grant execute on function public.recalculate_team_ovr(uuid) to service_role;
grant execute on function public.replace_team_memberships(jsonb) to service_role;
grant execute on function public.create_weekly_ovr_snapshots() to service_role;

revoke all on function public.handle_new_auth_user() from public, anon, authenticated;
revoke all on function public.prepare_grind_point_submission() from public, anon, authenticated;
revoke all on function public.calculate_testoff_ranking_score() from public, anon, authenticated;
revoke all on function public.refresh_testoff_ranking_scores() from public, anon, authenticated;
revoke all on function public.recalculate_student_and_teams() from public, anon, authenticated;
revoke all on function public.recalculate_team_after_membership() from public, anon, authenticated;
revoke all on function public.enforce_daily_point_limit() from public, anon, authenticated;
revoke all on function public.sync_grind_status() from public, anon, authenticated;

drop trigger if exists trg_performance_recalculate_student on public.performances;
create trigger trg_performance_recalculate_student
after insert or update or delete on public.performances
for each row execute function public.recalculate_student_and_teams();

drop trigger if exists trg_grind_prepare_submission on public.grind_points;
drop trigger if exists trg_grind_00_prepare_submission on public.grind_points;
create trigger trg_grind_00_prepare_submission
before insert on public.grind_points
for each row execute function public.prepare_grind_point_submission();

drop trigger if exists trg_grind_sync_status on public.grind_points;
create trigger trg_grind_sync_status
before insert or update on public.grind_points
for each row execute function public.sync_grind_status();

drop trigger if exists trg_grind_limit on public.grind_points;
create trigger trg_grind_limit
before insert on public.grind_points
for each row execute function public.enforce_daily_point_limit();

drop trigger if exists trg_grind_recalculate_student on public.grind_points;
create trigger trg_grind_recalculate_student
after insert or update or delete on public.grind_points
for each row execute function public.recalculate_student_and_teams();

drop trigger if exists trg_team_members_recalculate on public.team_members;
create trigger trg_team_members_recalculate
after insert or update or delete on public.team_members
for each row execute function public.recalculate_team_after_membership();

drop trigger if exists trg_testoff_result_score on public.testoff_results;
create trigger trg_testoff_result_score
before insert or update on public.testoff_results
for each row execute function public.calculate_testoff_ranking_score();

drop trigger if exists trg_testoff_session_score_refresh on public.testoff_sessions;
create trigger trg_testoff_session_score_refresh
after update of max_score, weight on public.testoff_sessions
for each row execute function public.refresh_testoff_ranking_scores();

alter table public.students enable row level security;
alter table public.teams enable row level security;
alter table public.team_members enable row level security;
alter table public.events enable row level security;
alter table public.tournaments enable row level security;
alter table public.performances enable row level security;
alter table public.grind_points enable row level security;
alter table public.ovr_snapshots enable row level security;
alter table public.audit_logs enable row level security;
alter table public.system_settings enable row level security;
alter table public.custom_point_categories enable row level security;
alter table public.seasons enable row level security;
alter table public.testoff_sessions enable row level security;
alter table public.testoff_results enable row level security;

drop policy if exists "students_select_logged_in" on public.students;
create policy "students_select_logged_in"
on public.students for select
to authenticated
using (id = public.current_student_id() or public.is_officer_or_admin());

drop policy if exists "students_admin_write" on public.students;
create policy "students_admin_write"
on public.students for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "teams_select_logged_in" on public.teams;
create policy "teams_select_logged_in"
on public.teams for select
to authenticated
using (true);

drop policy if exists "teams_admin_write" on public.teams;
create policy "teams_admin_write"
on public.teams for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "team_members_select_logged_in" on public.team_members;
create policy "team_members_select_logged_in"
on public.team_members for select
to authenticated
using (true);

drop policy if exists "team_members_admin_write" on public.team_members;
create policy "team_members_admin_write"
on public.team_members for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "events_select_logged_in" on public.events;
create policy "events_select_logged_in"
on public.events for select
to authenticated
using (true);

drop policy if exists "events_officer_write" on public.events;
create policy "events_officer_write"
on public.events for all
to authenticated
using (public.is_officer_or_admin())
with check (public.is_officer_or_admin());

drop policy if exists "tournaments_select_logged_in" on public.tournaments;
create policy "tournaments_select_logged_in"
on public.tournaments for select
to authenticated
using (true);

drop policy if exists "tournaments_officer_insert" on public.tournaments;
create policy "tournaments_officer_insert"
on public.tournaments for insert
to authenticated
with check (public.is_officer_or_admin());

drop policy if exists "tournaments_admin_delete" on public.tournaments;
create policy "tournaments_admin_delete"
on public.tournaments for delete
to authenticated
using (public.is_admin());

drop policy if exists "performances_select_logged_in" on public.performances;
create policy "performances_select_logged_in"
on public.performances for select
to authenticated
using (true);

drop policy if exists "performances_officer_write" on public.performances;
create policy "performances_officer_write"
on public.performances for all
to authenticated
using (public.is_officer_or_admin())
with check (public.is_officer_or_admin());

drop policy if exists "grind_points_select_scope" on public.grind_points;
create policy "grind_points_select_scope"
on public.grind_points for select
to authenticated
using (student_id = public.current_student_id() or public.is_officer_or_admin());

drop policy if exists "grind_points_insert_own" on public.grind_points;
create policy "grind_points_insert_own"
on public.grind_points for insert
to authenticated
with check (
  student_id = public.current_student_id()
  and status = 'pending'
  and is_approved = false
  and approved_at is null
  and approved_by is null
);

drop policy if exists "grind_points_officer_update" on public.grind_points;
create policy "grind_points_officer_update"
on public.grind_points for update
to authenticated
using (public.is_officer_or_admin())
with check (public.is_officer_or_admin());

drop policy if exists "grind_points_admin_delete" on public.grind_points;
create policy "grind_points_admin_delete"
on public.grind_points for delete
to authenticated
using (public.is_admin());

drop policy if exists "snapshots_select_scope" on public.ovr_snapshots;
create policy "snapshots_select_scope"
on public.ovr_snapshots for select
to authenticated
using (student_id = public.current_student_id() or public.is_officer_or_admin());

drop policy if exists "audit_admin_select" on public.audit_logs;
create policy "audit_admin_select"
on public.audit_logs for select
to authenticated
using (public.is_admin());

drop policy if exists "audit_service_insert" on public.audit_logs;
create policy "audit_service_insert"
on public.audit_logs for insert
to service_role
with check (true);

drop policy if exists "settings_admin_all" on public.system_settings;
create policy "settings_admin_all"
on public.system_settings for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "custom_point_categories_select_logged_in" on public.custom_point_categories;
create policy "custom_point_categories_select_logged_in"
on public.custom_point_categories for select
to authenticated
using (true);

drop policy if exists "custom_point_categories_admin_all" on public.custom_point_categories;
create policy "custom_point_categories_admin_all"
on public.custom_point_categories for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "seasons_select_logged_in" on public.seasons;
create policy "seasons_select_logged_in"
on public.seasons for select
to authenticated
using (true);

drop policy if exists "seasons_admin_write" on public.seasons;
create policy "seasons_admin_write"
on public.seasons for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "testoff_sessions_select_logged_in" on public.testoff_sessions;
create policy "testoff_sessions_select_logged_in"
on public.testoff_sessions for select
to authenticated
using (true);

drop policy if exists "testoff_sessions_officer_write" on public.testoff_sessions;
create policy "testoff_sessions_officer_write"
on public.testoff_sessions for all
to authenticated
using (public.is_officer_or_admin())
with check (public.is_officer_or_admin());

drop policy if exists "testoff_results_select_scope" on public.testoff_results;
create policy "testoff_results_select_scope"
on public.testoff_results for select
to authenticated
using (student_id = public.current_student_id() or public.is_officer_or_admin());

drop policy if exists "testoff_results_officer_write" on public.testoff_results;
create policy "testoff_results_officer_write"
on public.testoff_results for all
to authenticated
using (public.is_officer_or_admin())
with check (public.is_officer_or_admin());

create index if not exists idx_performances_student on public.performances(student_id);
create index if not exists idx_performances_tournament on public.performances(tournament_id);
create unique index if not exists idx_team_members_one_team_per_student on public.team_members(student_id);
create index if not exists idx_grind_points_student_status on public.grind_points(student_id, status);
create index if not exists idx_grind_points_submitted on public.grind_points(submitted_at);
create index if not exists idx_snapshots_student_recorded on public.ovr_snapshots(student_id, recorded_at);
create unique index if not exists idx_seasons_one_active
on public.seasons(is_active)
where is_active = true;
create index if not exists idx_testoff_sessions_season_event_date
on public.testoff_sessions(season_id, event_id, date);
create index if not exists idx_testoff_results_student
on public.testoff_results(student_id);
create index if not exists idx_testoff_results_session_ranking
on public.testoff_results(session_id, ranking_score desc, rank);
