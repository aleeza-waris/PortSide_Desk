import type { TicketRow, TicketStatus } from '@/features/tickets/types'

export interface DashboardSummary {
  counts: Record<TicketStatus, number>
  overdue: number
  unassigned: number
  createdThisWeek: number
  createdLastWeek: number
  /** Open and waiting tickets, soonest deadline first (overdue ones lead). */
  dueNext: TicketRow[]
}
