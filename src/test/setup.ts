import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterAll, afterEach, beforeAll, beforeEach } from 'vitest'
import { wipeDb } from '@/mocks/db'
import { server } from '@/mocks/server'

// jsdom lacks these; antd's responsive and resize logic needs them.
// Behave like a 1440px-wide desktop, so the responsive layout renders the sider rather than the phone drawer.
const VIEWPORT = 1440
const matches = (query: string) => {
  // jsdom never fires animationend, so antd's exit animations would hang: ask for reduced motion.
  if (query.includes('prefers-reduced-motion')) return true
  const min = /\(min-width:\s*(\d+)px\)/.exec(query)
  const max = /\(max-width:\s*(\d+)px\)/.exec(query)
  if (!min && !max) return false
  return (!min || VIEWPORT >= Number(min[1])) && (!max || VIEWPORT <= Number(max[1]))
}

window.matchMedia = ((query: string) => ({
  matches: matches(query),
  media: query,
  onchange: null,
  addListener: () => {},
  removeListener: () => {},
  addEventListener: () => {},
  removeEventListener: () => {},
  dispatchEvent: () => false,
})) as typeof window.matchMedia

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver ??= ResizeObserverStub

// jsdom does not implement pseudo-element styles and logs a noisy warning for each antd call.
const getComputedStyleOriginal = window.getComputedStyle.bind(window)
window.getComputedStyle = (element: Element) => getComputedStyleOriginal(element)

window.scrollTo = () => {}
Element.prototype.scrollIntoView = () => {}

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
beforeEach(() => {
  window.localStorage.clear()
  wipeDb()
})
afterEach(() => {
  cleanup()
  server.resetHandlers()
})
afterAll(() => server.close())
