import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { RootState } from './store'

export type ThemeMode = 'light' | 'dark'

export interface UiState {
  themeMode: ThemeMode
  siderCollapsed: boolean
}

const initialState: UiState = { themeMode: 'light', siderCollapsed: false }

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    themeModeChanged(state, action: PayloadAction<ThemeMode>) {
      state.themeMode = action.payload
    },
    siderCollapsedChanged(state, action: PayloadAction<boolean>) {
      state.siderCollapsed = action.payload
    },
  },
})

export const { themeModeChanged, siderCollapsedChanged } = uiSlice.actions
export default uiSlice.reducer

export const selectThemeMode = (state: RootState) => state.ui.themeMode
export const selectSiderCollapsed = (state: RootState) => state.ui.siderCollapsed
