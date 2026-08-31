-- ============================================================================
-- היסטוריית ציוני מיומנות - מאפשרת "התקדמות לאורך זמן" (סעיפים 17, 20 במפרט).
-- student_skill_scores שומרת רק את הערך הנוכחי; טבלה זו שומרת "תמונת מצב"
-- (snapshot) בכל פעם ש-recomputeStudentSkillScores רץ, כדי שאפשר יהיה
-- לצייר גרף התקדמות אמיתי ולהשוות "היום מול לפני שבוע/חודש".
-- ============================================================================

create table public.student_skill_score_history (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles (id) on delete cascade,
  skill_id uuid not null references public.skills (id) on delete cascade,
  score numeric(5, 2) not null,
  recorded_at timestamptz not null default now()
);
create index student_skill_score_history_lookup_idx
  on public.student_skill_score_history (student_id, skill_id, recorded_at);

alter table public.student_skill_score_history enable row level security;

-- אותו דפוס הרשאות כמו student_skill_scores: תלמיד רואה את שלו, מורה רואה
-- של התלמידים שהוא מלמד. כתיבה רק דרך service role (בתוך recomputeStudentSkillScores).
create policy "student_skill_score_history_select" on public.student_skill_score_history
  for select using (student_id = auth.uid() or public.teaches_student(student_id));
