-- ============================================================================
-- ReadWise AI — Row Level Security
-- עיקרון: תלמיד רואה רק את הנתונים שלו. מורה רואה רק את התלמידים/כיתות שלו.
-- כתיבה של נתונים "מחושבים" (ציוני מיומנות, הישגים, AI feedback) אינה נגישה
-- ללקוח כלל — רק דרך service role בשרת (lib/supabase/admin.ts).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- פונקציות עזר (security definer כדי למנוע רקורסיית RLS על אותה טבלה)
-- ----------------------------------------------------------------------------
create function public.current_user_role()
returns text
language sql
security definer
stable
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create function public.is_teacher()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select public.current_user_role() = 'teacher';
$$;

-- האם המורה המחובר מלמד את התלמיד הנתון (דרך class_members או students.class_id)
create function public.teaches_student(target_student_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.students s
    join public.classes c on c.id = s.class_id
    where s.id = target_student_id
      and c.teacher_id = auth.uid()
  )
  or exists (
    select 1
    from public.class_members cm
    join public.classes c on c.id = cm.class_id
    where cm.student_id = target_student_id
      and c.teacher_id = auth.uid()
  );
$$;

create function public.teaches_class(target_class_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.classes c
    where c.id = target_class_id and c.teacher_id = auth.uid()
  );
$$;

create function public.is_member_of_class(target_class_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.class_members cm
    where cm.class_id = target_class_id and cm.student_id = auth.uid()
  );
$$;

-- ----------------------------------------------------------------------------
-- Enable RLS בכל הטבלאות
-- ----------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.classes enable row level security;
alter table public.class_members enable row level security;
alter table public.students enable row level security;
alter table public.skills enable row level security;
alter table public.texts enable row level security;
alter table public.vocabulary_words enable row level security;
alter table public.questions enable row level security;
alter table public.assignments enable row level security;
alter table public.assignment_submissions enable row level security;
alter table public.reading_sessions enable row level security;
alter table public.answers enable row level security;
alter table public.student_skill_scores enable row level security;
alter table public.student_vocabulary enable row level security;
alter table public.achievements enable row level security;
alter table public.student_achievements enable row level security;
alter table public.ai_feedback enable row level security;
alter table public.teacher_notes enable row level security;
alter table public.notifications enable row level security;

-- ----------------------------------------------------------------------------
-- profiles
-- ----------------------------------------------------------------------------
create policy "profiles_select_self_or_taught" on public.profiles
  for select using (id = auth.uid() or public.teaches_student(id));

create policy "profiles_update_self" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- ----------------------------------------------------------------------------
-- classes
-- ----------------------------------------------------------------------------
create policy "classes_select_owner_or_member" on public.classes
  for select using (teacher_id = auth.uid() or public.is_member_of_class(id));

create policy "classes_insert_owner" on public.classes
  for insert with check (teacher_id = auth.uid() and public.is_teacher());

create policy "classes_update_owner" on public.classes
  for update using (teacher_id = auth.uid()) with check (teacher_id = auth.uid());

create policy "classes_delete_owner" on public.classes
  for delete using (teacher_id = auth.uid());

-- ----------------------------------------------------------------------------
-- class_members
-- ----------------------------------------------------------------------------
create policy "class_members_select" on public.class_members
  for select using (student_id = auth.uid() or public.teaches_class(class_id));

create policy "class_members_insert_teacher" on public.class_members
  for insert with check (public.teaches_class(class_id));

create policy "class_members_delete_teacher" on public.class_members
  for delete using (public.teaches_class(class_id));

-- ----------------------------------------------------------------------------
-- students
-- ----------------------------------------------------------------------------
create policy "students_select_self_or_teacher" on public.students
  for select using (id = auth.uid() or public.teaches_student(id));

create policy "students_update_teacher" on public.students
  for update using (public.teaches_student(id)) with check (public.teaches_student(id));

-- ----------------------------------------------------------------------------
-- skills / achievements — קטלוגים גלויים לכל משתמש מחובר
-- ----------------------------------------------------------------------------
create policy "skills_select_all" on public.skills for select using (auth.uid() is not null);
create policy "achievements_select_all" on public.achievements for select using (auth.uid() is not null);

-- ----------------------------------------------------------------------------
-- texts / vocabulary_words — בנק משותף לקריאה, כתיבה למורה היוצר בלבד
-- ----------------------------------------------------------------------------
create policy "texts_select_all" on public.texts for select using (auth.uid() is not null);

create policy "texts_insert_teacher" on public.texts
  for insert with check (created_by = auth.uid() and public.is_teacher());

create policy "texts_update_owner" on public.texts
  for update using (created_by = auth.uid()) with check (created_by = auth.uid());

create policy "texts_delete_owner" on public.texts
  for delete using (created_by = auth.uid());

create policy "vocabulary_words_select_all" on public.vocabulary_words
  for select using (auth.uid() is not null);

create policy "vocabulary_words_write_owner" on public.vocabulary_words
  for all using (
    exists (select 1 from public.texts t where t.id = text_id and t.created_by = auth.uid())
  ) with check (
    exists (select 1 from public.texts t where t.id = text_id and t.created_by = auth.uid())
  );

-- ----------------------------------------------------------------------------
-- questions — נגיש לקריאה לכל מחובר (נדרש לתלמידים בביצוע משימה), כתיבה ליוצר הטקסט
-- ----------------------------------------------------------------------------
create policy "questions_select_all" on public.questions for select using (auth.uid() is not null);

create policy "questions_write_owner" on public.questions
  for all using (
    exists (select 1 from public.texts t where t.id = text_id and t.created_by = auth.uid())
  ) with check (
    exists (select 1 from public.texts t where t.id = text_id and t.created_by = auth.uid())
  );

-- ----------------------------------------------------------------------------
-- assignments
-- ----------------------------------------------------------------------------
create policy "assignments_select_owner_or_class_member" on public.assignments
  for select using (teacher_id = auth.uid() or public.is_member_of_class(class_id));

create policy "assignments_write_owner" on public.assignments
  for all using (teacher_id = auth.uid()) with check (teacher_id = auth.uid());

-- ----------------------------------------------------------------------------
-- assignment_submissions
-- ----------------------------------------------------------------------------
create policy "assignment_submissions_select" on public.assignment_submissions
  for select using (
    student_id = auth.uid()
    or exists (
      select 1 from public.assignments a
      where a.id = assignment_id and a.teacher_id = auth.uid()
    )
  );

create policy "assignment_submissions_write_self" on public.assignment_submissions
  for all using (student_id = auth.uid()) with check (student_id = auth.uid());

-- ----------------------------------------------------------------------------
-- reading_sessions
-- ----------------------------------------------------------------------------
create policy "reading_sessions_select" on public.reading_sessions
  for select using (student_id = auth.uid() or public.teaches_student(student_id));

create policy "reading_sessions_write_self" on public.reading_sessions
  for all using (student_id = auth.uid()) with check (student_id = auth.uid());

-- ----------------------------------------------------------------------------
-- answers — גישה דרך reading_sessions
-- ----------------------------------------------------------------------------
create policy "answers_select" on public.answers
  for select using (
    exists (
      select 1 from public.reading_sessions rs
      where rs.id = session_id
        and (rs.student_id = auth.uid() or public.teaches_student(rs.student_id))
    )
  );

create policy "answers_write_self" on public.answers
  for all using (
    exists (
      select 1 from public.reading_sessions rs
      where rs.id = session_id and rs.student_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.reading_sessions rs
      where rs.id = session_id and rs.student_id = auth.uid()
    )
  );

-- ----------------------------------------------------------------------------
-- student_skill_scores / student_vocabulary / student_achievements / ai_feedback
-- קריאה: תלמיד עצמו או המורה שלו. כתיבה: service role בלבד (אין policy = חסום ל-client)
-- ----------------------------------------------------------------------------
create policy "student_skill_scores_select" on public.student_skill_scores
  for select using (student_id = auth.uid() or public.teaches_student(student_id));

create policy "student_vocabulary_select" on public.student_vocabulary
  for select using (student_id = auth.uid() or public.teaches_student(student_id));

create policy "student_achievements_select" on public.student_achievements
  for select using (student_id = auth.uid() or public.teaches_student(student_id));

create policy "ai_feedback_select" on public.ai_feedback
  for select using (student_id = auth.uid() or public.teaches_student(student_id));

-- ----------------------------------------------------------------------------
-- teacher_notes — פרטי למורה בלבד
-- ----------------------------------------------------------------------------
create policy "teacher_notes_all_owner" on public.teacher_notes
  for all using (teacher_id = auth.uid()) with check (teacher_id = auth.uid());

-- ----------------------------------------------------------------------------
-- notifications
-- ----------------------------------------------------------------------------
create policy "notifications_select_self" on public.notifications
  for select using (user_id = auth.uid());

create policy "notifications_update_self" on public.notifications
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
