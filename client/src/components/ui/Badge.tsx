import type { ReactNode } from "react";
import { classNames } from "@/lib/utils";

type Tone = "neutral" | "accent" | "success";

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: Tone }) {
  const toneClasses: Record<Tone, string> = {
    neutral: "border-border-strong text-ink-muted",
    accent: "border-accent/50 text-accent-hover",
    success: "border-success/50 text-success",
  };

  return (
    <span
      className={classNames(
        "inline-flex items-center border px-2.5 py-1 text-[10px] uppercase tracking-widest2",
        toneClasses[tone],
      )}
    >
      {children}
    </span>
  );
}
