import { setupServer } from 'msw/node'
import { handlers } from './handlers'

/** Used by Vitest; the browser build uses ./browser so both environments share handlers. */
export const server = setupServer(...handlers)
