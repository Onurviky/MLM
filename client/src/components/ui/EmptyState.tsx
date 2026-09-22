import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 border border-dashed border-border px-6 py-20 text-center">
      <Icon className="h-8 w-8 text-ink-dim" strokeWidth={1.25} />
      <div className="space-y-1">
        <p className="font-heading text-2xl tracking-wide text-ink">{title}</p>
        {description && <p className="text-sm text-ink-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}
