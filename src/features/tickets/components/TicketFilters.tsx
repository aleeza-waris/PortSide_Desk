import { Button, Checkbox, DatePicker, Flex, Input, Select, Tag } from 'antd'
import type { Dayjs } from 'dayjs'
import { useMemo } from 'react'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { AgentSelect } from '@/features/team'
import { useDebouncedInput } from '@/shared/hooks/useDebounce'
import dayjs from '@/shared/lib/dayjs'
import { DAY_FORMAT } from '@/shared/lib/format'
import { filtersChanged, filtersCleared, selectTicketCustomerLabel, selectTicketParams, tableChanged } from '../ticketsSlice'
import { PRIORITY_LABEL, STATUS_LABEL, TICKET_PRIORITIES, TICKET_STATUSES, type TicketSortField } from '../types'

const buildPresets = () => [
  { label: 'Today', value: [dayjs().startOf('day'), dayjs().endOf('day')] as [Dayjs, Dayjs] },
  { label: 'Last 7 days', value: [dayjs().subtract(6, 'day').startOf('day'), dayjs().endOf('day')] as [Dayjs, Dayjs] },
  { label: 'Last 30 days', value: [dayjs().subtract(29, 'day').startOf('day'), dayjs().endOf('day')] as [Dayjs, Dayjs] },
]

export function useHasActiveTicketFilters() {
  const p = useAppSelector(selectTicketParams)
  return Boolean(p.q || p.status.length || p.priority.length || p.assigneeId || p.customerId || p.createdRange || p.overdue)
}

export function TicketFilters() {
  const dispatch = useAppDispatch()
  const params = useAppSelector(selectTicketParams)
  const customerLabel = useAppSelector(selectTicketCustomerLabel)
  const hasFilters = useHasActiveTicketFilters()
  const presets = useMemo(buildPresets, [])
  const [text, setText] = useDebouncedInput(params.q, (q) => dispatch(filtersChanged({ q })))
  const sortValue = `${params.sortField ?? 'createdAt'}:${params.sortOrder ?? 'descend'}`
  const activeFilterCount = [
    params.q,
    params.status.length,
    params.priority.length,
    params.assigneeId,
    params.createdRange,
    params.overdue,
  ].filter(Boolean).length

  const filterControls = (
    <>
      <Input.Search
        allowClear
        className="w-full min-w-0 max-w-[380px] flex-none sm:w-auto sm:flex-[1_1_200px]"
        placeholder="Search tickets"
        aria-label="Filter tickets by text"
        value={text}
        onChange={(event) => setText(event.target.value)}
        onSearch={(value) => dispatch(filtersChanged({ q: value.trim() }))}
      />
      <Select
        mode="multiple"
        allowClear
        className="w-full sm:w-[150px]"
        placeholder="Status"
        aria-label="Filter by status"
        maxTagCount="responsive"
        value={params.status}
        onChange={(status) => dispatch(filtersChanged({ status }))}
        options={TICKET_STATUSES.map((value) => ({ value, label: STATUS_LABEL[value] }))}
      />
      <Select
        mode="multiple"
        allowClear
        className="w-full sm:w-[150px]"
        placeholder="Priority"
        aria-label="Filter by priority"
        maxTagCount="responsive"
        value={params.priority}
        onChange={(priority) => dispatch(filtersChanged({ priority }))}
        options={TICKET_PRIORITIES.map((value) => ({ value, label: PRIORITY_LABEL[value] }))}
      />
      <AgentSelect
        includeUnassigned
        allowClear
        className="w-full sm:w-[150px]"
        placeholder="Assignee"
        aria-label="Filter by assignee"
        value={params.assigneeId ?? undefined}
        onChange={(assigneeId) => dispatch(filtersChanged({ assigneeId: assigneeId ?? null }))}
      />
      <DatePicker.RangePicker
        allowClear
        className="w-full max-w-full sm:w-[250px]"
        presets={presets}
        placeholder={['Created from', 'to']}
        value={params.createdRange ? [dayjs(params.createdRange[0]), dayjs(params.createdRange[1])] : null}
        disabledDate={(day) => day.isAfter(dayjs(), 'day')}
        onChange={(range) =>
          dispatch(
            filtersChanged({
              createdRange: range?.[0] && range[1] ? [range[0].format(DAY_FORMAT), range[1].format(DAY_FORMAT)] : null,
            }),
          )
        }
      />
      <Select
        className="w-full sm:hidden"
        aria-label="Sort tickets"
        value={sortValue}
        onChange={(value) => {
          const [sortField, sortOrder] = value.split(':') as [TicketSortField, 'ascend' | 'descend']
          dispatch(tableChanged({ page: 1, pageSize: params.pageSize, sortField, sortOrder }))
        }}
        options={[
          { value: 'createdAt:descend', label: 'Newest first' },
          { value: 'createdAt:ascend', label: 'Oldest first' },
          { value: 'priority:descend', label: 'Highest priority' },
          { value: 'dueAt:ascend', label: 'Soonest due' },
          { value: 'customer:ascend', label: 'Customer A-Z' },
        ]}
      />
      <Checkbox checked={params.overdue} onChange={(event) => dispatch(filtersChanged({ overdue: event.target.checked }))}>
        Overdue only
      </Checkbox>
      {hasFilters && (
        <Button type="link" onClick={() => dispatch(filtersCleared())}>
          Clear filters
        </Button>
      )}
    </>
  )

  return (
    <div className="mb-4">
      <Flex gap={8} wrap align="center" className="hidden sm:flex">{filterControls}</Flex>
      <details className="sm:hidden">
        <summary className="cursor-pointer select-none rounded-md border border-line px-3 py-2 text-sm font-medium">
          Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
        </summary>
        <Flex gap={8} vertical className="mt-2">{filterControls}</Flex>
      </details>

      {params.customerId && (
        <Flex gap={8} align="center" className="mt-3">
          <Tag closable variant="filled" color="cyan" onClose={() => dispatch(filtersChanged({ customerId: null }))}>
            Customer: {customerLabel ?? params.customerId}
          </Tag>
        </Flex>
      )}
    </div>
  )
}
