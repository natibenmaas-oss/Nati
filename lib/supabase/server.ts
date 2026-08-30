import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";

/**
 * קליינט Supabase לשימוש ב-Server Components / Server Actions / Route Handlers.
 * פועל תחת ה-session של המשתמש המחובר (עוגיות) — כפוף במלואו ל-RLS.
 * אין להשתמש בו כדי לעקוף הרשאות; לצורך זה קיים lib/supabase/admin.ts.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // נקרא מתוך Server Component (לא Server Action/Route Handler) —
            // אפשר להתעלם אם קיים proxy.ts שמרענן את ה-session
          }
        },
      },
    }
  );
}
