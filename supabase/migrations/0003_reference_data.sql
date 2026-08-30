-- ============================================================================
-- ReadWise AI — נתוני ייחוס קבועים (טקסונומיית מיומנויות + הישגים)
-- אלו אינם "seed data" לדמו — הם חלק מהמודל של המערכת ונטענים בכל סביבה.
-- ============================================================================

insert into public.skills (key, name_he, description) values
  ('accuracy', 'דיוק בקריאה', 'קריאת המילים כפי שהן כתובות, ללא טעויות זיהוי'),
  ('fluency', 'שטף קריאה', 'קצב וזרימת קריאה טבעיים, ללא היסוסים מיותרים'),
  ('reading_rate', 'קצב קריאה', 'מספר מילים לדקה'),
  ('vocabulary', 'אוצר מילים', 'הבנת משמעות מילים בהקשר הטקסט'),
  ('comprehension', 'הבנת הנקרא', 'הבנה כוללת של תוכן הטקסט'),
  ('explicit_info', 'איתור מידע מפורש', 'שליפת מידע הכתוב במפורש בטקסט'),
  ('inference', 'הסקת מסקנות', 'הסקת מידע שאינו כתוב במפורש, על בסיס רמזים בטקסט'),
  ('main_idea', 'זיהוי רעיון מרכזי', 'זיהוי המסר או הרעיון המרכזי של הטקסט'),
  ('sequence', 'הבנת רצף אירועים', 'הבנת סדר האירועים בטקסט'),
  ('cause_effect', 'קשרי סיבה ותוצאה', 'זיהוי קשרים סיבתיים בין אירועים'),
  ('reasoning', 'יכולת נימוק', 'יכולת לבסס ולנמק תשובה על סמך הטקסט')
on conflict (key) do nothing;

insert into public.achievements (key, title, description, icon, criteria) values
  ('consistent_reader_7', 'קורא מתמיד', '7 ימים רצופים של תרגול קריאה', '🏆',
    '{"type": "streak", "days": 7}'),
  ('text_detective_10', 'בלש הטקסט', 'פתר 10 שאלות הסקת מסקנות בהצלחה', '🕵️',
    '{"type": "skill_questions_correct", "skill": "inference", "count": 10}'),
  ('word_finder_25', 'מאתר המילים', 'למד 25 מילים חדשות', '📚',
    '{"type": "vocabulary_learned", "count": 25}'),
  ('first_assignment', 'צעד ראשון', 'השלים משימת קריאה ראשונה', '🌱',
    '{"type": "assignments_completed", "count": 1}'),
  ('fluent_reader', 'קריאה זורמת', 'השלים 5 תרגולי קריאה בקול', '🎙️',
    '{"type": "aloud_sessions", "count": 5}'),
  ('perfect_comprehension', 'הבנה מושלמת', 'ענה נכון על כל השאלות במשימה אחת', '💯',
    '{"type": "perfect_assignment", "count": 1}')
on conflict (key) do nothing;
