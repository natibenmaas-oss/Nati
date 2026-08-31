import { CreateTextForm } from "@/components/teacher/create-text-form";

export const metadata = { title: "טקסט חדש — ReadWise AI" };

export default function NewTextPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">טקסט חדש</h1>
        <p className="text-muted-foreground">הוספת טקסט לבנק הטקסטים באופן ידני</p>
      </div>
      <CreateTextForm />
    </div>
  );
}
