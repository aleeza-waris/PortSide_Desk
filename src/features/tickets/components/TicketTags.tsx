import { Tag, Tooltip, Typography } from 'antd'
import dayjs from '@/shared/lib/dayjs'
import { formatDateTime } from '@/shared/lib/format'
import { PRIORITY_LABEL, ref, STATUS_LABEL, type Ticket, type TicketPriority, type TicketStatus } from '../types'

const STATUS_COLOR: Record<TicketStatus, string> = {
  open: 'blue',
  pending: 'gold',
  resolved: 'green',
  closed: 'default',
}

const PRIORITY_COLOR: Record<TicketPriority, string> = {
  low: 'default',
  medium: 'geekblue',
  high: 'orange',
  urgent: 'red',
}

export const StatusTag = ({ status }: { status: TicketStatus }) => (
  <Tag color={STATUS_COLOR[status]} variant="filled" className="me-0">
    {STATUS_LABEL[status]}
  </Tag>
)

export const PriorityTag = ({ priority }: { priority: TicketPriority }) => (
  <Tag color={PRIORITY_COLOR[priority]} variant={priority === 'urgent' ? 'solid' : 'filled'} className="me-0">
    {PRIORITY_LABEL[priority]}
  </Tag>
)

/** PS-1042 in the monospace face: reference numbers get compared and read out loud. */
export const TicketRef = ({ number }: { number: number }) => (
  <span className="font-mono text-[12.5px] tracking-normal">{ref(number)}</span>
)

export const isOverdue = (ticket: Pick<Ticket, 'status' | 'dueAt'>) =>
  (ticket.status === 'open' || ticket.status === 'pending') && !!ticket.dueAt && dayjs(ticket.dueAt).isBefore(dayjs())

/** "in 5 hours", or "Overdue 3 hours" in red once the deadline has passed. */
export function DueLabel({ ticket }: { ticket: Pick<Ticket, 'status' | 'dueAt'> }) {
  if (!ticket.dueAt) return <Typography.Text type="secondary">No deadline</Typography.Text>
  const done = ticket.status === 'resolved' || ticket.status === 'closed'
  const overdue = isOverdue(ticket)
  const text = done ? dayjs(ticket.dueAt).format('D MMM') : overdue ? `Overdue ${dayjs(ticket.dueAt).fromNow(true)}` : dayjs(ticket.dueAt).fromNow()
  return (
    <Tooltip title={formatDateTime(ticket.dueAt)}>
      <Typography.Text
        type={overdue ? 'danger' : done ? 'secondary' : undefined}
        strong={overdue}
        className="whitespace-nowrap"
      >
        {text}
      </Typography.Text>
    </Tooltip>
  )
}
