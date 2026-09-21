import { render } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { AppProviders } from '@/app/providers'
import { createQueryClient } from '@/app/queryClient'
import { routes } from '@/app/routes'
import { createAppStore } from '@/app/store'

/** Renders the whole app (real store, real query client, real routes) at a given URL. */
export function renderApp(path = '/') {
  const store = createAppStore()
  const queryClient = createQueryClient()
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  const utils = render(
    <AppProviders store={store} queryClient={queryClient}>
      <RouterProvider router={router} />
    </AppProviders>,
  )
  return { ...utils, store, router }
}
