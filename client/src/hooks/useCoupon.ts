import { useMutation } from "@tanstack/react-query";
import { api, ApiClientError } from "@/lib/api";
import type { AppliedCoupon } from "@/types";

export function useValidateCoupon() {
  return useMutation({
    mutationFn: async ({ code, subtotalCents }: { code: string; subtotalCents: number }) => {
      try {
        const data = await api.post<{ valid: true; code: string; type: AppliedCoupon["type"]; discountCents: number; freeShipping: boolean }>(
          "/coupons/validate",
          { code, subtotalCents },
        );
        return { code: data.code, type: data.type, discountCents: data.discountCents, freeShipping: data.freeShipping } satisfies AppliedCoupon;
      } catch (error) {
        if (error instanceof ApiClientError) throw error;
        throw new ApiClientError(500, "No se pudo validar el cupon");
      }
    },
  });
}
