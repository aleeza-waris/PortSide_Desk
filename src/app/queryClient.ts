import { QueryClient } from '@tanstack/react-query'
import { ApiError } from '@/shared/lib/http'

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: false,
        // Retrying a 404 or 422 never helps; a dropped connection might.
        retry: (failureCount, error) => !(error instanceof ApiError && error.status >= 400 && error.status < 500) && failureCount < 1,
      },
      mutations: { retry: false },
    },
  })
}
