import { askStudentCoachAction } from "@/lib/actions/student-coach";
import { ChatPanel } from "@/components/shared/chat-panel";

export const metadata = { title: "מאמן הקריאה — ReadWise AI" };

export default function StudentCoachPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">מאמן הקריאה שלי 🎯</h1>
        <p className="text-muted-foreground">בואו נדבר על הקריאה שלך</p>
      </div>
      <ChatPanel
        greeting="שלום! אני כאן כדי לעזור לך להיות קורא/ת עוד יותר טוב/ה. ספר/י לי במה בא לך להתמקד היום?"
        placeholder="כתוב/כתבי כאן..."
        suggestions={["בוא נתרגל הסקת מסקנות", "ספר/י לי על הטקסט האחרון שקראתי", "יש לי שאלה"]}
        sendMessage={askStudentCoachAction}
      />
    </div>
  );
}
