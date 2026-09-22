import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { AppliedCoupon } from "@/types";

const STORAGE_KEY = "mlm_coupon";

type CouponContextValue = {
  coupon: AppliedCoupon | null;
  setCoupon: (coupon: AppliedCoupon | null) => void;
};

const CouponContext = createContext<CouponContextValue | undefined>(undefined);

export function CouponProvider({ children }: { children: ReactNode }) {
  const [coupon, setCouponState] = useState<AppliedCoupon | null>(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as AppliedCoupon) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    try {
      if (coupon) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(coupon));
      else sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // sessionStorage no disponible, se ignora
    }
  }, [coupon]);

  return <CouponContext.Provider value={{ coupon, setCoupon: setCouponState }}>{children}</CouponContext.Provider>;
}

export function useCoupon() {
  const ctx = useContext(CouponContext);
  if (!ctx) {
    throw new Error("useCoupon debe usarse dentro de CouponProvider");
  }
  return ctx;
}
