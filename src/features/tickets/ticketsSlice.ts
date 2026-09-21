import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { RootState } from '@/app/store'
import type { TicketListParams } from './types'

/** The filter fields (everything except paging and sorting). */
type FilterFields = Pick<TicketListParams, 'q' | 'status' | 'priority' | 'assigneeId' | 'customerId' | 'createdRange' | 'overdue'>

export interface TicketsState {
  params: TicketListParams
  /** Label for the customer chip: the filter itself only stores the id. */
  customerLabel: string | null
  /** Row selection survives paging, and is cleared whenever the filters change. */
  selectedIds: string[]
}

const emptyFilters: FilterFields = {
  q: '',
  status: [],
  priority: [],
  assigneeId: null,
  customerId: null,
  createdRange: null,
  overdue: false,
}

const initialState: TicketsState = {
  params: { page: 1, pageSize: 10, sortField: 'createdAt', sortOrder: 'descend', ...emptyFilters },
  customerLabel: null,
  selectedIds: [],
}

const ticketsSlice = createSlice({
  name: 'tickets',
  initialState,
  reducers: {
    /** Change some filters: back to page 1, and forget the selection. */
    filtersChanged(state, action: PayloadAction<Partial<FilterFields>>) {
      Object.assign(state.params, action.payload, { page: 1 })
      if (action.payload.customerId === null) state.customerLabel = null
      state.selectedIds = []
    },
    /** Replace all filters at once: used by deep links from other pages. */
    filtersReplaced(state, action: PayloadAction<Partial<FilterFields> & { customerLabel?: string }>) {
      const { customerLabel, ...filters } = action.payload
      Object.assign(state.params, emptyFilters, filters, { page: 1 })
      state.customerLabel = customerLabel ?? null
      state.selectedIds = []
    },
    filtersCleared(state) {
      Object.assign(state.params, emptyFilters, { page: 1 })
      state.customerLabel = null
      state.selectedIds = []
    },
    customerFilterSet(state, action: PayloadAction<{ id: string; label: string }>) {
      state.params.customerId = action.payload.id
      state.customerLabel = action.payload.label
      state.params.page = 1
      state.selectedIds = []
    },
    tableChanged(
      state,
      action: PayloadAction<Pick<TicketListParams, 'page' | 'pageSize' | 'sortField' | 'sortOrder'>>,
    ) {
      Object.assign(state.params, action.payload)
    },
    selectionChanged(state, action: PayloadAction<string[]>) {
      state.selectedIds = action.payload
    },
    selectionRemoved(state, action: PayloadAction<string[]>) {
      const removed = new Set(action.payload)
      state.selectedIds = state.selectedIds.filter((id) => !removed.has(id))
    },
    selectionCleared(state) {
      state.selectedIds = []
    },
  },
})

export const {
  filtersChanged,
  filtersReplaced,
  filtersCleared,
  customerFilterSet,
  tableChanged,
  selectionChanged,
  selectionRemoved,
  selectionCleared,
} = ticketsSlice.actions
export default ticketsSlice.reducer

export const selectTicketParams = (state: RootState) => state.tickets.params
export const selectTicketCustomerLabel = (state: RootState) => state.tickets.customerLabel
export const selectSelectedTicketIds = (state: RootState) => state.tickets.selectedIds
