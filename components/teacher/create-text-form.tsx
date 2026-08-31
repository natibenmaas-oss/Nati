"use client";

import { useActionState } from "react";
import { createTextAction, type TextActionState } from "@/lib/actions/texts";
import { GENRES, DIFFICULTIES, GRADE_LEVELS_FULL, VOCAB_LEVELS } from "@/lib/validation/texts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";

const initialState: TextActionState = {};

export function CreateTextForm() {
  const [state, formAction, isPending] = useActionState(createTextAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <Card>
        <CardContent className="flex flex-col gap-4 pt-6 pb-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_auto]">
            <div className="flex flex-col gap-2">
              <Label htmlFor="title">כותרת</Label>
              <Input id="title" name="title" required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="cover_icon">אייקון</Label>
              <Input id="cover_icon" name="cover_icon" defaultValue="📖" className="w-20 text-center text-lg" maxLength={4} />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="content">תוכן הטקסט</Label>
            <Textarea id="content" name="content" required rows={12} />
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <SelectField name="grade_level" label="שכבת גיל" options={GRADE_LEVELS_FULL} defaultValue="ד׳" />
            <SelectField name="difficulty" label="רמת קושי" options={DIFFICULTIES} defaultValue="בינוני" />
            <SelectField name="genre" label="סוג טקסט" options={GENRES} defaultValue={GENRES[0]} />
            <SelectField name="vocabulary_level" label="רמת אוצר מילים" options={VOCAB_LEVELS} defaultValue="בינוני" />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="estimated_reading_time">זמן קריאה משוער (דקות)</Label>
              <Input
                id="estimated_reading_time"
                name="estimated_reading_time"
                type="number"
                min={1}
                max={60}
                defaultValue={5}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="tags">תגיות (מופרדות בפסיק)</Label>
              <Input id="tags" name="tags" placeholder="חלל, מדע, כיתה ד" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-4 pt-6 pb-6">
          <p className="text-sm font-medium">מילים שכדאי להכיר (עד 3, אופציונלי)</p>
          {[1, 2, 3].map((i) => (
            <div key={i} className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_2fr]">
              <Input name={`vocab_word_${i}`} placeholder={`מילה ${i}`} />
              <Input name={`vocab_definition_${i}`} placeholder="הסבר קצר" />
            </div>
          ))}
        </CardContent>
      </Card>

      {state?.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}

      <div className="flex justify-end gap-3">
        <Button type="submit" size="lg" disabled={isPending}>
          {isPending ? "שומר/ת..." : "שמירת הטקסט"}
        </Button>
      </div>
    </form>
  );
}

function SelectField({
  name,
  label,
  options,
  defaultValue,
}: {
  name: string;
  label: string;
  options: readonly string[];
  defaultValue: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={name}>{label}</Label>
      <Select name={name} defaultValue={defaultValue}>
        <SelectTrigger id={name} className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o} value={o}>
              {o}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
