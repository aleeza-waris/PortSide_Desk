import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { http } from '@/shared/lib/http'
import { ROOT } from '@/shared/lib/queryKeys'
import type { DayRange } from '@/shared/types'
import type { AnalyticsReport } from './types'

export const useAnalytics = (range: DayRange) =>
  useQuery({
    queryKey: [ROOT.analytics, range],
    queryFn: ({ signal }) => http.get<AnalyticsReport>('/analytics', { params: { from: range[0], to: range[1] }, signal }),
    placeholderData: keepPreviousData,
  })
