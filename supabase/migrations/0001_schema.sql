-- ============================================================================
-- ReadWise AI — Schema ראשי
-- מגדיר את כל טבלאות הליבה של המערכת (ללא RLS — ראו 0002_rls.sql)
-- ============================================================================

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- profiles — הרחבה של auth.users, כולל תפקיד (מורה/תלמיד)
-- ----------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null check (role in ('teacher', 'student')),
  full_name text not null,
  -- שם משתמש ייחודי לכניסת תלמידים (המורה מגדיר בעת יצירת החשבון). מורים נכנסים באימייל רגיל.
  username text unique,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.profiles is 'פרופיל בסיסי לכל משתמש (מורה/תלמיד), מורחב מ-auth.users';

-- ----------------------------------------------------------------------------
-- classes / class_members / students
-- ----------------------------------------------------------------------------
create table public.classes (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  grade_level text,
  created_at timestamptz not null default now()
);

create table public.class_members (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  joined_at timestamptz not null default now(),
  unique (class_id, student_id)
);

-- הרחבת פרופיל עבור תלמידים: מצב קריאה נוכחי, כיתה נוכחית, gamification
create table public.students (
  id uuid primary key references public.profiles (id) on delete cascade,
  class_id uuid references public.classes (id) on delete set null,
  reading_level text not null default 'מתפתח',
  current_streak int not null default 0,
  longest_streak int not null default 0,
  total_points int not null default 0,
  last_activity_at timestamptz,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- skills — טקסונומיית המיומנויות הקבועה של המערכת
-- ----------------------------------------------------------------------------
create table public.skills (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name_he text not null,
  description text
);

-- ----------------------------------------------------------------------------
-- texts / vocabulary_words
-- ----------------------------------------------------------------------------
create table public.texts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  grade_level text not null,
  difficulty text not null check (difficulty in ('קל', 'בינוני', 'מאתגר')),
  genre text not null,
  estimated_reading_time int not null default 5,
  vocabulary_level text,
  tags text[] not null default '{}',
  cover_icon text not null default '📖',
  created_by uuid references public.profiles (id) on delete set null,
  is_ai_generated boolean not null default false,
  generation_purpose_skill_id uuid references public.skills (id) on delete set null,
  created_at timestamptz not null default now()
);
create index texts_grade_level_idx on public.texts (grade_level);
create index texts_genre_idx on public.texts (genre);
create index texts_tags_idx on public.texts using gin (tags);

create table public.vocabulary_words (
  id uuid primary key default gen_random_uuid(),
  text_id uuid not null references public.texts (id) on delete cascade,
  word text not null,
  definition text not null,
  example_sentence text,
  difficulty_level text,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- questions
-- ----------------------------------------------------------------------------
create table public.questions (
  id uuid primary key default gen_random_uuid(),
  text_id uuid not null references public.texts (id) on delete cascade,
  skill_id uuid references public.skills (id) on delete set null,
  type text not null check (
    type in ('explicit', 'inference', 'main_idea', 'vocabulary', 'evidence', 'critical', 'mcq')
  ),
  question_text text not null,
  options jsonb,
  correct_answer text,
  difficulty text not null default 'בינוני' check (difficulty in ('קל', 'בינוני', 'מאתגר')),
  order_index int not null default 0,
  created_at timestamptz not null default now()
);
create index questions_text_id_idx on public.questions (text_id);

-- ----------------------------------------------------------------------------
-- assignments / assignment_submissions
-- ----------------------------------------------------------------------------
create table public.assignments (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles (id) on delete cascade,
  class_id uuid not null references public.classes (id) on delete cascade,
  text_id uuid not null references public.texts (id) on delete cascade,
  title text not null,
  instructions text,
  skill_focus uuid[] not null default '{}',
  due_date date,
  created_at timestamptz not null default now()
);
create index assignments_class_id_idx on public.assignments (class_id);

create table public.reading_sessions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles (id) on delete cascade,
  text_id uuid not null references public.texts (id) on delete cascade,
  assignment_id uuid references public.assignments (id) on delete set null,
  reading_mode text not null check (reading_mode in ('aloud', 'silent')),
  status text not null default 'in_progress' check (status in ('in_progress', 'completed', 'abandoned')),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  duration_seconds int,
  wpm_estimated numeric(6, 1),
  -- true כברירת מחדל: מדדי קריאה בקול הם תמיד "משוער" אלא אם נקבע אחרת במפורש
  is_estimated boolean not null default true,
  created_at timestamptz not null default now()
);
create index reading_sessions_student_id_idx on public.reading_sessions (student_id);

create table public.assignment_submissions (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  session_id uuid references public.reading_sessions (id) on delete set null,
  status text not null default 'not_started' check (
    status in ('not_started', 'in_progress', 'completed')
  ),
  score int,
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  unique (assignment_id, student_id)
);

-- ----------------------------------------------------------------------------
-- answers
-- ----------------------------------------------------------------------------
create table public.answers (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.reading_sessions (id) on delete cascade,
  question_id uuid not null references public.questions (id) on delete cascade,
  student_answer text,
  is_correct boolean,
  ai_score int check (ai_score between 0 and 100),
  ai_feedback jsonb,
  hints_used int not null default 0,
  attempt_number int not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (session_id, question_id)
);

-- ----------------------------------------------------------------------------
-- student_skill_scores / student_vocabulary
-- ----------------------------------------------------------------------------
create table public.student_skill_scores (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles (id) on delete cascade,
  skill_id uuid not null references public.skills (id) on delete cascade,
  score numeric(5, 2) not null default 0,
  sample_size int not null default 0,
  trend text not null default 'stable' check (trend in ('up', 'down', 'stable')),
  updated_at timestamptz not null default now(),
  unique (student_id, skill_id)
);

create table public.student_vocabulary (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles (id) on delete cascade,
  word_id uuid not null references public.vocabulary_words (id) on delete cascade,
  mastery_level int not null default 0 check (mastery_level between 0 and 100),
  review_count int not null default 0,
  learned_at timestamptz not null default now(),
  unique (student_id, word_id)
);

-- ----------------------------------------------------------------------------
-- achievements / student_achievements
-- ----------------------------------------------------------------------------
create table public.achievements (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  title text not null,
  description text not null,
  icon text not null default '🏆',
  criteria jsonb not null default '{}'
);

create table public.student_achievements (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles (id) on delete cascade,
  achievement_id uuid not null references public.achievements (id) on delete cascade,
  earned_at timestamptz not null default now(),
  unique (student_id, achievement_id)
);

-- ----------------------------------------------------------------------------
-- ai_feedback / teacher_notes / notifications
-- ----------------------------------------------------------------------------
create table public.ai_feedback (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles (id) on delete cascade,
  related_type text not null,
  related_id uuid,
  feedback_text text not null,
  feedback_type text not null default 'general',
  created_at timestamptz not null default now()
);

create table public.teacher_notes (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  note_text text not null,
  created_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  is_read boolean not null default false,
  related_url text,
  created_at timestamptz not null default now()
);
create index notifications_user_id_unread_idx on public.notifications (user_id) where not is_read;

-- ----------------------------------------------------------------------------
-- Trigger: יצירת שורת profiles אוטומטית עם הרשמת משתמש ב-auth.users
-- מצפה ש-raw_user_meta_data יכיל role, full_name, ו-username (אופציונלי)
-- ----------------------------------------------------------------------------
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, role, full_name, username)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'role', 'student'),
    coalesce(new.raw_user_meta_data ->> 'full_name', 'משתמש חדש'),
    new.raw_user_meta_data ->> 'username'
  );

  if coalesce(new.raw_user_meta_data ->> 'role', 'student') = 'student' then
    insert into public.students (id) values (new.id);
  end if;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
