import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  tone = "default",
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  hint?: string;
  tone?: "default" | "success" | "warning";
}) {
  return (
    <Card>
      <CardContent className="flex items-start gap-4 pt-6 pb-6">
        <div
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-xl",
            tone === "success" && "bg-success/15 text-success",
            tone === "warning" && "bg-warning/20 text-warning-foreground",
            tone === "default" && "bg-primary/10 text-primary"
          )}
          aria-hidden
        >
          <Icon className="size-5" />
        </div>
        <div className="flex flex-col">
          <span className="text-2xl font-bold leading-tight">{value}</span>
          <span className="text-sm text-muted-foreground">{label}</span>
          {hint && <span className="mt-1 text-xs text-muted-foreground">{hint}</span>}
        </div>
      </CardContent>
    </Card>
  );
}
