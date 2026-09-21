import { PlusOutlined } from '@ant-design/icons'
import { Button, Card } from 'antd'
import { useState } from 'react'
import { PageHeader } from '@/shared/components/PageHeader'
import { BulkBar } from './components/BulkBar'
import { TicketDrawer } from './components/TicketDrawer'
import { TicketFilters } from './components/TicketFilters'
import { TicketTable } from './components/TicketTable'
import type { TicketRow } from './types'

export function TicketsPage() {
  const [drawer, setDrawer] = useState<{ open: boolean; ticket: TicketRow | null }>({ open: false, ticket: null })

  const openCreate = () => setDrawer({ open: true, ticket: null })
  const openEdit = (ticket: TicketRow) => setDrawer({ open: true, ticket })
  // Keep `ticket` while closing so the drawer does not change its title mid-animation.
  const close = () => setDrawer((current) => ({ ...current, open: false }))

  return (
    <>
      <PageHeader
        title="Tickets"
        description="Everything customers have asked us for."
        actions={
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            New ticket
          </Button>
        }
      />
      <Card classNames={{ body: 'p-3 sm:p-6' }}>
        <TicketFilters />
        <BulkBar />
        <TicketTable onEdit={openEdit} onCreate={openCreate} />
      </Card>
      <TicketDrawer open={drawer.open} ticket={drawer.ticket} onClose={close} />
    </>
  )
}
