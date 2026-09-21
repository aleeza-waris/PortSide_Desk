import type { TicketChannel, TicketPriority } from '@/features/tickets/types'

export interface AnalyticsReport {
  totals: {
    created: number
    resolved: number
    /** Average hours from creation to resolution, 0 if nothing was resolved */
    avgResolutionHours: number
    /** Average rating out of 5, 0 if nobody rated */
    csat: number
    ratings: number
  }
  daily: { date: string; created: number; resolved: number }[]
  byChannel: { channel: TicketChannel; count: number }[]
  byPriority: { priority: TicketPriority; count: number }[]
  byAgent: { agentId: string; name: string; resolved: number; csat: number }[]
}
