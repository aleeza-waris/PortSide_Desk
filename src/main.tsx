import '@fontsource/ibm-plex-sans/400.css'
import '@fontsource/ibm-plex-sans/500.css'
import '@fontsource/ibm-plex-sans/600.css'
import '@fontsource/ibm-plex-mono/400.css'
import '@fontsource/ibm-plex-mono/500.css'
import './app/tailwind.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { startMockApi } from '@/mocks/browser'
import { createQueryClient } from './app/queryClient'
import { AppProviders } from './app/providers'
import { AppRoutes } from './app/routes'
import { createAppStore } from './app/store'

async function bootstrap() {
  const rootElement = document.getElementById('root')!
  const root = createRoot(rootElement)

  try {
    // Everything under /api is answered in the browser by Mock Service Worker.
    await startMockApi()
  } catch (error) {
    console.error(error)
    root.render(
      <p className="p-6 font-sans">
        Portside Desk could not start its mock API. It needs a service worker, which browsers only allow on
        localhost or HTTPS.
      </p>,
    )
    return
  }

  // Create these once so every component uses the same store and server-data cache.
  const appStore = createAppStore()
  const queryClient = createQueryClient()

  root.render(
    <StrictMode>
      <AppProviders store={appStore} queryClient={queryClient}>
        <BrowserRouter basename={import.meta.env.BASE_URL}>
          <AppRoutes />
        </BrowserRouter>
      </AppProviders>
    </StrictMode>,
  )
}

void bootstrap()
