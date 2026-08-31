import Link from "next/link";
import { Plus, Search, Clock, BookOpen } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { GENRES, DIFFICULTIES, GRADE_LEVELS_FULL } from "@/lib/validation/texts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/shared/empty-state";

export const metadata = { title: "בנק הטקסטים — ReadWise AI" };

export default async function TeacherTextsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; genre?: string; difficulty?: string; grade?: string }>;
}) {
  const { q, genre, difficulty, grade } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("texts")
    .select("id, title, genre, difficulty, grade_level, estimated_reading_time, tags, cover_icon")
    .order("created_at", { ascending: false });

  if (q) query = query.ilike("title", `%${q}%`);
  if (genre) query = query.eq("genre", genre);
  if (difficulty && (DIFFICULTIES as readonly string[]).includes(difficulty)) {
    query = query.eq("difficulty", difficulty as (typeof DIFFICULTIES)[number]);
  }
  if (grade) query = query.eq("grade_level", grade);

  const { data: texts } = await query;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">בנק הטקסטים</h1>
          <p className="text-muted-foreground">חפשו טקסט קיים או צרו טקסט חדש</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/teacher/texts/generate">
              ✨ יצירה עם AI
            </Link>
          </Button>
          <Button asChild>
            <Link href="/teacher/texts/new">
              <Plus />
              טקסט חדש
            </Link>
          </Button>
        </div>
      </div>

      <form className="flex flex-wrap items-end gap-3" method="get">
        <div className="flex min-w-48 flex-1 flex-col gap-1.5">
          <label htmlFor="q" className="text-sm font-medium">
            חיפוש לפי כותרת
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute end-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="q" name="q" defaultValue={q ?? ""} placeholder="לדוגמה: חלל" className="pe-9" />
          </div>
        </div>
        <FilterSelect name="genre" label="סוג טקסט" options={GENRES} value={genre} />
        <FilterSelect name="difficulty" label="רמת קושי" options={DIFFICULTIES} value={difficulty} />
        <FilterSelect name="grade" label="שכבת גיל" options={GRADE_LEVELS_FULL} value={grade} />
        <Button type="submit" variant="secondary">
          סינון
        </Button>
        {(q || genre || difficulty || grade) && (
          <Button asChild variant="ghost">
            <Link href="/teacher/texts">איפוס</Link>
          </Button>
        )}
      </form>

      {!texts || texts.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="לא נמצאו טקסטים"
          description="נסו לשנות את הסינון, או צרו טקסט חדש."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {texts.map((t) => (
            <Link key={t.id} href={`/teacher/texts/${t.id}`}>
              <Card className="h-full transition-colors hover:border-primary/50">
                <CardHeader>
                  <CardTitle className="flex items-start gap-2 text-base">
                    <span className="text-xl" aria-hidden>
                      {t.cover_icon}
                    </span>
                    {t.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-2 pb-6">
                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant="secondary">{t.genre}</Badge>
                    <Badge variant="outline">{t.difficulty}</Badge>
                    <Badge variant="outline">כיתה {t.grade_level}</Badge>
                  </div>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="size-3.5" aria-hidden />
                    {t.estimated_reading_time} דקות קריאה
                  </span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function FilterSelect({
  name,
  label,
  options,
  value,
}: {
  name: string;
  label: string;
  options: readonly string[];
  value?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={name} className="text-sm font-medium">
        {label}
      </label>
      <select
        id={name}
        name={name}
        defaultValue={value ?? ""}
        className="h-10 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
      >
        <option value="">הכל</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}
