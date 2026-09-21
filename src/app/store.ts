import { combineReducers, configureStore } from '@reduxjs/toolkit'
import analytics from '@/features/analytics/analyticsSlice'
import auth, { signedOut } from '@/features/auth/authSlice'
import customers from '@/features/customers/customersSlice'
import tickets from '@/features/tickets/ticketsSlice'
import { configureHttp } from '@/shared/lib/http'
import ui, { type ThemeMode } from './uiSlice'

const rootReducer = combineReducers({ auth, ui, tickets, customers, analytics })

export type RootState = ReturnType<typeof rootReducer>

const STORAGE_KEY = 'portside.session.v1'

/** Only the session and UI preferences persist; filters and selections start fresh on reload. */
type Persisted = Pick<RootState, 'auth' | 'ui'>

function loadPersisted(): Partial<Persisted> {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const saved = JSON.parse(raw) as Partial<Persisted>
      // Sider state is per-device layout, not a preference: never restore it.
      return { ...saved, ui: { themeMode: saved.ui?.themeMode ?? 'light', siderCollapsed: false } }
    }
  } catch {
    // Unreadable storage: start signed out.
  }
  const prefersDark = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-color-scheme: dark)').matches
  return { ui: { themeMode: (prefersDark ? 'dark' : 'light') satisfies ThemeMode, siderCollapsed: false } }
}

export function createAppStore(preloadedState?: Partial<RootState>) {
  const store = configureStore({
    reducer: rootReducer,
    preloadedState: { ...loadPersisted(), ...preloadedState } as Partial<RootState>,
  })

  let last: Persisted = { auth: store.getState().auth, ui: store.getState().ui }
  store.subscribe(() => {
    const { auth: nextAuth, ui: nextUi } = store.getState()
    if (nextAuth === last.auth && nextUi === last.ui) return
    last = { auth: nextAuth, ui: nextUi }
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(last))
    } catch {
      // Ignore: the app works, the session just will not survive a reload.
    }
  })

  // The HTTP client asks the store for the token, and reports expired sessions back to it.
  configureHttp({
    getToken: () => store.getState().auth.token,
    onUnauthorized: () => store.dispatch(signedOut()),
  })

  return store
}

export type AppStore = ReturnType<typeof createAppStore>
export type AppDispatch = AppStore['dispatch']
