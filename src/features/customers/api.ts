import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNotify } from '@/shared/hooks/useNotify'
import { http } from '@/shared/lib/http'
import { invalidateCustomerData, ROOT } from '@/shared/lib/queryKeys'
import type { Paged } from '@/shared/types'
import type { CustomerInput, CustomerListParams, CustomerOption, CustomerRow } from './types'

export const customerKeys = {
  all: [ROOT.customers] as const,
  list: (params: CustomerListParams) => [ROOT.customers, 'list', params] as const,
  options: (q: string) => [ROOT.customers, 'options', q] as const,
}

const toApiParams = (p: CustomerListParams) => ({
  page: p.page,
  pageSize: p.pageSize,
  sortField: p.sortField,
  sortOrder: p.sortOrder,
  q: p.q,
  plan: p.plan,
  status: p.status,
})

export const useCustomers = (params: CustomerListParams) =>
  useQuery({
    queryKey: customerKeys.list(params),
    queryFn: ({ signal }) => http.get<Paged<CustomerRow>>('/customers', { params: toApiParams(params), signal }),
    placeholderData: keepPreviousData,
  })

/** Lightweight list for pickers: searched on the server, never more than 20 rows. */
export const useCustomerOptions = (q: string) =>
  useQuery({
    queryKey: customerKeys.options(q),
    queryFn: ({ signal }) => http.get<CustomerOption[]>('/customers/options', { params: { q }, signal }),
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  })

export function useCreateCustomer() {
  const queryClient = useQueryClient()
  const notify = useNotify()
  return useMutation({
    mutationFn: (input: CustomerInput) => http.post<CustomerRow>('/customers', input),
    onSuccess: (customer) => {
      notify.success('Customer created', `${customer.company} is now in your customer list.`)
      return invalidateCustomerData(queryClient)
    },
    onError: (error) => notify.error(error, 'Could not create the customer'),
  })
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient()
  const notify = useNotify()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: CustomerInput }) => http.put<CustomerRow>(`/customers/${id}`, input),
    onSuccess: (customer) => {
      notify.success('Customer saved', `Changes to ${customer.company} are live.`)
      return invalidateCustomerData(queryClient)
    },
    onError: (error) => notify.error(error, 'Could not save the customer'),
  })
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient()
  const notify = useNotify()
  return useMutation({
    mutationFn: (customer: CustomerRow) => http.delete<void>(`/customers/${customer.id}`),
    onSuccess: (_, customer) => {
      notify.success('Customer deleted', `${customer.company} and their finished tickets were removed.`)
      return invalidateCustomerData(queryClient)
    },
    onError: (error) => notify.error(error, 'Could not delete the customer'),
  })
}
