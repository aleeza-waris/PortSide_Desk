import { render } from '@testing-library/react'
import { createMemoryRouter, RouterProvider, createRoutesFromElements } from 'react-router-dom'
import { AppProviders } from '@/app/providers'
import { createQueryClient } from '@/app/queryClient'
import { AppRoutes } from '@/app/routes'
import { createAppStore } from '@/app/store'

/** Renders the whole app (real store, real query client, real routes) at a given URL. */
export function renderApp(path = '/') {
  const store = createAppStore()
  const queryClient = createQueryClient()
  const router = createMemoryRouter(createRoutesFromElements(<AppRoutes />), { initialEntries: [path] })
  const utils = render(
    <AppProviders store={store} queryClient={queryClient}>
      <RouterProvider router={router} />
    </AppProviders>,
  )
  return { ...utils, store, router }
}
