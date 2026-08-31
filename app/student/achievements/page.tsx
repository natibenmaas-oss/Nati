import { Lock, Trophy } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export const metadata = { title: "הישגים — ReadWise AI" };

export default async function StudentAchievementsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: achievements }, { data: earned }, { data: student }] = await Promise.all([
    supabase.from("achievements").select("id, key, title, description, icon").order("title"),
    supabase.from("student_achievements").select("achievement_id, earned_at").eq("student_id", user!.id),
    supabase.from("students").select("total_points, current_streak, longest_streak").eq("id", user!.id).single(),
  ]);

  const earnedByAchievementId = new Map((earned ?? []).map((e) => [e.achievement_id, e.earned_at]));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">ההישגים שלי</h1>
        <p className="text-muted-foreground">
          {student?.total_points ?? 0} נקודות · הרצף הכי ארוך: {student?.longest_streak ?? 0} ימים
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {(achievements ?? []).map((a) => {
          const earnedAt = earnedByAchievementId.get(a.id);
          const isEarned = !!earnedAt;
          return (
            <Card
              key={a.id}
              className={cn("relative overflow-hidden", !isEarned && "border-dashed opacity-60")}
            >
              <CardContent className="flex flex-col items-center gap-2 pt-6 pb-6 text-center">
                <div
                  className={cn(
                    "flex size-14 items-center justify-center rounded-2xl text-3xl",
                    isEarned ? "bg-warning/20" : "bg-muted"
                  )}
                  aria-hidden
                >
                  {isEarned ? a.icon : <Lock className="size-6 text-muted-foreground" />}
                </div>
                <p className="font-medium">{a.title}</p>
                <p className="text-xs text-muted-foreground">{a.description}</p>
                {isEarned && earnedAt && (
                  <p className="text-xs font-medium text-warning-foreground">
                    הושג ב-{new Date(earnedAt).toLocaleDateString("he-IL")}
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {(!achievements || achievements.length === 0) && (
        <div className="flex flex-col items-center gap-2 py-12 text-center text-muted-foreground">
          <Trophy className="size-8" aria-hidden />
          <p>אין עדיין הישגים זמינים</p>
        </div>
      )}
    </div>
  );
}
