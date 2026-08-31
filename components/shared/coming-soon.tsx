import { Construction } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";

export function ComingSoon({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">{title}</h1>
      <EmptyState
        icon={Construction}
        title="בבנייה"
        description={description}
      />
    </div>
  );
}
