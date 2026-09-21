import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNotify } from '@/shared/hooks/useNotify'
import { http } from '@/shared/lib/http'
import { invalidateTicketData, ROOT } from '@/shared/lib/queryKeys'
import type { Paged } from '@/shared/types'
import { ref, type BulkTicketAction, type TicketInput, type TicketListParams, type TicketRow } from './types'

export const ticketKeys = {
  all: [ROOT.tickets] as const,
  list: (params: TicketListParams) => [ROOT.tickets, 'list', params] as const,
}

/** Redux holds a friendly shape (a date range tuple, a boolean); the API wants flat query params. */
const toApiParams = (p: TicketListParams) => ({
  page: p.page,
  pageSize: p.pageSize,
  sortField: p.sortField,
  sortOrder: p.sortOrder,
  q: p.q,
  status: p.status,
  priority: p.priority,
  assigneeId: p.assigneeId,
  customerId: p.customerId,
  createdFrom: p.createdRange?.[0],
  createdTo: p.createdRange?.[1],
  overdue: p.overdue ? true : undefined,
})

export const useTickets = (params: TicketListParams) =>
  useQuery({
    queryKey: ticketKeys.list(params),
    queryFn: ({ signal }) => http.get<Paged<TicketRow>>('/tickets', { params: toApiParams(params), signal }),
    // Keep showing the previous page while the next one loads: no flash of an empty table.
    placeholderData: keepPreviousData,
  })

export function useCreateTicket() {
  const queryClient = useQueryClient()
  const notify = useNotify()
  return useMutation({
    mutationFn: (input: TicketInput) => http.post<TicketRow>('/tickets', input),
    onSuccess: (ticket) => {
      notify.success('Ticket created', `${ref(ticket.number)} is in the queue.`)
      return invalidateTicketData(queryClient)
    },
    onError: (error) => notify.error(error, 'Could not create the ticket'),
  })
}

export function useUpdateTicket() {
  const queryClient = useQueryClient()
  const notify = useNotify()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: TicketInput }) => http.put<TicketRow>(`/tickets/${id}`, input),
    onSuccess: (ticket) => {
      notify.success('Ticket saved', `Changes to ${ref(ticket.number)} are live.`)
      return invalidateTicketData(queryClient)
    },
    onError: (error) => notify.error(error, 'Could not save the ticket'),
  })
}

export function useDeleteTicket() {
  const queryClient = useQueryClient()
  const notify = useNotify()
  return useMutation({
    mutationFn: (ticket: TicketRow) => http.delete<void>(`/tickets/${ticket.id}`),
    onSuccess: (_, ticket) => {
      notify.success('Ticket deleted', `${ref(ticket.number)} was removed.`)
      return invalidateTicketData(queryClient)
    },
    onError: (error) => notify.error(error, 'Could not delete the ticket'),
  })
}

export function useBulkTickets() {
  const queryClient = useQueryClient()
  const notify = useNotify()
  return useMutation({
    mutationFn: (payload: BulkTicketAction) => http.post<{ affected: number }>('/tickets/bulk', payload),
    onSuccess: ({ affected }, payload) => {
      const noun = affected === 1 ? 'ticket' : 'tickets'
      notify.success(
        payload.action === 'delete' ? 'Tickets deleted' : `Tickets marked ${payload.status}`,
        `${affected} ${noun} ${payload.action === 'delete' ? 'removed' : 'updated'}.`,
      )
      return invalidateTicketData(queryClient)
    },
    onError: (error) => notify.error(error, 'Could not update the selected tickets'),
  })
}
