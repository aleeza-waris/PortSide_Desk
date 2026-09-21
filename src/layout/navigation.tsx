import {
  BarChartOutlined,
  CustomerServiceOutlined,
  DashboardOutlined,
  ShopOutlined,
  TeamOutlined,
} from '@ant-design/icons'
import type { ReactNode } from 'react'

export interface NavItem {
  path: string
  label: string
  icon: ReactNode
}

export const NAV_ITEMS: NavItem[] = [
  { path: '/', label: 'Overview', icon: <DashboardOutlined /> },
  { path: '/tickets', label: 'Tickets', icon: <CustomerServiceOutlined /> },
  { path: '/customers', label: 'Customers', icon: <ShopOutlined /> },
  { path: '/analytics', label: 'Analytics', icon: <BarChartOutlined /> },
  { path: '/team', label: 'Team', icon: <TeamOutlined /> },
]

/** The nav item whose section the current URL is in. */
export function activePath(pathname: string): string {
  const match = NAV_ITEMS.filter((item) => item.path !== '/').find(
    (item) => pathname === item.path || pathname.startsWith(`${item.path}/`),
  )
  return match?.path ?? '/'
}
