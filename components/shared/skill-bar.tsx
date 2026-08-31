import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export function SkillBar({
  label,
  value,
  sampleSize,
}: {
  label: string;
  value: number;
  sampleSize?: number;
}) {
  const hasData = sampleSize === undefined || sampleSize > 0;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className={cn("text-muted-foreground", !hasData && "italic")}>
          {hasData ? `${value}%` : "אין נתונים"}
        </span>
      </div>
      <Progress value={hasData ? value : 0} aria-label={`${label}: ${hasData ? `${value}%` : "אין נתונים"}`} />
    </div>
  );
}
