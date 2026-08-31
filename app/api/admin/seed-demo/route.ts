import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { seedDemoData } from "@/lib/seed/seed-demo-data";

/**
 * נקודת קצה חד-פעמית לזריעת נתוני דמו על מסד נתונים חי, ישירות מהשרת המופרס
 * (ל-Route Handler יש גישת רשת מלאה ל-Supabase, בניגוד לסביבת הפיתוח המבודדת
 * שבה נכתב הקוד). מוגנת בסוד קבוע מראש - SEED_ADMIN_SECRET - שיש להגדיר
 * במשתני הסביבה של הפריסה (Vercel וכו') ולעולם לא לחשוף בקוד.
 *
 * שימוש: GET /api/admin/seed-demo?secret=<SEED_ADMIN_SECRET>
 * אידמפוטנטי - אפשר לקרוא לו כמה פעמים בלי ליצור כפילויות.
 */
export async function GET(request: NextRequest) {
  const expectedSecret = process.env.SEED_ADMIN_SECRET;
  const providedSecret = request.nextUrl.searchParams.get("secret");

  if (!expectedSecret) {
    return NextResponse.json(
      { success: false, error: "SEED_ADMIN_SECRET אינו מוגדר במשתני הסביבה של הפריסה" },
      { status: 500 }
    );
  }
  if (!providedSecret || providedSecret !== expectedSecret) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const admin = createAdminClient();
    const result = await seedDemoData(admin);
    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    console.error("❌ זריעת הדמו נכשלה:", err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
