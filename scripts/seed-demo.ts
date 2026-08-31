/**
 * עטיפת CLI דקה סביב lib/seed/seed-demo-data.ts (הלוגיקה עצמה, ראו שם).
 *
 * הרצה:
 *   npx tsx scripts/seed-demo.ts
 *
 * דורש את משתני הסביבה מתוך .env.local:
 *   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *
 * הערה: אם ההרצה המקומית הזו חסומה ברשת (למשל בסביבת פיתוח מבודדת), אפשר
 * גם לזרוע את נתוני הדמו דרך app/api/admin/seed-demo/route.ts - נקודת קצה
 * מוגנת בסוד (SEED_ADMIN_SECRET) שרצה בתוך השרת המופרס עצמו.
 */
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import type { Database } from "../types/database";
import { seedDemoData } from "../lib/seed/seed-demo-data";

config({ path: ".env.local" });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  console.error("❌ חסרים NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY ב-.env.local");
  process.exit(1);
}

const supabase = createClient<Database>(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

seedDemoData(supabase)
  .then((result) => {
    console.log("\n✅ פרטי התחברות לדמו:");
    console.log(`   מורה  -> אימייל: ${result.teacherEmail} | סיסמה: ${result.teacherPassword}`);
    console.log(`   תלמיד -> שם משתמש: ${result.studentUsernameExample} | סיסמה: ${result.studentPassword}`);
  })
  .catch((err) => {
    console.error("❌ זריעת הדמו נכשלה:", err);
    process.exit(1);
  });
