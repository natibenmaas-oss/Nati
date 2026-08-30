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
```

### הקמת מסד הנתונים (Supabase)

1. צרו פרויקט חדש ב-[supabase.com](https://supabase.com) (יש תוכנית חינמית).
2. מ-Project Settings → API, העתיקו את ה-URL ואת מפתחות ה-anon וה-service_role ל-`.env.local`.
3. הריצו את קבצי ה-migration לפי הסדר (דרך ה-SQL Editor באתר Supabase, או עם `supabase db push`
   אם מותקן ה-CLI): `supabase/migrations/0001_schema.sql` → `0002_rls.sql` → `0003_reference_data.sql`.
4. (אופציונלי) זרעו נתוני דמו לבדיקה — מורה אחד, כיתה אחת, 8 תלמידים:
   ```bash
   npm run seed:demo
   ```
   בסיום יודפסו פרטי ההתחברות לדמו (אימייל המורה ושם המשתמש של התלמיד הראשון).

### הרצת השרת

```bash
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
