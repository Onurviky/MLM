import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { User } from "@/types";

export function useUpdateProfile() {
  return useMutation({
    mutationFn: (input: { name: string; email: string }) => api.patch<{ user: User }>("/auth/me", input),
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (input: { currentPassword: string; newPassword: string }) =>
      api.post<void>("/auth/password", input),
  });
}

export function useUpdateAddress() {
  return useMutation({
    mutationFn: (input: {
      fullName: string;
      line1: string;
      city: string;
      province: string;
      postalCode: string;
      phone: string;
    }) => api.put<{ user: User }>("/auth/address", input),
  });
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: (input: { email: string }) => api.post<{ message: string }>("/auth/forgot-password", input),
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: (input: { token: string; newPassword: string }) => api.post<void>("/auth/reset-password", input),
  });
}
