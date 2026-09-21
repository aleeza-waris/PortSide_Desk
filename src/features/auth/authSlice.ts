import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { RootState } from '@/app/store'
import type { LoginResponse, User } from './types'

export interface AuthState {
  token: string | null
  user: User | null
}

const initialState: AuthState = { token: null, user: null }

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    signedIn(state, action: PayloadAction<LoginResponse>) {
      state.token = action.payload.token
      state.user = action.payload.user
    },
    signedOut() {
      return initialState
    },
  },
})

export const { signedIn, signedOut } = authSlice.actions
export default authSlice.reducer

export const selectCurrentUser = (state: RootState) => state.auth.user
export const selectIsAuthenticated = (state: RootState) => state.auth.token !== null && state.auth.user !== null
