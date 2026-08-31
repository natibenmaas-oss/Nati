"use client";

import { useActionState, useState } from "react";
import { Lightbulb } from "lucide-react";
import { createAssignmentAction, type AssignmentActionState } from "@/lib/actions/assignments";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const initialState: AssignmentActionState = {};

interface SkillRecommendation {
  skillId: string;
  skillKey: string;
  skillName: string;
  averageScore: number;
}

export function CreateAssignmentForm({
  classes,
  texts,
  skills,
  skillRecommendationsByClass,
}: {
  classes: { id: string; name: string }[];
  texts: { id: string; title: string }[];
  skills: { id: string; name_he: string }[];
  skillRecommendationsByClass: Record<string, SkillRecommendation | null>;
}) {
  const [state, formAction, isPending] = useActionState(createAssignmentAction, initialState);
  const [selectedClassId, setSelectedClassId] = useState<string>("");

  const recommendation = selectedClassId ? skillRecommendationsByClass[selectedClassId] : null;

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <Card>
        <CardContent className="flex flex-col gap-4 pt-6 pb-6">
          <div className="flex flex-col gap-2">
            <Label htmlFor="title">כותרת המשימה</Label>
            <Input id="title" name="title" required placeholder='לדוגמה: משימת קריאה - "מסע אל תוך החלל"' />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="class_id">כיתה</Label>
              <Select name="class_id" required value={selectedClassId} onValueChange={setSelectedClassId}>
                <SelectTrigger id="class_id" className="w-full">
                  <SelectValue placeholder="בחר/י כיתה" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="text_id">טקסט</Label>
              <Select name="text_id" required>
                <SelectTrigger id="text_id" className="w-full">
                  <SelectValue placeholder="בחר/י טקסט" />
                </SelectTrigger>
                <SelectContent>
                  {texts.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="instructions">הנחיות לתלמידים (אופציונלי)</Label>
            <Textarea id="instructions" name="instructions" rows={2} />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="due_date">תאריך יעד (אופציונלי)</Label>
            <Input id="due_date" name="due_date" type="date" className="w-fit" />
          </div>

          <div className="flex flex-col gap-2">
            <Label>מיומנות מיקוד (אופציונלי)</Label>
            {recommendation && (
              <p className="flex items-center gap-1.5 text-xs text-primary">
                <Lightbulb className="size-3.5" aria-hidden />
                המלצת המערכת: &quot;{recommendation.skillName}&quot; (ממוצע הכיתה במיומנות זו: {recommendation.averageScore}%)
              </p>
            )}
            {/* ה-key גורם לרינדור מחדש של הצ'קבוקסים כשמחליפים כיתה, כדי שה-defaultChecked
                המומלץ יתעדכן בלי לנהל state נפרד לכל תיבה */}
            <div key={selectedClassId} className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {skills.map((s) => (
                <label key={s.id} className="flex items-center gap-2 text-sm">
                  <Checkbox name="skill_focus" value={s.id} defaultChecked={s.id === recommendation?.skillId} />
                  {s.name_he}
                </label>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {state?.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}

      <div className="flex justify-end">
        <Button type="submit" size="lg" disabled={isPending}>
          {isPending ? "יוצר/ת..." : "יצירת משימה"}
        </Button>
      </div>
    </form>
  );
}
