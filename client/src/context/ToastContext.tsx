import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

type Toast = { id: number; message: string; variant: "default" | "error" | "success" };

type ToastContextValue = {
  push: (message: string, variant?: Toast["variant"]) => void;
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

let nextId = 1;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((message: string, variant: Toast["variant"] = "default") => {
    const id = nextId++;
    setToasts((prev) => [...prev, { id, message, variant }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`min-w-[240px] max-w-sm border px-4 py-3 text-sm shadow-lg backdrop-blur-sm ${
              t.variant === "error"
                ? "border-accent/40 bg-accent/10 text-accent-hover"
                : t.variant === "success"
                  ? "border-success/40 bg-success/10 text-success"
                  : "border-border-strong bg-elevated text-ink"
            }`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast debe usarse dentro de ToastProvider");
  }
  return ctx;
}
