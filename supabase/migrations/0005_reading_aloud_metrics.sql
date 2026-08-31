-- ============================================================================
-- מדדי "קריאה בקול" נוספים (סעיף 11 במפרט): מספר מילים שזוהו, עצירות, ואחוז
-- התאמה משוער בין מה שזוהה לטקסט המקורי. כל השדות האלה הם תמיד "משוער"
-- (reading_sessions.is_estimated) - Web Speech API אינו מדויק, ואין להציג
-- אותם כמדידה מוחלטת.
-- ============================================================================

alter table public.reading_sessions
  add column recognized_word_count int,
  add column pause_count int,
  add column recognized_accuracy numeric(5, 1);

comment on column public.reading_sessions.recognized_word_count is
  'מספר המילים שזוהו ע"י Web Speech API בזמן קריאה בקול (משוער, null בקריאה שקטה או כשאין תמיכת דפדפן)';
comment on column public.reading_sessions.pause_count is
  'מספר העצירות המשמעותיות שזוהו בין קטעי דיבור (משוער)';
comment on column public.reading_sessions.recognized_accuracy is
  'אחוז החפיפה בין המילים שזוהו לטקסט המקורי (0-100, משוער בלבד - לא מדד דיוק לשוני אמיתי)';
