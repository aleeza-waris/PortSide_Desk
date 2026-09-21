import { EditOutlined } from '@ant-design/icons'
import { Button, Checkbox, Empty, Flex, Pagination, Table, Tooltip, Typography, type TableColumnsType, type TableProps } from 'antd'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { ActionLink } from '@/shared/components/ActionLink'
import { QueryError } from '@/shared/components/QueryError'
import { RowDeleteButton } from '@/shared/components/RowDeleteButton'
import { UserAvatar } from '@/shared/components/UserAvatar'
import { formatDateTime, fromNow } from '@/shared/lib/format'
import { useDeleteTicket, useTickets } from '../api'
import {
  filtersCleared,
  selectionChanged,
  selectionRemoved,
  selectSelectedTicketIds,
  selectTicketParams,
  tableChanged,
} from '../ticketsSlice'
import { CHANNEL_LABEL, type TicketRow, type TicketSortField } from '../types'
import { DueLabel, PriorityTag, StatusTag, TicketRef } from './TicketTags'
import { useHasActiveTicketFilters } from './TicketFilters'

interface TicketTableProps {
  onEdit: (ticket: TicketRow) => void
  onCreate: () => void
}

export function TicketTable({ onEdit, onCreate }: TicketTableProps) {
  const dispatch = useAppDispatch()
  const params = useAppSelector(selectTicketParams)
  const selectedIds = useAppSelector(selectSelectedTicketIds)
  const hasFilters = useHasActiveTicketFilters()
  const { data, isFetching, isError, error, refetch } = useTickets(params)
  const remove = useDeleteTicket()

  const sortOrder = (field: TicketSortField) => (params.sortField === field ? params.sortOrder : null)

  const columns: TableColumnsType<TicketRow> = [
    {
      key: 'number',
      title: 'Ticket',
      sorter: true,
      sortOrder: sortOrder('number'),
      width: 280,
      render: (_, ticket) => (
        <div className="flex min-w-0 flex-col gap-px">
          <ActionLink onActivate={() => onEdit(ticket)} className="block max-w-[250px] truncate font-medium" title={ticket.subject}>
            {ticket.subject}
          </ActionLink>
          <Typography.Text type="secondary" className="text-[12.5px]">
            <TicketRef number={ticket.number} />
            <span aria-hidden> · </span>
            {CHANNEL_LABEL[ticket.channel]}
          </Typography.Text>
        </div>
      ),
    },
    {
      key: 'customer',
      title: 'Customer',
      sorter: true,
      sortOrder: sortOrder('customer'),
      width: 170,
      render: (_, ticket) => (
        <div className="flex min-w-0 flex-col gap-px">
          <Typography.Text ellipsis>{ticket.customer.company}</Typography.Text>
          <Typography.Text type="secondary" ellipsis className="text-[12.5px]">
            {ticket.customer.name}
          </Typography.Text>
        </div>
      ),
    },
    {
      key: 'status',
      title: 'Status',
      sorter: true,
      sortOrder: sortOrder('status'),
      width: 150,
      render: (_, ticket) => <StatusTag status={ticket.status} />,
    },
    {
      key: 'priority',
      title: 'Priority',
      sorter: true,
      sortOrder: sortOrder('priority'),
      width: 100,
      render: (_, ticket) => <PriorityTag priority={ticket.priority} />,
    },
    {
      key: 'assignee',
      title: 'Assignee',
      sorter: true,
      sortOrder: sortOrder('assignee'),
      width: 160,
      render: (_, ticket) =>
        ticket.assignee ? (
          <Flex align="center" gap={8}>
            <UserAvatar name={ticket.assignee.name} color={ticket.assignee.avatarColor} size={24} />
            <Typography.Text ellipsis>{ticket.assignee.name}</Typography.Text>
          </Flex>
        ) : (
          <Typography.Text type="secondary">Unassigned</Typography.Text>
        ),
    },
    {
      key: 'dueAt',
      title: 'Due',
      sorter: true,
      sortOrder: sortOrder('dueAt'),
      width: 130,
      render: (_, ticket) => <DueLabel ticket={ticket} />,
    },
    {
      key: 'createdAt',
      title: 'Created',
      sorter: true,
      sortOrder: sortOrder('createdAt'),
      width: 130,
      responsive: ['xxl'], // Only on wide screens: tablets and laptops keep the columns that matter.
      render: (_, ticket) => (
        <Tooltip title={formatDateTime(ticket.createdAt)}>
          <Typography.Text type="secondary">{fromNow(ticket.createdAt)}</Typography.Text>
        </Tooltip>
      ),
    },
    {
      key: 'actions',
      title: <span className="sr-only">Actions</span>,
      fixed: 'right',
      align: 'right',
      width: 92,
      render: (_, ticket) => (
        <Flex gap={4} justify="flex-end">
          <Tooltip title="Edit ticket">
            <Button type="text" icon={<EditOutlined />} aria-label={`Edit PS-${ticket.number}`} onClick={() => onEdit(ticket)} />
          </Tooltip>
          <RowDeleteButton
            label={`Delete PS-${ticket.number}`}
            title={`Delete PS-${ticket.number}?`}
            description="The ticket is removed for everyone. This cannot be undone."
            okText="Delete ticket"
            cancelText="Keep ticket"
            loading={remove.isPending && remove.variables?.id === ticket.id}
            onConfirm={() => remove.mutateAsync(ticket).then(() => dispatch(selectionRemoved([ticket.id]))).catch(() => undefined)}
          />
        </Flex>
      ),
    },
  ]

  const handleChange: TableProps<TicketRow>['onChange'] = (pagination, _filters, sorter) => {
    const active = Array.isArray(sorter) ? sorter[0] : sorter
    dispatch(
      tableChanged({
        page: pagination.current ?? 1,
        pageSize: pagination.pageSize ?? params.pageSize,
        sortField: active?.order ? (active.columnKey as TicketSortField) : null,
        sortOrder: active?.order ?? null,
      }),
    )
  }

  return (
    <>
      {isError && <QueryError title="Could not load tickets" error={error} onRetry={() => void refetch()} />}
      <div className="hidden md:block">
        <Table<TicketRow>
          rowKey="id"
          size="middle"
          columns={columns}
          dataSource={data?.items}
          loading={isFetching}
          scroll={{ x: 'max-content' }}
          sortDirections={['ascend', 'descend']}
          showSorterTooltip={false}
          rowSelection={{
            selectedRowKeys: selectedIds,
            preserveSelectedRowKeys: true,
            onChange: (keys) => dispatch(selectionChanged(keys as string[])),
          }}
          pagination={{
            current: params.page,
            pageSize: params.pageSize,
            total: data?.total ?? 0,
            showSizeChanger: true,
            pageSizeOptions: [10, 20, 50],
            showTotal: (total, [from, to]) => `${from}–${to} of ${total} tickets`,
            responsive: true,
          }}
          onChange={handleChange}
          locale={{ emptyText: isFetching ? null : <TicketEmptyState hasFilters={hasFilters} onCreate={onCreate} onClear={() => dispatch(filtersCleared())} /> }}
        />
      </div>

      <div className="md:hidden">
        {isFetching ? (
          <Typography.Text type="secondary" className="block px-4 py-6 text-center">Loading tickets...</Typography.Text>
        ) : data?.items.length ? (
          <div className="grid min-w-0 gap-2">
            {data.items.map((ticket) => (
              <article key={ticket.id} className="box-border min-w-0 max-w-full rounded-md border border-line p-3">
                <div className="flex gap-3">
                  <Checkbox
                    checked={selectedIds.includes(ticket.id)}
                    aria-label={`Select ${ticket.number}`}
                    onChange={(event) => {
                      const nextIds = event.target.checked
                        ? [...selectedIds, ticket.id]
                        : selectedIds.filter((id) => id !== ticket.id)
                      dispatch(selectionChanged(nextIds))
                    }}
                  />
                  <div className="min-w-0 flex-1">
                    <ActionLink onActivate={() => onEdit(ticket)} className="block whitespace-normal break-words font-medium" title={ticket.subject}>
                      {ticket.subject}
                    </ActionLink>
                    <Typography.Text type="secondary" className="text-[12.5px]">
                      <TicketRef number={ticket.number} /> <span aria-hidden>·</span> {ticket.customer.company}
                    </Typography.Text>
                    <Flex gap={6} wrap className="mt-2">
                      <StatusTag status={ticket.status} />
                      <PriorityTag priority={ticket.priority} />
                      <DueLabel ticket={ticket} />
                    </Flex>
                  </div>
                </div>
                <Flex justify="flex-end" gap={4} wrap className="mt-3 border-t border-line pe-2 pt-2">
                  <Button type="text" icon={<EditOutlined />} aria-label={`Edit PS-${ticket.number}`} onClick={() => onEdit(ticket)} className="shrink-0">Edit</Button>
                  <RowDeleteButton
                    label={`Delete PS-${ticket.number}`}
                    title={`Delete PS-${ticket.number}?`}
                    description="The ticket is removed for everyone. This cannot be undone."
                    okText="Delete ticket"
                    cancelText="Keep ticket"
                    loading={remove.isPending && remove.variables?.id === ticket.id}
                    className="shrink-0"
                    onConfirm={() => remove.mutateAsync(ticket).then(() => dispatch(selectionRemoved([ticket.id]))).catch(() => undefined)}
                  />
                </Flex>
              </article>
            ))}
          </div>
        ) : (
          <TicketEmptyState hasFilters={hasFilters} onCreate={onCreate} onClear={() => dispatch(filtersCleared())} />
        )}
        <Pagination
          className="mt-4 text-center"
          current={params.page}
          pageSize={params.pageSize}
          total={data?.total ?? 0}
          showSizeChanger={false}
          onChange={(page, pageSize) => dispatch(tableChanged({ page, pageSize, sortField: params.sortField, sortOrder: params.sortOrder }))}
        />
      </div>
    </>
  )
}

function TicketEmptyState({ hasFilters, onCreate, onClear }: { hasFilters: boolean; onCreate: () => void; onClear: () => void }) {
  return (
    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={hasFilters ? 'No tickets match these filters.' : 'No tickets yet.'}>
      {hasFilters ? <Button onClick={onClear}>Clear filters</Button> : <Button type="primary" onClick={onCreate}>New ticket</Button>}
    </Empty>
  )
}
