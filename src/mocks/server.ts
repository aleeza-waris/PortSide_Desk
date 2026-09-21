import { setupServer } from 'msw/node'
import { handlers } from './handlers'

/** Used by the Vitest suite; the browser build uses ./browser instead. */
export const server = setupServer(...handlers)
