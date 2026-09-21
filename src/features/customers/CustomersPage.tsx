import { PlusOutlined, SearchOutlined } from '@ant-design/icons'
import { Button, Card, Flex, Input } from 'antd'
import { useState } from 'react'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { PageHeader } from '@/shared/components/PageHeader'
import { useDebouncedInput } from '@/shared/hooks/useDebounce'
import { CustomerModal } from './components/CustomerModal'
import { CustomerTable } from './components/CustomerTable'
import { filtersCleared, searchChanged, selectCustomerParams } from './customersSlice'
import type { CustomerRow } from './types'

export function Component() {
  const dispatch = useAppDispatch()
  const params = useAppSelector(selectCustomerParams)
  const [text, setText] = useDebouncedInput(params.q, (q) => dispatch(searchChanged(q)))
  const [modal, setModal] = useState<{ open: boolean; customer: CustomerRow | null }>({ open: false, customer: null })
  const hasFilters = Boolean(params.q || params.plan.length || params.status.length)

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
      <Card>
        <Flex gap={12} wrap align="center" className="mb-4">
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder="Search company, contact, email or country"
            aria-label="Search customers"
            value={text}
            onChange={(event) => setText(event.target.value)}
            className="max-w-[380px] flex-[1_1_260px]"
          />
          {hasFilters && (
            <Button type="link" onClick={() => dispatch(filtersCleared())}>
              Clear filters
            </Button>
          )}
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
