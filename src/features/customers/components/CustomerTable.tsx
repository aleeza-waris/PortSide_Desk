import { EditOutlined } from '@ant-design/icons'
import { Button, Empty, Flex, Pagination, Table, Tooltip, Typography, type TableColumnsType, type TableProps } from 'antd'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { filtersReplaced } from '@/features/tickets/ticketsSlice'
import { ActionLink } from '@/shared/components/ActionLink'
import { QueryError } from '@/shared/components/QueryError'
import { RowDeleteButton } from '@/shared/components/RowDeleteButton'
import { formatDate, formatUsd } from '@/shared/lib/format'
import { useCustomers, useDeleteCustomer } from '../api'
import { filtersCleared, selectCustomerParams, tableChanged } from '../customersSlice'
import {
  CUSTOMER_PLANS,
  CUSTOMER_STATUSES,
  CUSTOMER_STATUS_LABEL,
  PLAN_LABEL,
  type CustomerPlan,
  type CustomerRow,
  type CustomerSortField,
  type CustomerStatus,
} from '../types'
import { CustomerStatusBadge, PlanTag } from './CustomerTags'

interface CustomerTableProps {
  onEdit: (customer: CustomerRow) => void
  onCreate: () => void
}

export function CustomerTable({ onEdit, onCreate }: CustomerTableProps) {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const params = useAppSelector(selectCustomerParams)
  const { data, isFetching, isError, error, refetch } = useCustomers(params)
  const remove = useDeleteCustomer()
  const hasFilters = Boolean(params.q || params.plan.length || params.status.length)

  const sortOrder = (field: CustomerSortField) => (params.sortField === field ? params.sortOrder : null)

  /** Jump to the Tickets page showing this customer's open work. Redux carries the filter across. */
  const viewTickets = (customer: CustomerRow) => {
    dispatch(
      filtersReplaced({ customerId: customer.id, customerLabel: customer.company, status: ['open', 'pending'] }),
    )
    navigate('/tickets')
  }

  const columns: TableColumnsType<CustomerRow> = [
    {
      key: 'company',
      title: 'Company',
      sorter: true,
      sortOrder: sortOrder('company'),
      width: 250,
      render: (_, customer) => (
        <div className="min-w-0">
          <ActionLink onActivate={() => onEdit(customer)} className="font-medium">
            {customer.company}
          </ActionLink>
          <div>
            <Typography.Text type="secondary" className="text-[12.5px]">
              {customer.name} · {customer.country}
            </Typography.Text>
          </div>
        </div>
      ),
    },
    {
      key: 'plan',
      title: 'Plan',
      sorter: true,
      sortOrder: sortOrder('plan'),
      // Native column filter menu, controlled by Redux.
      filters: CUSTOMER_PLANS.map((value) => ({ text: PLAN_LABEL[value], value })),
      filteredValue: params.plan,
      width: 120,
      render: (_, customer) => <PlanTag plan={customer.plan} />,
    },
    {
      key: 'status',
      title: 'Status',
      sorter: true,
      sortOrder: sortOrder('status'),
      filters: CUSTOMER_STATUSES.map((value) => ({ text: CUSTOMER_STATUS_LABEL[value], value })),
      filteredValue: params.status,
      width: 140,
      render: (_, customer) => <CustomerStatusBadge status={customer.status} />,
    },
    {
      key: 'shipmentsPerMonth',
      title: 'Shipments / month',
      align: 'right',
      sorter: true,
      sortOrder: sortOrder('shipmentsPerMonth'),
      width: 160,
      responsive: ['lg'],
      render: (_, customer) => customer.shipmentsPerMonth.toLocaleString('en-US'),
    },
    {
      key: 'mrr',
      title: 'Monthly revenue',
      align: 'right',
      sorter: true,
      sortOrder: sortOrder('mrr'),
      width: 160,
      render: (_, customer) => (customer.mrr ? formatUsd(customer.mrr) : <Typography.Text type="secondary">Not billing yet</Typography.Text>),
    },
    {
      key: 'openTickets',
      title: 'Open tickets',
      align: 'right',
      sorter: true,
      sortOrder: sortOrder('openTickets'),
      width: 130,
      render: (_, customer) =>
        customer.openTickets > 0 ? (
          <Tooltip title="See these tickets">
            <Button type="link" size="small" onClick={() => viewTickets(customer)} aria-label={`${customer.openTickets} open tickets for ${customer.company}`}>
              {customer.openTickets}
            </Button>
          </Tooltip>
        ) : (
          <Typography.Text type="secondary">0</Typography.Text>
        ),
    },
    {
      key: 'createdAt',
      title: 'Customer since',
      sorter: true,
      sortOrder: sortOrder('createdAt'),
      width: 150,
      responsive: ['xxl'],
      render: (_, customer) => <Typography.Text type="secondary">{formatDate(customer.createdAt)}</Typography.Text>,
    },
    {
      key: 'actions',
      title: <span className="sr-only">Actions</span>,
      fixed: 'right',
      align: 'right',
      width: 96,
      render: (_, customer) => (
        <Flex gap={4} justify="flex-end">
          <Tooltip title="Edit customer">
            <Button type="text" icon={<EditOutlined />} aria-label={`Edit ${customer.company}`} onClick={() => onEdit(customer)} />
          </Tooltip>
          <RowDeleteButton
            label={`Delete ${customer.company}`}
            title={`Delete ${customer.company}?`}
            description="Their finished tickets are deleted too. Customers with open tickets cannot be deleted."
            okText="Delete customer"
            cancelText="Keep customer"
            loading={remove.isPending && remove.variables?.id === customer.id}
            onConfirm={() => remove.mutateAsync(customer).catch(() => undefined)}
          />
        </Flex>
      ),
    },
  ]

  const handleChange: TableProps<CustomerRow>['onChange'] = (pagination, filters, sorter) => {
    const active = Array.isArray(sorter) ? sorter[0] : sorter
    dispatch(
      tableChanged({
        page: pagination.current ?? 1,
        pageSize: pagination.pageSize ?? params.pageSize,
        sortField: active?.order ? (active.columnKey as CustomerSortField) : null,
        sortOrder: active?.order ?? null,
        plan: (filters.plan ?? []) as CustomerPlan[],
        status: (filters.status ?? []) as CustomerStatus[],
      }),
    )
  }

  return (
    <>
      {isError && <QueryError title="Could not load customers" error={error} onRetry={() => void refetch()} />}
      <div className="hidden md:block">
        <Table<CustomerRow>
          rowKey="id"
          size="middle"
          columns={columns}
          dataSource={data?.items}
          loading={isFetching}
          scroll={{ x: 'max-content' }}
          sortDirections={['ascend', 'descend']}
          showSorterTooltip={false}
          pagination={{
            current: params.page,
            pageSize: params.pageSize,
            total: data?.total ?? 0,
            showSizeChanger: true,
            pageSizeOptions: [10, 20, 50],
            showTotal: (total, [from, to]) => `${from}–${to} of ${total} customers`,
            responsive: true,
          }}
          onChange={handleChange}
          locale={{ emptyText: isFetching ? null : <CustomerEmptyState hasFilters={hasFilters} onCreate={onCreate} onClear={() => dispatch(filtersCleared())} /> }}
        />
      </div>

      <div className="md:hidden">
        {isFetching ? (
          <Typography.Text type="secondary" className="block px-4 py-6 text-center">Loading customers...</Typography.Text>
        ) : data?.items.length ? (
          <div className="grid min-w-0 gap-2">
            {data.items.map((customer) => (
              <article key={customer.id} className="box-border min-w-0 max-w-full rounded-md border border-line p-3">
                <div className="min-w-0">
                  <ActionLink onActivate={() => onEdit(customer)} className="block truncate font-medium" title={customer.company}>
                    {customer.company}
                  </ActionLink>
                  <Typography.Text type="secondary" className="text-[12.5px]">
                    {customer.name} <span aria-hidden>·</span> {customer.country}
                  </Typography.Text>
                  <Flex gap={6} wrap align="center" className="mt-2">
                    <PlanTag plan={customer.plan} />
                    <CustomerStatusBadge status={customer.status} />
                    {customer.openTickets > 0 ? (
                      <Button type="link" size="small" className="ms-auto p-0" onClick={() => viewTickets(customer)}>
                        {customer.openTickets} open tickets
                      </Button>
                    ) : (
                      <Typography.Text type="secondary" className="ms-auto text-[12.5px]">0 open tickets</Typography.Text>
                    )}
                  </Flex>
                </div>
                <Flex justify="flex-end" gap={4} wrap className="mt-3 border-t border-line pe-2 pt-2">
                  <Button type="text" icon={<EditOutlined />} onClick={() => onEdit(customer)} className="shrink-0">Edit</Button>
                  <RowDeleteButton
                    label={`Delete ${customer.company}`}
                    title={`Delete ${customer.company}?`}
                    description="Their finished tickets are deleted too. Customers with open tickets cannot be deleted."
                    okText="Delete customer"
                    cancelText="Keep customer"
                    loading={remove.isPending && remove.variables?.id === customer.id}
                    className="shrink-0"
                    onConfirm={() => remove.mutateAsync(customer).catch(() => undefined)}
                  />
                </Flex>
              </article>
            ))}
          </div>
        ) : (
          <CustomerEmptyState hasFilters={hasFilters} onCreate={onCreate} onClear={() => dispatch(filtersCleared())} />
        )}
        <Pagination
          className="mt-4 text-center"
          current={params.page}
          pageSize={params.pageSize}
          total={data?.total ?? 0}
          showSizeChanger={false}
          onChange={(page, pageSize) => dispatch(tableChanged({ ...params, page, pageSize }))}
        />
      </div>
    </>
  )
}

function CustomerEmptyState({ hasFilters, onCreate, onClear }: { hasFilters: boolean; onCreate: () => void; onClear: () => void }) {
  return (
    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={hasFilters ? 'No customers match these filters.' : 'No customers yet.'}>
      {hasFilters ? <Button onClick={onClear}>Clear filters</Button> : <Button type="primary" onClick={onCreate}>New customer</Button>}
    </Empty>
  )
}
