import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiClientError } from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import type { ShippingMethod } from "@/types";

export type ShippingMethodFormInput = {
  name: string;
  description: string;
  priceCents: number;
  active: boolean;
  sortOrder: number;
};

export function useShippingMethods() {
  return useQuery({
    queryKey: ["shipping-methods"],
    queryFn: () => api.get<{ items: ShippingMethod[] }>("/shipping-methods"),
  });
}

export function useAdminShippingMethods() {
  return useQuery({
    queryKey: ["admin", "shipping-methods"],
    queryFn: () => api.get<{ items: ShippingMethod[] }>("/admin/shipping-methods"),
  });
}

export function useCreateShippingMethod() {
  const queryClient = useQueryClient();
  const { push } = useToast();

  return useMutation({
    mutationFn: (input: ShippingMethodFormInput) => api.post<{ item: ShippingMethod }>("/admin/shipping-methods", input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "shipping-methods"] });
      queryClient.invalidateQueries({ queryKey: ["shipping-methods"] });
      push("Metodo de envio creado", "success");
    },
    onError: (error: unknown) => {
      push(error instanceof ApiClientError ? error.message : "No se pudo crear el metodo de envio", "error");
    },
  });
}

export function useUpdateShippingMethod() {
  const queryClient = useQueryClient();
  const { push } = useToast();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<ShippingMethodFormInput> }) =>
      api.patch<{ item: ShippingMethod }>(`/admin/shipping-methods/${id}`, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "shipping-methods"] });
      queryClient.invalidateQueries({ queryKey: ["shipping-methods"] });
      push("Metodo de envio actualizado", "success");
    },
    onError: (error: unknown) => {
      push(error instanceof ApiClientError ? error.message : "No se pudo actualizar el metodo de envio", "error");
    },
  });
}

export function useDeleteShippingMethod() {
  const queryClient = useQueryClient();
  const { push } = useToast();

  return useMutation({
    mutationFn: (id: string) => api.delete(`/admin/shipping-methods/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "shipping-methods"] });
      queryClient.invalidateQueries({ queryKey: ["shipping-methods"] });
      push("Metodo de envio eliminado", "success");
    },
    onError: (error: unknown) => {
      push(error instanceof ApiClientError ? error.message : "No se pudo eliminar el metodo de envio", "error");
    },
  });
}
