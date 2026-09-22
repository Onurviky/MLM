import { forwardRef, type InputHTMLAttributes } from "react";
import { classNames } from "@/lib/utils";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
};

export const Input = forwardRef<HTMLInputElement, Props>(({ label, error, className, id, ...props }, ref) => {
  const inputId = id ?? props.name;
  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label htmlFor={inputId} className="text-xs uppercase tracking-widest2 text-ink-muted">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        className={classNames(
          "h-12 w-full border bg-surface px-4 text-sm text-ink placeholder:text-ink-dim focus:outline-none",
          error ? "border-accent" : "border-border focus:border-border-strong",
          className,
        )}
        {...props}
      />
      {error && <p className="text-xs text-accent-hover">{error}</p>}
    </div>
  );
});
Input.displayName = "Input";
