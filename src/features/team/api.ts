import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNotify } from '@/shared/hooks/useNotify'
import { http } from '@/shared/lib/http'
import { ROOT } from '@/shared/lib/queryKeys'
import type { Agent, AgentRow } from './types'

export const agentKeys = { all: [ROOT.agents] as const }

export const useAgents = () =>
  useQuery({ queryKey: agentKeys.all, queryFn: ({ signal }) => http.get<AgentRow[]>('/agents', { signal }), staleTime: 60_000 })

export function useSetAvailability() {
  const queryClient = useQueryClient()
  const notify = useNotify()
  return useMutation({
    mutationFn: ({ agent, available }: { agent: Agent; available: boolean }) =>
      http.patch<Agent>(`/agents/${agent.id}`, { available }),
    onSuccess: (agent) => {
      notify.success(agent.available ? 'Marked available' : 'Marked away', `${agent.name} is now ${agent.available ? 'available for new tickets' : 'away'}.`)
      return queryClient.invalidateQueries({ queryKey: agentKeys.all })
    },
    onError: (error) => notify.error(error, 'Could not update availability'),
  })
}
