import { Loader2 } from "lucide-react";
import { classNames } from "@/lib/utils";

export function Spinner({ className }: { className?: string }) {
  return (
    <div className={classNames("flex items-center justify-center py-16", className)}>
      <Loader2 className="h-6 w-6 animate-spin text-ink-muted" />
    </div>
  );
}
