import { setupWorker } from 'msw/browser'
import { handlers } from './handlers'

export const worker = setupWorker(...handlers)

// The browser version intercepts /api requests and lets normal asset requests pass through.
export function startMockApi() {
  return worker.start({
    // Only /api is mocked; fonts, chunks and the rest go straight through.
    onUnhandledRequest: 'bypass',
    quiet: true,
    serviceWorker: { url: `${import.meta.env.BASE_URL}mockServiceWorker.js` },
  })
}
