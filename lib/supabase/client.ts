"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

/**
 * קליינט Supabase לשימוש ברכיבי client. משתמש אך ורק במפתח ה-anon הציבורי —
 * ה-RLS שהוגדר במסד הנתונים הוא קו ההגנה בפועל.
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
