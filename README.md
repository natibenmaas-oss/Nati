# ReadWise AI — מאמן הקריאה האישי

מערכת פדגוגית לפיתוח מיומנויות קריאה והבנת הנקרא לתלמידי בית ספר, בעברית ו-RTL מלאה, עם התאמה אישית מבוססת AI.

> 📌 סטטוס פיתוח: כל 13 שלבי הפיתוח (ראו `docs/roadmap.md`) הושלמו מבחינת קוד. המערכת עדיין לא נבדקה מול פרויקט Supabase / מפתח Anthropic חיים באמצע הפיתוח (לא היו מחוברים לסביבת הפיתוח) — יש להריץ אותה מול סביבה אמיתית ולבדוק את הזרימות המרכזיות לפני שימוש בפועל.

## Tech Stack

- **Next.js 16** (App Router, TypeScript, Turbopack)
- **Tailwind CSS v4** + רכיבי UI בסגנון shadcn/ui (Radix UI + CVA), RTL מלא
- **Supabase** — Postgres, Auth, Row Level Security
- **Anthropic Claude API** — יצירת טקסטים/שאלות, הערכת תשובות, המלצות, צ'אט (שרת בלבד)
- **Zod** — ולידציה לטפסים ולפלטי AI
- **Recharts** — גרפי התקדמות
- **Vitest** (יחידה) + **Playwright** (e2e) — ראו "בדיקות" למטה

## הרצה מקומית

```bash
npm install
cp .env.example .env.local   # ומלאו את המפתחות (Supabase + Anthropic)
```

### הקמת מסד הנתונים (Supabase)

1. צרו פרויקט חדש ב-[supabase.com](https://supabase.com) (יש תוכנית חינמית).
2. מ-Project Settings → API, העתיקו את ה-URL ואת מפתחות ה-anon וה-service_role ל-`.env.local`.
3. הריצו את קבצי ה-migration לפי הסדר (דרך ה-SQL Editor באתר Supabase, או עם `supabase db push`
   אם מותקן ה-CLI): הקבצים תחת `supabase/migrations/`, לפי סדר המספור (`0001` עד `0006`).
4. זרעו נתוני דמו לבדיקה — מורה אחד, כיתה אחת, 8 תלמידים, 11 טקסטים עם 55 שאלות,
   ומעט נתוני קריאה היסטוריים:
   ```bash
   npm run seed:demo
   ```
   בסיום יודפסו פרטי ההתחברות לדמו (אימייל המורה ושם המשתמש של התלמיד הראשון).

### הרצת השרת

```bash
npm run dev
```

הפרויקט רץ בכתובת http://localhost:3000

## בדיקות

```bash
npm run test       # בדיקות יחידה (Vitest) - ולידציה, לוגיקת ניקוד טהורה
npm run test:e2e   # בדיקות e2e (Playwright) - מסך הכניסה, ניווט, מסך 404
npm run typecheck  # tsc --noEmit
npm run lint       # eslint
```

בדיקות ה-e2e רצות מול שרת מקומי עם מפתחות Supabase מדומים (מוגדר ב-`playwright.config.ts`),
ולכן מכסות רק מסכים ציבוריים (login/register) שלא דורשים חיבור אמיתי - זרימות מאומתות
(דשבורד מורה/תלמיד, משימת קריאה) דורשות בדיקה ידנית מול פרויקט Supabase אמיתי.

## מבנה הפרויקט

```
app/            מסכי Next.js App Router (teacher/, student/, auth/)
components/ui/  רכיבי UI בסיסיים (shadcn-style)
components/     רכיבים ספציפיים לתחום (teacher/, student/, shared/)
lib/ai/         שכבת שירות ה-AI — כל קריאה ל-Claude עוברת כאן, לא ברכיבים
lib/scoring/    לוגיקת ניקוד/אגרגציה/gamification שאינה תלויה ב-AI
lib/speech/     עטיפת Web Speech API למדידת קריאה בקול
lib/actions/    Server Actions (טפסים, פעולות מאומתות)
lib/supabase/   קליינטים ל-Supabase (client/server/admin)
supabase/       migrations + טיפוסי סכימה
scripts/        seed-demo.ts — זריעת נתוני דמו
tests/unit/     בדיקות Vitest
tests/e2e/      בדיקות Playwright
types/          טיפוסי TypeScript, כולל טיפוסי ה-DB
```

## סביבת AI

כל קריאות ה-AI (`lib/ai/*`) רצות אך ורק בצד שרת (Server Actions), מוגנות ב-`import "server-only"`. מפתח `ANTHROPIC_API_KEY` אינו נחשף לעולם לצד הלקוח. אם השירות אינו זמין (אין מפתח, rate limit, timeout, refusal), כל פונקציה מחזירה תוצאה בטוחה במקום לזרוק שגיאה, והמערכת ממשיכה לעבוד עם הפונקציונליות הבסיסית (ללא AI) ומציגה הודעה מתאימה במקום לקרוס.
