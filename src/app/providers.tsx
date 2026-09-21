import { StyleProvider } from '@ant-design/cssinjs'
import { QueryClientProvider, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { App as AntdApp, ConfigProvider, theme as antTheme } from 'antd'
import enUS from 'antd/locale/en_US'
import { useEffect, useMemo, type ReactNode } from 'react'
import { Provider } from 'react-redux'
import { selectIsAuthenticated } from '@/features/auth/authSlice'
import { useAppSelector } from './hooks'
import type { AppStore } from './store'
import { buildTheme } from './theme'
import { selectThemeMode } from './uiSlice'

/** Paints the page background outside antd's tree and tells the browser which colour scheme is active. */
function ThemeSync() {
  const { token } = antTheme.useToken()
  const mode = useAppSelector(selectThemeMode)
  useEffect(() => {
    document.body.style.background = token.colorBgLayout
    document.documentElement.style.colorScheme = mode
  }, [token.colorBgLayout, mode])
  return null
}

/** When the session ends (sign out, or a 401), nothing cached for the old user should linger. */
function SessionWatcher() {
  const queryClient = useQueryClient()
  const isAuthenticated = useAppSelector(selectIsAuthenticated)
  useEffect(() => {
    if (!isAuthenticated) queryClient.clear()
  }, [isAuthenticated, queryClient])
  return null
}

/** People who ask their OS for reduced motion get antd's open/close animations switched off. */
const prefersReducedMotion = () =>
  typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

function ThemedApp({ children }: { children: ReactNode }) {
  const mode = useAppSelector(selectThemeMode)
  const config = useMemo(() => {
    const theme = buildTheme(mode)
    return prefersReducedMotion() ? { ...theme, token: { ...theme.token, motion: false } } : theme
  }, [mode])
  return (
    // `layer` puts antd's styles in `@layer antd`, below Tailwind's utilities (see tailwind.css).
    <StyleProvider layer>
      <ConfigProvider theme={config} locale={enUS}>
        <AntdApp notification={{ maxCount: 3 }}>
          <ThemeSync />
          <SessionWatcher />
          {children}
        </AntdApp>
      </ConfigProvider>
    </StyleProvider>
  )
}

interface AppProvidersProps {
  store: AppStore
  queryClient: QueryClient
  children: ReactNode
}

export function AppProviders({ store, queryClient, children }: AppProvidersProps) {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <ThemedApp>{children}</ThemedApp>
      </QueryClientProvider>
    </Provider>
  )
}
