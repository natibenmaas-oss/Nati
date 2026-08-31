import { askTeacherAssistantAction } from "@/lib/actions/teacher-assistant";
import { ChatPanel } from "@/components/shared/chat-panel";

export const metadata = { title: "עוזר AI — ReadWise AI" };

export default function TeacherAssistantPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">עוזר ה-AI שלי</h1>
        <p className="text-muted-foreground">שאלו על הכיתה שלכם, או בקשו הצעה לפעילות</p>
      </div>
      <ChatPanel
        greeting="שלום! אני מכיר/ה את נתוני הכיתות שלך. אפשר לשאול אותי מי זקוק לתשומת לב, לבקש רעיון לפעילות, או לבדוק מה השתפר לאחרונה."
        placeholder="שאל/י משהו על הכיתה שלך..."
        suggestions={[
          "מי בכיתה שלי מתקשה בהבנת הנקרא?",
          "תכין/י לי פעילות של 15 דקות להסקת מסקנות",
          "מה השתפר בכיתה שלי לאחרונה?",
        ]}
        sendMessage={askTeacherAssistantAction}
      />
    </div>
  );
}
