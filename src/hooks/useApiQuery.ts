import { useQuery, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import { AxiosError } from 'axios';

interface ApiQueryOptions<TData, TError> extends Omit<UseQueryOptions<TData, TError>, 'retry' | 'retryDelay'> {
  maxRetries?: number;
  retryDelay?: number;
}

export function useApiQuery<TData, TError = AxiosError>({
  queryKey,
  queryFn,
  maxRetries = 2,
  retryDelay = 5000,
  ...options
}: ApiQueryOptions<TData, TError>): UseQueryResult<TData, TError> {
  return useQuery<TData, TError>({
    queryKey,
    queryFn,
    retry: (failureCount, error: any) => {
      const status = error?.response?.status;

      // Không retry nếu là lỗi 4xx (trừ 408 Request Timeout)
      if (status >= 400 && status < 500 && status !== 408) return false;

      // Retry tối đa maxRetries lần nếu là lỗi 5xx hoặc timeout
      return failureCount < maxRetries;
    },
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, retryDelay),
    ...options,
  });
} 