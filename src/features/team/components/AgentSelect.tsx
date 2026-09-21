import { Select, type SelectProps } from 'antd'
import { UNASSIGNED } from '@/features/tickets/types'
import { UserAvatar } from '@/shared/components/UserAvatar'
import { useAgents } from '../api'

interface AgentSelectProps extends Omit<SelectProps<string>, 'options' | 'loading'> {
  /** Adds an "Unassigned" choice (value `unassigned`) for filters. */
  includeUnassigned?: boolean
}

export function AgentSelect({ includeUnassigned = false, ...props }: AgentSelectProps) {
  const { data: agents, isLoading } = useAgents()

  const options = [
    ...(includeUnassigned ? [{ value: UNASSIGNED, label: 'Unassigned' }] : []),
    ...(agents ?? []).map((agent) => ({
      value: agent.id,
      label: (
        <span className="inline-flex items-center gap-2">
          <UserAvatar name={agent.name} color={agent.avatarColor} size={20} />
          {agent.name}
        </span>
      ),
      // Plain text for the type-to-filter search.
      search: agent.name,
    })),
  ]

  return (
    <Select<string>
      showSearch={{ optionFilterProp: 'search', filterOption: (input, option) => `${option?.search ?? option?.label ?? ''}`.toLowerCase().includes(input.toLowerCase()) }}
      loading={isLoading}
      options={options}
      {...props}
    />
  )
}
