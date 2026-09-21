import { useQuery } from '@tanstack/react-query'
import { http } from '@/shared/lib/http'
import { ROOT } from '@/shared/lib/queryKeys'
import type { DashboardSummary } from './types'

export const useDashboard = () =>
  useQuery({ queryKey: [ROOT.dashboard], queryFn: ({ signal }) => http.get<DashboardSummary>('/dashboard', { signal }) })
