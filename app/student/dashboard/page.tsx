import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "הבית שלי — ReadWise AI" };

export default async function StudentDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user!.id)
    .single();

  const firstName = profile?.full_name?.split(" ")[0] ?? "";

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">שלום {firstName} 👋</h1>
        <p className="text-muted-foreground">בקרוב יופיעו כאן משימות הקריאה שלך</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>בקרוב: משימת הקריאה של היום</CardTitle>
        </CardHeader>
        <CardContent className="pb-6 text-sm text-muted-foreground">
          כרטיס משימת הקריאה היומית, זמן משוער, ומיומנות מתורגלת — יופיעו כאן לאחר שהמורה
          יקצה לך משימות ולאחר בניית מנוע הטקסטים והשאלות.
        </CardContent>
      </Card>
    </div>
  );
}
