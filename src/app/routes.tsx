import { Route, Routes } from 'react-router-dom'
import { AnalyticsPage } from '@/features/analytics/AnalyticsPage'
import { RequireAuth } from '@/features/auth/RequireAuth'
import { LoginPage } from '@/features/auth/LoginPage'
import { OverviewPage } from '@/features/dashboard/OverviewPage'
import { CustomersPage } from '@/features/customers/CustomersPage'
import { TeamPage } from '@/features/team/TeamPage'
import { TicketsPage } from '@/features/tickets/TicketsPage'
import { AppLayout } from '@/layout/AppLayout'
import { NotFound } from '@/layout/RouteFallbacks'

// Read these routes from the outside in: public pages, auth, layout, then page.
export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      {/* Every route below this line needs a signed-in user. */}
      <Route element={<RequireAuth />}>
        {/* AppLayout renders the sidebar and places the page inside its Outlet. */}
        <Route element={<AppLayout />}>
          <Route index element={<OverviewPage />} />
          <Route path="tickets" element={<TicketsPage />} />
          <Route path="customers" element={<CustomersPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="team" element={<TeamPage />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Route>
    </Routes>
  )
}
