import { forwardRef, type SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";
import { classNames } from "@/lib/utils";

type Props = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  error?: string;
};

export const Select = forwardRef<HTMLSelectElement, Props>(
  ({ label, error, className, id, children, ...props }, ref) => {
    const selectId = id ?? props.name;
    return (
      <div className="flex flex-col gap-2">
        {label && (
          <label htmlFor={selectId} className="text-xs uppercase tracking-widest2 text-ink-muted">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={classNames(
              "h-12 w-full appearance-none border bg-surface px-4 pr-10 text-sm text-ink focus:outline-none",
              error ? "border-accent" : "border-border focus:border-border-strong",
              className,
            )}
            {...props}
          >
            {children}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-dim" />
        </div>
        {error && <p className="text-xs text-accent-hover">{error}</p>}
      </div>
    );
  },
);
Select.displayName = "Select";
