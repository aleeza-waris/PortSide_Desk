import { createSeed, type DbState } from './seed'

const STORAGE_KEY = 'portside.mockdb.v1'

let state: DbState | null = null

function readStored(): DbState | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<DbState>
    if (Array.isArray(parsed.agents) && Array.isArray(parsed.customers) && Array.isArray(parsed.tickets)) {
      return parsed as DbState
    }
  } catch {
    // Corrupt or unavailable storage: fall through and reseed.
  }
  return null
}

/** The live database. Handlers mutate it directly, then call `commit()`. */
export function getDb(): DbState {
  if (!state) state = readStored() ?? createSeed()
  return state
}

/** Persist so the demo survives a page refresh. */
export function commit() {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(getDb()))
  } catch {
    // Storage full or blocked (private mode): the in-memory copy still works.
  }
}

export function resetDb() {
  state = createSeed()
  commit()
}

/** Test helper: forget everything, including what was stored. */
export function wipeDb() {
  state = null
  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}

export function newId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`
}

export function nextTicketNumber(): number {
  return getDb().tickets.reduce((max, ticket) => Math.max(max, ticket.number), 1000) + 1
}
