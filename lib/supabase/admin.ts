import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * קליינט Supabase עם מפתח service_role — עוקף RLS לחלוטין.
 *
 * ⚠️ שימוש בשרת בלבד (Server Actions / Route Handlers / lib/scoring, lib/ai).
 * אסור לייבא קובץ זה מרכיב client — "server-only" יזרוק שגיאת build אם ינסו.
 * שימושים אופייניים: יצירת חשבון תלמיד (Auth Admin API), עדכון ציוני מיומנות
 * מחושבים, הענקת הישגים — פעולות שאינן אמורות להיות כתיבות ישירות מהלקוח.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "חסרים משתני סביבה של Supabase (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)"
    );
  }

  return createSupabaseClient<Database>(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
