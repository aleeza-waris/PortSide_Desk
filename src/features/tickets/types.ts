import type { DayRange, SortOrder } from '@/shared/types'

export const TICKET_STATUSES = ['open', 'pending', 'resolved', 'closed'] as const
export type TicketStatus = (typeof TICKET_STATUSES)[number]

export const TICKET_PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const
export type TicketPriority = (typeof TICKET_PRIORITIES)[number]

export const TICKET_CHANNELS = ['email', 'chat', 'phone', 'portal'] as const
export type TicketChannel = (typeof TICKET_CHANNELS)[number]

export const STATUS_LABEL: Record<TicketStatus, string> = {
  open: 'Open',
  pending: 'Waiting on customer',
  resolved: 'Resolved',
  closed: 'Closed',
}
export const PRIORITY_LABEL: Record<TicketPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
}
export const CHANNEL_LABEL: Record<TicketChannel, string> = {
  email: 'Email',
  chat: 'Live chat',
  phone: 'Phone',
  portal: 'Customer portal',
}

export interface Ticket {
  id: string
  /** Human-facing reference, shown as PS-1042 */
  number: number
  subject: string
  description: string
  status: TicketStatus
  priority: TicketPriority
  channel: TicketChannel
  customerId: string
  assigneeId: string | null
  tags: string[]
  dueAt: string | null
  createdAt: string
  updatedAt: string
  /** Set by the server when a ticket moves to resolved/closed. */
  resolvedAt: string | null
  /** 1–5, only on tickets a customer has rated. */
  csat: number | null
}

/** A ticket as returned by the list endpoints: the row plus who it belongs to. */
export interface TicketRow extends Ticket {
  customer: { id: string; name: string; company: string }
  assignee: { id: string; name: string; avatarColor: string } | null
}

/** What the form sends to create or update a ticket. */
export type TicketInput = Pick<
  Ticket,
  'subject' | 'description' | 'status' | 'priority' | 'channel' | 'customerId' | 'assigneeId' | 'tags' | 'dueAt'
>

export type TicketSortField = 'number' | 'customer' | 'status' | 'priority' | 'assignee' | 'dueAt' | 'createdAt'

export const UNASSIGNED = 'unassigned'

export interface TicketListParams {
  page: number
  pageSize: number
  sortField: TicketSortField | null
  sortOrder: SortOrder | null
  q: string
  status: TicketStatus[]
  priority: TicketPriority[]
  /** An agent id, or `UNASSIGNED`. */
  assigneeId: string | null
  customerId: string | null
  createdRange: DayRange | null
  overdue: boolean
}

export type BulkTicketAction =
  | { action: 'delete'; ids: string[] }
  | { action: 'setStatus'; ids: string[]; status: TicketStatus }

export const ref = (number: number) => `PS-${number}`
