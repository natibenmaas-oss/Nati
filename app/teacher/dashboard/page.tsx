import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "דשבורד מורה — ReadWise AI" };

export default async function TeacherDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user!.id)
    .single();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">שלום, {profile?.full_name} 👋</h1>
        <p className="text-muted-foreground">זה מצב הקריאה של הכיתה שלך</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>בקרוב: לוח הבקרה המלא</CardTitle>
        </CardHeader>
        <CardContent className="pb-6 text-sm text-muted-foreground">
          כרטיסי הסיכום (מספר תלמידים, ממוצע הבנת הנקרא, תלמידים שזקוקים לתשומת לב וכו׳),
          גרף התקדמות הכיתה, ורשימת התלמידים שדורשים תשומת לב — ייבנו בשלב הבא (ניהול כיתות
          ותלמידים), לאחר שיהיו נתוני קריאה אמיתיים להציג.
        </CardContent>
      </Card>
    </div>
  );
}
