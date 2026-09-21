import { CheckOutlined, DeleteOutlined } from '@ant-design/icons'
import { Button, Flex, Popconfirm, Typography } from 'antd'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { pluralize } from '@/shared/lib/format'
import { useBulkTickets } from '../api'
import type { BulkTicketAction } from '../types'
import { selectionCleared, selectSelectedTicketIds } from '../ticketsSlice'

/** Appears when rows are selected. The selection lives in Redux, so it survives paging. */
export function BulkBar() {
  const dispatch = useAppDispatch()
  const ids = useAppSelector(selectSelectedTicketIds)
  const bulk = useBulkTickets()

  if (ids.length === 0) return null

  const run = (payload: BulkTicketAction) =>
    bulk.mutate(payload, { onSuccess: () => dispatch(selectionCleared()) })

  return (
    <Flex className="mb-3 rounded-md border border-brand-line bg-brand-bg px-3.5 py-2.5" align="center" gap={12} wrap role="region" aria-label="Bulk actions">
      <Typography.Text strong>{pluralize(ids.length, 'ticket')} selected</Typography.Text>
      <Button
        icon={<CheckOutlined />}
        loading={bulk.isPending && bulk.variables?.action === 'setStatus'}
        onClick={() => run({ action: 'setStatus', ids, status: 'resolved' })}
      >
        Mark resolved
      </Button>
      <Popconfirm
        title={`Delete ${pluralize(ids.length, 'ticket')}?`}
        description="They are removed for everyone. This cannot be undone."
        okText={ids.length === 1 ? 'Delete ticket' : 'Delete tickets'}
        okButtonProps={{ danger: true }}
        cancelText="Keep them"
        onConfirm={() => run({ action: 'delete', ids })}
      >
        <Button danger icon={<DeleteOutlined />} loading={bulk.isPending && bulk.variables?.action === 'delete'}>
          Delete
        </Button>
      </Popconfirm>
      <Button type="link" onClick={() => dispatch(selectionCleared())}>
        Clear selection
      </Button>
    </Flex>
  )
}
