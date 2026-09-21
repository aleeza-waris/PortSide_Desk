import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { RootState } from '@/app/store'
import dayjs from '@/shared/lib/dayjs'
import { DAY_FORMAT } from '@/shared/lib/format'
import type { DayRange } from '@/shared/types'

export interface AnalyticsState {
  range: DayRange
}

const initialState: AnalyticsState = {
  range: [dayjs().subtract(29, 'day').format(DAY_FORMAT), dayjs().format(DAY_FORMAT)],
}

const analyticsSlice = createSlice({
  name: 'analytics',
  initialState,
  reducers: {
    rangeChanged(state, action: PayloadAction<DayRange>) {
      state.range = action.payload
    },
  },
})

export const { rangeChanged } = analyticsSlice.actions
export default analyticsSlice.reducer

export const selectAnalyticsRange = (state: RootState) => state.analytics.range
