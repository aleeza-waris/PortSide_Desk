import { Button, Checkbox, DatePicker, Flex, Input, Select, Tag } from 'antd'
import type { Dayjs } from 'dayjs'
import { useMemo } from 'react'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { AgentSelect } from '@/features/team'
import { useDebouncedInput } from '@/shared/hooks/useDebounce'
import dayjs from '@/shared/lib/dayjs'
import { DAY_FORMAT } from '@/shared/lib/format'
import { filtersChanged, filtersCleared, selectTicketCustomerLabel, selectTicketParams } from '../ticketsSlice'
import { PRIORITY_LABEL, STATUS_LABEL, TICKET_PRIORITIES, TICKET_STATUSES } from '../types'

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

  return (
    <div className="mb-4">
      <Flex gap={12} wrap align="center">
        <Input.Search
          allowClear
          className="min-w-[200px] max-w-[380px] flex-[1_1_200px]"
          placeholder="Search tickets"
          aria-label="Filter tickets by text"
          value={text}
          onChange={(event) => setText(event.target.value)}
          onSearch={(value) => dispatch(filtersChanged({ q: value.trim() }))}
        />
        <Select
          mode="multiple"
          allowClear
          className="w-[150px]"
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
          className="w-[150px]"
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
          className="w-[150px]"
          placeholder="Assignee"
          aria-label="Filter by assignee"
          value={params.assigneeId ?? undefined}
          onChange={(assigneeId) => dispatch(filtersChanged({ assigneeId: assigneeId ?? null }))}
        />
        <DatePicker.RangePicker
          allowClear
          className="w-[250px] max-w-full"
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
        <Checkbox checked={params.overdue} onChange={(event) => dispatch(filtersChanged({ overdue: event.target.checked }))}>
          Overdue only
        </Checkbox>
        {hasFilters && (
          <Button type="link" onClick={() => dispatch(filtersCleared())}>
            Clear filters
          </Button>
        )}
      </Flex>

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
