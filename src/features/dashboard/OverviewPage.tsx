import { ArrowDownOutlined, ArrowUpOutlined } from '@ant-design/icons'
import { Card, Flex, Progress, Statistic, Table, Typography, type TableColumnsType } from 'antd'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { selectCurrentUser } from '@/features/auth/authSlice'
import { DueLabel, PriorityTag, TicketRef } from '@/features/tickets/components/TicketTags'
import { filtersReplaced } from '@/features/tickets/ticketsSlice'
import {
  ref,
  STATUS_LABEL,
  TICKET_STATUSES,
  UNASSIGNED,
  type TicketPriority,
  type TicketRow,
  type TicketStatus,
} from '@/features/tickets/types'
import { PageHeader } from '@/shared/components/PageHeader'
import { QueryError } from '@/shared/components/QueryError'
import { UserAvatar } from '@/shared/components/UserAvatar'
import dayjs from '@/shared/lib/dayjs'
import { DAY_FORMAT } from '@/shared/lib/format'
import { useDashboard } from './api'

/** The coloured band on the left edge of each board row, like the colour band on a departures board. */
const PRIORITY_STRIPE: Record<TicketPriority, string> = {
  urgent: '[&>td:first-child]:shadow-[inset_3px_0_0_#cf1322]',
  high: '[&>td:first-child]:shadow-[inset_3px_0_0_#fa8c16]',
  medium: '[&>td:first-child]:shadow-[inset_3px_0_0_#597ef7]',
  low: '[&>td:first-child]:shadow-[inset_3px_0_0_#bfbfbf]',
}

const STATUS_STROKE: Record<TicketStatus, string> = {
  open: '#1677ff',
  pending: '#d99a00',
  resolved: '#389e0d',
  closed: '#8c98a4',
}

/** One KPI tile. Dividers between tiles, and a second row on tablets, are handled with variants. */
const TILE = [
  'flex cursor-pointer flex-col items-start gap-1.5 border-0 border-s border-line bg-transparent px-[22px] py-[18px] text-start text-inherit transition-colors',
  'hover:bg-fill first:border-s-0',
  'focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand',
  'max-[991px]:nth-3:border-s-0 max-[991px]:nth-[n+3]:border-t',
].join(' ')

function greeting() {
  const hour = new Date().getHours()
  return hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
}

export function OverviewPage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const user = useAppSelector(selectCurrentUser)
  const { data, isLoading, isError, error, refetch } = useDashboard()

  /** Every tile on this page is a doorway into the Tickets page with a filter already applied. */
  const openTickets = (filters: Parameters<typeof filtersReplaced>[0]) => {
    dispatch(filtersReplaced(filters))
    navigate('/tickets')
  }

  const weekDelta = data && data.createdLastWeek > 0 ? Math.round(((data.createdThisWeek - data.createdLastWeek) / data.createdLastWeek) * 100) : null

  const tiles = [
    {
      key: 'open',
      title: 'Open now',
      value: data?.counts.open,
      onClick: () => openTickets({ status: ['open'] }),
    },
    {
      key: 'overdue',
      title: 'Overdue',
      value: data?.overdue,
      danger: (data?.overdue ?? 0) > 0,
      onClick: () => openTickets({ overdue: true }),
    },
    {
      key: 'unassigned',
      title: 'Unassigned',
      value: data?.unassigned,
      onClick: () => openTickets({ assigneeId: UNASSIGNED, status: ['open', 'pending'] }),
    },
    {
      key: 'week',
      title: 'Created in the last 7 days',
      value: data?.createdThisWeek,
      suffix:
        weekDelta === null ? null : (
          <span className="text-[12.5px] text-muted">
            {weekDelta > 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />} {Math.abs(weekDelta)}% vs the week before
          </span>
        ),
      onClick: () =>
        openTickets({ createdRange: [dayjs().subtract(6, 'day').format(DAY_FORMAT), dayjs().format(DAY_FORMAT)] }),
    },
  ]

  const columns: TableColumnsType<TicketRow> = [
    {
      key: 'due',
      title: 'Due',
      width: 150,
      render: (_, ticket) => <DueLabel ticket={ticket} />,
    },
    {
      key: 'ticket',
      title: 'Ticket',
      render: (_, ticket) => (
        <div className="min-w-0">
          <Typography.Text ellipsis className="block max-w-[380px] font-medium">
            {ticket.subject}
          </Typography.Text>
          <Typography.Text type="secondary" className="text-[12.5px]">
            <TicketRef number={ticket.number} /> · {ticket.customer.company}
          </Typography.Text>
        </div>
      ),
    },
    {
      key: 'priority',
      title: 'Priority',
      width: 104,
      responsive: ['md'],
      render: (_, ticket) => <PriorityTag priority={ticket.priority} />,
    },
    {
      key: 'assignee',
      title: 'Assignee',
      width: 72,
      align: 'center',
      responsive: ['md'],
      render: (_, ticket) =>
        ticket.assignee ? (
          <UserAvatar name={ticket.assignee.name} color={ticket.assignee.avatarColor} size={26} />
        ) : (
          <Typography.Text type="secondary">None</Typography.Text>
        ),
    },
  ]

  const total = TICKET_STATUSES.reduce((sum, status) => sum + (data?.counts[status] ?? 0), 0)

  return (
    <>
      <PageHeader
        title={`${greeting()}, ${user?.name.split(' ')[0] ?? 'there'}`}
        description={dayjs().format('dddd D MMMM')}
      />

      {isError && <QueryError title="Could not load the overview" error={error} onRetry={() => void refetch()} />}

      <Card className="mb-4" classNames={{ body: 'p-0' }}>
        <div className="grid grid-cols-2 min-[992px]:grid-cols-4">
          {tiles.map((tile) => (
            <button key={tile.key} type="button" className={TILE} onClick={tile.onClick}>
              <Statistic
                title={tile.title}
                value={tile.value}
                loading={isLoading}
                classNames={{ content: `text-[30px] font-semibold ${tile.danger ? 'text-[#cf1322]' : ''}` }}
              />
              {tile.suffix}
            </button>
          ))}
        </div>
      </Card>

      <Flex gap={16} wrap align="flex-start">
        <Card
          className="min-w-0 flex-[3_1_560px]"
          title="Next due"
          extra={<Typography.Text type="secondary">Overdue first. Click a row to open it in Tickets.</Typography.Text>}
          classNames={{ body: 'p-0' }}
        >
          <Table<TicketRow>
            rowKey="id"
            size="middle"
            columns={columns}
            dataSource={data?.dueNext}
            loading={isLoading}
            pagination={false}
            rowClassName={(ticket) => `cursor-pointer ${PRIORITY_STRIPE[ticket.priority]}`}
            onRow={(ticket) => ({
              onClick: () => openTickets({ q: ref(ticket.number) }),
              onKeyDown: (event) => event.key === 'Enter' && openTickets({ q: ref(ticket.number) }),
              tabIndex: 0,
            })}
            locale={{ emptyText: 'Nothing is waiting on a deadline. Nice.' }}
          />
        </Card>

        <Card className="min-w-0 flex-[1_1_260px]" title="Queue by status">
          <Flex vertical gap={18}>
            {TICKET_STATUSES.map((status) => (
              <div key={status}>
                <Flex justify="space-between">
                  <Typography.Text>{STATUS_LABEL[status]}</Typography.Text>
                  <Typography.Text strong>{data?.counts[status] ?? '–'}</Typography.Text>
                </Flex>
                <Progress
                  percent={total ? ((data?.counts[status] ?? 0) / total) * 100 : 0}
                  showInfo={false}
                  strokeColor={STATUS_STROKE[status]}
                  size="small"
                  aria-label={`${STATUS_LABEL[status]} tickets`}
                />
              </div>
            ))}
          </Flex>
        </Card>
      </Flex>
    </>
  )
}
