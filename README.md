# ReadWise AI — מאמן הקריאה האישי

מערכת פדגוגית לפיתוח מיומנויות קריאה והבנת הנקרא לתלמידי בית ספר, בעברית ו-RTL מלאה, עם התאמה אישית מבוססת AI.

> 📌 סטטוס פיתוח: הפרויקט בבנייה בשלבים (ראו `docs/roadmap.md`). לא כל היכולות המתוארות במפרט המלא זמינות עדיין.

## Tech Stack

- **Next.js 16** (App Router, TypeScript, Turbopack)
- **Tailwind CSS v4** + רכיבי UI בסגנון shadcn/ui (Radix UI + CVA), RTL מלא
- **Supabase** — Postgres, Auth, Row Level Security
- **Anthropic Claude API** — יצירת טקסטים/שאלות, הערכת תשובות, המלצות (שרת בלבד)
- **Zod** — ולידציה לטפסים ולפלטי AI
- **Recharts** — גרפי התקדמות

## הרצה מקומית

```bash
npm install
cp .env.example .env.local   # ומלאו את המפתחות (Supabase + Anthropic)
npm run dev
```

הפרויקט רץ בכתובת http://localhost:3000

## מבנה הפרויקט

```
app/            מסכי Next.js App Router (teacher/, student/, auth/)
components/ui/  רכיבי UI בסיסיים (shadcn-style)
components/     רכיבים ספציפיים לתחום (teacher/, student/, charts/)
lib/ai/         שכבת שירות ה-AI — כל קריאה ל-Claude עוברת כאן, לא ברכיבים
lib/scoring/    לוגיקת ניקוד/אגרגציה שאינה תלויה ב-AI
lib/supabase/   קליינטים ל-Supabase (client/server)
supabase/       migrations + seed data
types/          טיפוסי TypeScript, כולל טיפוסי ה-DB
```

## סביבת AI

כל קריאות ה-AI (`lib/ai/*`) רצות אך ורק בצד שרת (Server Actions / Route Handlers). מפתח `ANTHROPIC_API_KEY` אינו נחשף לעולם לצד הלקוח. אם השירות אינו זמין, המערכת ממשיכה לעבוד עם הפונקציונליות הבסיסית (ללא AI) ומציגה הודעה מתאימה.
