import { Spin } from 'antd'
import type { RouteObject } from 'react-router-dom'
import { RequireAuth } from '@/features/auth/RequireAuth'
import { AppLayout } from '@/layout/AppLayout'
import { NotFound, RouteError } from '@/layout/RouteFallbacks'

/**
 * Every page is a lazy route: its code (and, for Analytics, the charting library)
 * is only downloaded when someone navigates to it. Each page module exports `Component`.
 */
export const routes: RouteObject[] = [
  {
    // Shown while the first lazy route module loads on a hard refresh.
    hydrateFallbackElement: <Spin fullscreen size="large" />,
    children: [
      { path: '/login', lazy: () => import('@/features/auth/LoginPage') },
      {
        element: <RequireAuth />,
        children: [
          {
            element: <AppLayout />,
            errorElement: <RouteError />,
            children: [
              { index: true, lazy: () => import('@/features/dashboard/OverviewPage') },
              { path: 'tickets', lazy: () => import('@/features/tickets/TicketsPage') },
              { path: 'customers', lazy: () => import('@/features/customers/CustomersPage') },
              { path: 'analytics', lazy: () => import('@/features/analytics/AnalyticsPage') },
              { path: 'team', lazy: () => import('@/features/team/TeamPage') },
              { path: '*', element: <NotFound /> },
            ],
          },
        ],
      },
    ],
  },
]
