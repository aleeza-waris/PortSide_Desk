import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { RootState } from '@/app/store'
import type { CustomerListParams } from './types'

export interface CustomersState {
  params: CustomerListParams
}

const initialState: CustomersState = {
  params: { page: 1, pageSize: 10, sortField: 'company', sortOrder: 'ascend', q: '', plan: [], status: [] },
}

const customersSlice = createSlice({
  name: 'customers',
  initialState,
  reducers: {
    searchChanged(state, action: PayloadAction<string>) {
      state.params.q = action.payload
      state.params.page = 1
    },
    /** One action for everything antd's Table reports: page, size, sorter and column filters. */
    tableChanged(
      state,
      action: PayloadAction<Pick<CustomerListParams, 'page' | 'pageSize' | 'sortField' | 'sortOrder' | 'plan' | 'status'>>,
    ) {
      const filtersChanged =
        action.payload.plan.join() !== state.params.plan.join() || action.payload.status.join() !== state.params.status.join()
      Object.assign(state.params, action.payload)
      if (filtersChanged) state.params.page = 1
    },
    filtersCleared(state) {
      Object.assign(state.params, { q: '', plan: [], status: [], page: 1 })
    },
  },
})

export const { searchChanged, tableChanged, filtersCleared } = customersSlice.actions
export default customersSlice.reducer

export const selectCustomerParams = (state: RootState) => state.customers.params
