import { createClient } from "@/lib/supabase/server";
import { GenerateTextForm } from "@/components/teacher/generate-text-form";

export const metadata = { title: "יצירת טקסט באמצעות AI — ReadWise AI" };

export default async function GenerateTextPage() {
  const supabase = await createClient();
  const { data: skills } = await supabase.from("skills").select("id, name_he");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">יצירת טקסט באמצעות AI</h1>
        <p className="text-muted-foreground">
          מזינים כיתה, נושא, סוג טקסט ומטרת תרגול - וה-AI מייצר טקסט ושאלות מתאימות
        </p>
      </div>
      <GenerateTextForm skills={skills ?? []} />
    </div>
  );
}
