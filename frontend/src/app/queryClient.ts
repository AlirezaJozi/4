import { QueryClient } from '@tanstack/react-query'
import { ApiError } from '../lib/api/types'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        if (error instanceof ApiError) {
          if ([400, 401, 403, 404, 409, 422, 429].includes(error.status)) return false
        }
        return failureCount < 1
      },
    },
    mutations: {
      retry: false,
    },
  },
})
