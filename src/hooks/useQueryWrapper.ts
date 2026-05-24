import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";

interface UseQueryOptions {
  enabled?: boolean;
}

export function useFetch<T>(
  key: string | readonly unknown[],
  fn: () => Promise<T>,
  options?: UseQueryOptions
) {
  return useQuery({
    queryKey: Array.isArray(key) ? key : [key],
    queryFn: fn,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
    enabled: options?.enabled !== false,
  });
}

export function useMutationWrapper<TData, TVariables>(
  fn: (variables: TVariables) => Promise<TData>,
  options?: {
    onSuccess?: (data: TData) => void;
    onError?: (error: AxiosError) => void;
    invalidateQueries?: string | string[];
  }
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: fn,
    onSuccess: (data) => {
      if (options?.invalidateQueries) {
        const keys = Array.isArray(options.invalidateQueries)
          ? options.invalidateQueries
          : [options.invalidateQueries];
        keys.forEach((key) => queryClient.invalidateQueries({ queryKey: [key] }));
      }
      options?.onSuccess?.(data);
    },
    onError: options?.onError,
  });
}
