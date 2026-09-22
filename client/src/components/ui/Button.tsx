import { forwardRef, useRef, useState, type ButtonHTMLAttributes, type MouseEvent } from "react";
import { Loader2 } from "lucide-react";
import { classNames } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
};

type Ripple = { id: number; x: number; y: number; size: number };

const variantClasses: Record<Variant, string> = {
  primary: "bg-ink text-bg hover:bg-ink/90 disabled:bg-ink/40",
  secondary: "border border-border-strong text-ink hover:bg-elevated disabled:opacity-40",
  ghost: "text-ink-muted hover:text-ink disabled:opacity-40",
  danger: "bg-accent text-ink hover:bg-accent-hover disabled:bg-accent/40",
};

const rippleColor: Record<Variant, string> = {
  primary: "bg-bg/30",
  secondary: "bg-ink/20",
  ghost: "bg-ink/15",
  danger: "bg-ink/25",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-9 px-4 text-xs",
  md: "h-11 px-6 text-sm",
  lg: "h-14 px-8 text-sm",
};

let rippleId = 0;

export const Button = forwardRef<HTMLButtonElement, Props>(
  ({ className, variant = "primary", size = "md", loading, disabled, children, onClick, ...props }, ref) => {
    const [ripples, setRipples] = useState<Ripple[]>([]);
    const localRef = useRef<HTMLButtonElement | null>(null);

    function handleClick(e: MouseEvent<HTMLButtonElement>) {
      const target = localRef.current;
      if (target) {
        const rect = target.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height) * 1.6;
        const id = rippleId++;
        setRipples((prev) => [
          ...prev,
          { id, x: e.clientX - rect.left - size / 2, y: e.clientY - rect.top - size / 2, size },
        ]);
        setTimeout(() => setRipples((prev) => prev.filter((r) => r.id !== id)), 650);
      }
      onClick?.(e);
    }

    return (
      <button
        ref={(node) => {
          localRef.current = node;
          if (typeof ref === "function") ref(node);
          else if (ref) ref.current = node;
        }}
        disabled={disabled || loading}
        onClick={handleClick}
        className={classNames(
          "relative inline-flex items-center justify-center gap-2 overflow-hidden whitespace-nowrap uppercase tracking-widest2 font-medium transition-[transform,background-color] duration-200 ease-editorial active:scale-[0.97] disabled:cursor-not-allowed disabled:active:scale-100",
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
        {...props}
      >
        {ripples.map((r) => (
          <span
            key={r.id}
            className={classNames("pointer-events-none absolute rounded-full animate-ripple", rippleColor[variant])}
            style={{ left: r.x, top: r.y, width: r.size, height: r.size }}
          />
        ))}
        <span className="relative inline-flex items-center justify-center gap-2">
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {children}
        </span>
      </button>
    );
  },
);
Button.displayName = "Button";
