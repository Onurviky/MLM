import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Category, Collection, PaginatedProducts, Product } from "@/types";

export type ProductFilters = {
  category?: string;
  collection?: string;
  search?: string;
  sort?: string;
  page?: number;
};

function buildQuery(filters: ProductFilters): string {
  const params = new URLSearchParams();
  if (filters.category) params.set("category", filters.category);
  if (filters.collection) params.set("collection", filters.collection);
  if (filters.search) params.set("search", filters.search);
  if (filters.sort) params.set("sort", filters.sort);
  if (filters.page) params.set("page", String(filters.page));
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export function useProducts(filters: ProductFilters) {
  return useQuery({
    queryKey: ["products", filters],
    queryFn: () => api.get<PaginatedProducts>(`/products${buildQuery(filters)}`),
    placeholderData: (prev) => prev,
  });
}

export function useFeaturedProducts() {
  return useQuery({
    queryKey: ["products", "featured"],
    queryFn: () => api.get<{ items: Product[] }>("/products/featured"),
  });
}

export function useProduct(slug: string | undefined) {
  return useQuery({
    queryKey: ["product", slug],
    queryFn: () => api.get<{ item: Product }>(`/products/${slug}`),
    enabled: Boolean(slug),
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: () => api.get<{ items: Category[] }>("/categories"),
  });
}

export function useCollections() {
  return useQuery({
    queryKey: ["collections"],
    queryFn: () => api.get<{ items: Collection[] }>("/collections"),
  });
}
