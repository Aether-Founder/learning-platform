-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- 1. USERS & WORKSPACES
create table users (
  id uuid primary key default auth.uid(),
  email text unique,
  created_at timestamp with time zone default now()
);

-- 2. MATERIALS (The raw uploads)
create table materials (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  title text,
  storage_url text,
  mime_type text,
  created_at timestamp with time zone default now()
);

-- 3. ARTISAN JOBS (The Queue)
create table jobs (
  id uuid primary key default uuid_generate_v4(),
  material_id uuid references materials(id) on delete cascade,
  user_id uuid references users(id) on delete cascade,
  status text default 'queued' check (status in ('queued', 'processing', 'completed', 'failed')),
  requested_outputs jsonb default '{}'::jsonb,
  custom_prompt text,
  progress_logs jsonb default '[]'::jsonb,
  result_payload jsonb,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 4. KNOWLEDGE BASE (Notes & Outlines)
create table notes (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  material_id uuid references materials(id) on delete set null,
  title text,
  content jsonb default '{}'::jsonb,
  created_at timestamp with time zone default now()
);

-- 5. LMS DECKS & CARDS (FSRS Optimized)
create table decks (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  name text,
  desired_retention numeric default 0.90
);

create table cards (
  id uuid primary key default uuid_generate_v4(),
  deck_id uuid references decks(id) on delete cascade,
  front text not null,
  back text not null,
  -- FSRS Specific Fields --
  stability numeric default 0,
  difficulty numeric default 0,
  elapsed_days integer default 0,
  scheduled_days integer default 0,
  reps integer default 0,
  lapses integer default 0,
  state text default 'New' check (state in ('New', 'Learning', 'Review', 'Relearning')),
  last_review timestamp with time zone,
  due_at timestamp with time zone default now()
);

-- 6. CALENDAR & TASKS (Student OS)
create table events (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  title text,
  start_time timestamp with time zone,
  end_time timestamp with time zone,
  type text default 'task' check (type in ('lecture', 'deep_work', 'exam', 'task')),
  linked_deck_id uuid references decks(id) on delete set null,
  is_completed boolean default false
);

-- INDEXES FOR PERFORMANCE
create index idx_jobs_user_status on jobs(user_id, status);
create index idx_cards_due on cards(due_at) where state != 'New';
create index idx_events_user_time on events(user_id, start_time);
create index idx_materials_user on materials(user_id);
create index idx_notes_user on notes(user_id);
create index idx_decks_user on decks(user_id);

-- ROW LEVEL SECURITY (RLS)
alter table users enable row level security;
alter table materials enable row level security;
alter table jobs enable row level security;
alter table notes enable row level security;
alter table decks enable row level security;
alter table cards enable row level security;
alter table events enable row level security;

-- Policies: Users can only see/edit their own data
create policy "Users can view own data" on users for select using (auth.uid() = id);
create policy "Users can insert own data" on users for insert with check (auth.uid() = id);

create policy "Users manage own materials" on materials for all using (auth.uid() = user_id);
create policy "Users manage own jobs" on jobs for all using (auth.uid() = user_id);
create policy "Users manage own notes" on notes for all using (auth.uid() = user_id);
create policy "Users manage own decks" on decks for all using (auth.uid() = user_id);
create policy "Users manage own cards" on cards for all using (auth.uid() = (select user_id from decks where decks.id = cards.deck_id));
create policy "Users manage own events" on events for all using (auth.uid() = user_id);

-- REALTIME ENABLEMENT
alter publication supabase_realtime add table jobs;
alter publication supabase_realtime add table cards;
alter publication supabase_realtime add table events;

-- HELPER FUNCTIONS

/**
 * Atomically append a log entry to a job's progress_logs array
 * Prevents race conditions when multiple updates occur simultaneously
 */
create or replace function append_job_log(job_id_param uuid, log_entry text)
returns void as $$
begin
  update jobs 
  set progress_logs = progress_logs || to_jsonb(array[log_entry])
  where id = job_id_param;
end;
$$ language plpgsql security definer;

/**
 * Get due cards for a user with FSRS scheduling info
 * Returns cards that are due for review based on their state and due_at timestamp
 */
create or replace function get_due_cards(user_id_param uuid, limit_count integer default 20)
returns table (
  card_id uuid,
  deck_id uuid,
  deck_name text,
  front text,
  back text,
  stability numeric,
  difficulty numeric,
  elapsed_days integer,
  scheduled_days integer,
  reps integer,
  lapses integer,
  state text,
  due_at timestamp with time zone
) as $$
begin
  return query
  select 
    c.id as card_id,
    c.deck_id,
    d.name as deck_name,
    c.front,
    c.back,
    c.stability,
    c.difficulty,
    c.elapsed_days,
    c.scheduled_days,
    c.reps,
    c.lapses,
    c.state,
    c.due_at
  from cards c
  join decks d on d.id = c.deck_id
  where d.user_id = user_id_param
    and c.state != 'New'
    and c.due_at <= now()
  order by c.due_at asc
  limit limit_count;
end;
$$ language plpgsql security definer;

/**
 * Update card after review using FSRS algorithm parameters
 * This is a simplified version - full FSRS implementation should be in application layer
 */
create or replace function review_card(
  card_id_param uuid,
  rating integer, -- 1: Again, 2: Hard, 3: Good, 4: Easy
  review_timestamp timestamp with time zone default now()
)
returns table (
  next_due_at timestamp with time zone,
  new_stability numeric,
  new_difficulty numeric,
  new_state text
) as $$
declare
  current_stability numeric;
  current_difficulty numeric;
  current_elapsed_days integer;
  current_scheduled_days integer;
  current_reps integer;
  current_lapses integer;
  current_state text;
  new_stability numeric;
  new_difficulty numeric;
  new_elapsed_days integer;
  new_scheduled_days integer;
  new_reps integer;
  new_lapses integer;
  new_state text;
  desired_retention numeric := 0.90;
begin
  -- Get current card state
  select stability, difficulty, elapsed_days, scheduled_days, reps, lapses, state
  into current_stability, current_difficulty, current_elapsed_days, current_scheduled_days, 
       current_reps, current_lapses, current_state
  from cards
  where id = card_id_param;

  -- Simplified FSRS logic (full algorithm should be in app layer)
  if rating = 1 then -- Again
    new_lapses := current_lapses + 1;
    new_reps := current_reps;
    new_stability := greatest(0.1, current_stability * 0.5);
    new_difficulty := least(10, current_difficulty + 0.2);
    new_scheduled_days := 1;
    new_state := 'Relearning';
  elsif rating = 2 then -- Hard
    new_reps := current_reps + 1;
    new_stability := current_stability * 1.1;
    new_difficulty := least(10, current_difficulty + 0.1);
    new_scheduled_days := greatest(1, floor(current_scheduled_days * 1.2)::integer);
    new_state := 'Review';
  elsif rating = 3 then -- Good
    new_reps := current_reps + 1;
    new_stability := current_stability * 1.5;
    new_scheduled_days := greatest(1, floor(current_stability * 1.5)::integer);
    new_state := 'Review';
  else -- Easy (rating = 4)
    new_reps := current_reps + 1;
    new_stability := current_stability * 2.0;
    new_difficulty := greatest(1, current_difficulty - 0.1);
    new_scheduled_days := greatest(1, floor(current_stability * 2.0)::integer);
    new_state := 'Review';
  end if;

  new_elapsed_days := current_elapsed_days + 1;

  -- Update card
  update cards
  set 
    stability = new_stability,
    difficulty = new_difficulty,
    elapsed_days = new_elapsed_days,
    scheduled_days = new_scheduled_days,
    reps = new_reps,
    lapses = new_lapses,
    state = new_state,
    last_review = review_timestamp,
    due_at = review_timestamp + (new_scheduled_days || ' days')::interval
  where id = card_id_param;

  return query select 
    review_timestamp + (new_scheduled_days || ' days')::interval as next_due_at,
    new_stability,
    new_difficulty,
    new_state;
end;
$$ language plpgsql security definer;

-- TRIGGERS

/**
 * Automatically update updated_at timestamp on job updates
 */
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_jobs_updated_at
  before update on jobs
  for each row
  execute function update_updated_at_column();

-- STORAGE BUCKET SETUP (run in Supabase dashboard or via API)
-- Note: This cannot be run in SQL editor, must be done via Dashboard or API
-- 
-- Steps:
-- 1. Go to Storage in Supabase Dashboard
-- 2. Create new bucket named 'materials'
-- 3. Set bucket to private
-- 4. Add RLS policy: Users can upload to their own folder
--    Policy name: "Users can upload own files"
--    Allowed operation: INSERT
--    Target roles: authenticated
--    Check: (bucket_id = 'materials' AND (storage.foldername(name))[1] = auth.uid()::text)
-- 5. Add RLS policy: Users can read own files
--    Policy name: "Users can read own files"
--    Allowed operation: SELECT
--    Target roles: authenticated
--    Check: (bucket_id = 'materials' AND (storage.foldername(name))[1] = auth.uid()::text)
--
-- 6. Enable webhooks on the bucket:
--    Settings > Webhooks > Add webhook
--    Event: INSERT
--    URL: Your Cloudflare Tunnel URL (e.g., https://artisan.your-domain.com/webhook)
--    Headers: Authorization: Bearer YOUR_WEBHOOK_SECRET
