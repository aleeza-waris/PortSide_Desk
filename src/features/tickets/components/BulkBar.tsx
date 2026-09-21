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
  const selectedTicketIds = useAppSelector(selectSelectedTicketIds)
  const bulkTicketMutation = useBulkTickets()

  if (selectedTicketIds.length === 0) return null

  const clearSelection = () => dispatch(selectionCleared())

  const runBulkAction = (action: BulkTicketAction) => {
    bulkTicketMutation.mutate(action, { onSuccess: clearSelection })
  }

  const isMarkingResolved =
    bulkTicketMutation.isPending && bulkTicketMutation.variables?.action === 'setStatus'
  const isDeleting = bulkTicketMutation.isPending && bulkTicketMutation.variables?.action === 'delete'
  const selectedTicketLabel = pluralize(selectedTicketIds.length, 'ticket')

  return (
    <Flex className="mb-3 rounded-md border border-brand-line bg-brand-bg px-3.5 py-2.5" align="center" gap={12} wrap role="region" aria-label="Bulk actions">
      <Typography.Text strong>{selectedTicketLabel} selected</Typography.Text>
      <Button
        icon={<CheckOutlined />}
        loading={isMarkingResolved}
        onClick={() => runBulkAction({ action: 'setStatus', ids: selectedTicketIds, status: 'resolved' })}
      >
        Mark resolved
      </Button>
      <Popconfirm
        title={`Delete ${selectedTicketLabel}?`}
        description="They are removed for everyone. This cannot be undone."
        okText={selectedTicketIds.length === 1 ? 'Delete ticket' : 'Delete tickets'}
        okButtonProps={{ danger: true }}
        cancelText="Keep them"
        onConfirm={() => runBulkAction({ action: 'delete', ids: selectedTicketIds })}
      >
        <Button danger icon={<DeleteOutlined />} loading={isDeleting}>
          Delete
        </Button>
      </Popconfirm>
      <Button type="link" onClick={clearSelection}>
        Clear selection
      </Button>
    </Flex>
  )
}
