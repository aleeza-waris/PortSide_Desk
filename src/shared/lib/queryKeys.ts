import type { QueryClient } from '@tanstack/react-query'

/** Root of every query key. Features append their own params after these. */
export const ROOT = {
  tickets: 'tickets',
  customers: 'customers',
  agents: 'agents',
  dashboard: 'dashboard',
  analytics: 'analytics',
} as const

type Root = (typeof ROOT)[keyof typeof ROOT]

const invalidate = (client: QueryClient, roots: Root[]) =>
  Promise.all(roots.map((root) => client.invalidateQueries({ queryKey: [root] })))

/** Everything that shows ticket data, directly or as a count. */
export const invalidateTicketData = (client: QueryClient) =>
  invalidate(client, [ROOT.tickets, ROOT.dashboard, ROOT.analytics, ROOT.customers, ROOT.agents])

/** Customer edits show up in ticket rows too. */
export const invalidateCustomerData = (client: QueryClient) =>
  invalidate(client, [ROOT.customers, ROOT.tickets, ROOT.dashboard])
