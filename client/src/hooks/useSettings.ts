import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { StoreSettings } from "@/types";

export function useSettings() {
  return useQuery({
    queryKey: ["settings"],
    queryFn: () => api.get<StoreSettings>("/settings"),
    staleTime: 5 * 60_000,
  });
}
