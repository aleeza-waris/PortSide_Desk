export type AgentRole = 'admin' | 'agent'

export interface Agent {
  id: string
  name: string
  email: string
  role: AgentRole
  avatarColor: string
  available: boolean
}

export interface AgentRow extends Agent {
  openTickets: number
  resolvedThisWeek: number
  /** Average customer rating over the last 90 days, 0 when there are no ratings yet. */
  csat: number
}
