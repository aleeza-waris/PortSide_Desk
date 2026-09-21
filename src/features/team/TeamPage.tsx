import { Card, Flex, Progress, Rate, Switch, Table, Tag, Typography, type TableColumnsType } from 'antd'
import { PageHeader } from '@/shared/components/PageHeader'
import { QueryError } from '@/shared/components/QueryError'
import { UserAvatar } from '@/shared/components/UserAvatar'
import { useAgents, useSetAvailability } from './api'
import type { AgentRow } from './types'

/** Open tickets one person can carry before the bar turns red. */
const CAPACITY = 12

export function Component() {
  const { data, isLoading, isError, error, refetch } = useAgents()
  const setAvailability = useSetAvailability()

  const columns: TableColumnsType<AgentRow> = [
    {
      key: 'name',
      title: 'Agent',
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (_, agent) => (
        <Flex align="center" gap={12}>
          <UserAvatar name={agent.name} color={agent.avatarColor} size={36} />
          <div className="min-w-0">
            <Typography.Text strong>{agent.name}</Typography.Text>
            <div>
              <Typography.Text type="secondary" className="text-[12.5px]">{agent.email}</Typography.Text>
            </div>
          </div>
        </Flex>
      ),
    },
    {
      key: 'role',
      title: 'Role',
      width: 110,
      responsive: ['md'],
      render: (_, agent) => <Tag variant="filled" color={agent.role === 'admin' ? 'purple' : 'default'}>{agent.role === 'admin' ? 'Admin' : 'Agent'}</Tag>,
    },
    {
      key: 'openTickets',
      title: 'Workload',
      width: 240,
      sorter: (a, b) => a.openTickets - b.openTickets,
      render: (_, agent) => (
        <Flex align="center" gap={12}>
          <Progress
            percent={Math.min(100, Math.round((agent.openTickets / CAPACITY) * 100))}
            showInfo={false}
            size="small"
            status={agent.openTickets >= CAPACITY ? 'exception' : 'normal'}
            className="m-0 min-w-20 flex-1"
            aria-label={`${agent.openTickets} of ${CAPACITY} open tickets`}
          />
          <Typography.Text className="w-16 text-right">{agent.openTickets} open</Typography.Text>
        </Flex>
      ),
    },
    {
      key: 'resolvedThisWeek',
      title: 'Resolved this week',
      align: 'right',
      width: 190,
      responsive: ['lg'],
      sorter: (a, b) => a.resolvedThisWeek - b.resolvedThisWeek,
      render: (_, agent) => agent.resolvedThisWeek,
    },
    {
      key: 'csat',
      title: 'Customer rating',
      width: 200,
      responsive: ['lg'],
      sorter: (a, b) => a.csat - b.csat,
      render: (_, agent) =>
        agent.csat > 0 ? (
          <Flex align="center" gap={8}>
            <Rate disabled allowHalf value={Math.round(agent.csat * 2) / 2} className="text-sm" />
            <Typography.Text type="secondary">{agent.csat.toFixed(1)}</Typography.Text>
          </Flex>
        ) : (
          <Typography.Text type="secondary">No ratings yet</Typography.Text>
        ),
    },
    {
      key: 'available',
      title: 'Available',
      align: 'right',
      width: 110,
      render: (_, agent) => (
        <Switch
          checked={agent.available}
          loading={setAvailability.isPending && setAvailability.variables?.agent.id === agent.id}
          onChange={(available) => setAvailability.mutate({ agent, available })}
          aria-label={`${agent.name} is available`}
        />
      ),
    },
  ]

  return (
    <>
      <PageHeader title="Team" description="Who is on the desk, and how much each person is carrying." />
      {isError && <QueryError title="Could not load the team" error={error} onRetry={() => void refetch()} />}
      <Card classNames={{ body: 'p-0' }}>
        <Table<AgentRow>
          rowKey="id"
          columns={columns}
          dataSource={data}
          loading={isLoading}
          pagination={false}
          scroll={{ x: 'max-content' }}
        />
      </Card>
    </>
  )
}
