import { PlusOutlined, SearchOutlined } from '@ant-design/icons'
import { Button, Card, Flex, Input, Select } from 'antd'
import { useState } from 'react'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { PageHeader } from '@/shared/components/PageHeader'
import { useDebouncedInput } from '@/shared/hooks/useDebounce'
import { CustomerModal } from './components/CustomerModal'
import { CustomerTable } from './components/CustomerTable'
import { filtersCleared, searchChanged, selectCustomerParams, tableChanged } from './customersSlice'
import { CUSTOMER_PLANS, CUSTOMER_STATUSES, CUSTOMER_STATUS_LABEL, PLAN_LABEL, type CustomerPlan, type CustomerRow, type CustomerSortField, type CustomerStatus } from './types'

export function CustomersPage() {
  const dispatch = useAppDispatch()
  const params = useAppSelector(selectCustomerParams)
  const [text, setText] = useDebouncedInput(params.q, (q) => dispatch(searchChanged(q)))
  const [modal, setModal] = useState<{ open: boolean; customer: CustomerRow | null }>({ open: false, customer: null })
  const hasFilters = Boolean(params.q || params.plan.length || params.status.length)
  const sortValue = `${params.sortField ?? 'company'}:${params.sortOrder ?? 'ascend'}`

  return (
    <>
      <PageHeader
        title="Customers"
        description="The importers and exporters we move freight for."
        actions={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setModal({ open: true, customer: null })}>
            New customer
          </Button>
        }
      />
      <Card classNames={{ body: 'p-3 sm:p-6' }}>
        <Flex gap={8} wrap align="center" className="mb-4">
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder="Search company, contact, email or country"
            aria-label="Search customers"
            value={text}
            onChange={(event) => setText(event.target.value)}
            className="w-full max-w-[380px] flex-[1_1_260px] sm:w-auto"
          />
          {hasFilters && (
            <Button type="link" onClick={() => dispatch(filtersCleared())}>
              Clear filters
            </Button>
          )}
        </Flex>
        <Flex gap={8} wrap className="mb-4 md:hidden">
          <Select
            mode="multiple"
            allowClear
            className="min-w-0 flex-1"
            placeholder="Plan"
            value={params.plan}
            onChange={(plan) => dispatch(tableChanged({ ...params, plan: plan as CustomerPlan[] }))}
            options={CUSTOMER_PLANS.map((value) => ({ value, label: PLAN_LABEL[value] }))}
          />
          <Select
            mode="multiple"
            allowClear
            className="min-w-0 flex-1"
            placeholder="Status"
            value={params.status}
            onChange={(status) => dispatch(tableChanged({ ...params, status: status as CustomerStatus[] }))}
            options={CUSTOMER_STATUSES.map((value) => ({ value, label: CUSTOMER_STATUS_LABEL[value] }))}
          />
          <Select
            className="w-full"
            aria-label="Sort customers"
            value={sortValue}
            onChange={(value) => {
              const [sortField, sortOrder] = value.split(':') as [CustomerSortField, 'ascend' | 'descend']
              dispatch(tableChanged({ ...params, sortField, sortOrder }))
            }}
            options={[
              { value: 'company:ascend', label: 'Company A-Z' },
              { value: 'company:descend', label: 'Company Z-A' },
              { value: 'openTickets:descend', label: 'Most open tickets' },
              { value: 'mrr:descend', label: 'Highest revenue' },
            ]}
          />
        </Flex>
        <CustomerTable
          onEdit={(customer) => setModal({ open: true, customer })}
          onCreate={() => setModal({ open: true, customer: null })}
        />
      </Card>
      <CustomerModal
        open={modal.open}
        customer={modal.customer}
        onClose={() => setModal((current) => ({ ...current, open: false }))}
      />
    </>
  )
}
