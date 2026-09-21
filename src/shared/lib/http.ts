/**
 * Tiny fetch wrapper for the mock API.
 *
 * - Throws `ApiError` for every non-2xx response, carrying the server's message.
 * - Reports 401s through a callback so the auth feature can sign the user out
 *   without this module importing the store (which would be a circular import).
 */

type ParamValue = string | number | boolean | null | undefined | ReadonlyArray<string | number>
export type Params = Record<string, ParamValue>

export class ApiError extends Error {
  readonly status: number
  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

interface AuthHooks {
  getToken: () => string | null
  onUnauthorized: () => void
}

let hooks: AuthHooks = { getToken: () => null, onUnauthorized: () => {} }

export function configureHttp(next: AuthHooks) {
  hooks = next
}

export function toSearchParams(params: Params = {}): URLSearchParams {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined || value === '') continue
    if (Array.isArray(value)) {
      for (const item of value) search.append(key, String(item))
    } else {
      search.append(key, String(value))
    }
  }
  return search
}

interface RequestOptions {
  params?: Params
  body?: unknown
  signal?: AbortSignal
}

async function request<T>(method: string, path: string, { params, body, signal }: RequestOptions = {}): Promise<T> {
  // Absolute URL: the mock API is mounted at the site origin, and Node's fetch (used by the tests) needs one.
  const url = new URL(`/api${path}`, window.location.origin)
  url.search = toSearchParams(params).toString()

  const headers: Record<string, string> = { Accept: 'application/json' }
  const token = hooks.getToken()
  if (token) headers.Authorization = `Bearer ${token}`
  if (body !== undefined) headers['Content-Type'] = 'application/json'

  let response: Response
  try {
    response = await fetch(url, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    throw new ApiError(0, 'Could not reach the server. Check your connection and try again.')
  }

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { message?: string } | null
    if (response.status === 401 && token) hooks.onUnauthorized()
    throw new ApiError(response.status, payload?.message ?? `Request failed (${response.status})`)
  }

  return response.status === 204 ? (undefined as T) : ((await response.json()) as T)
}

export const http = {
  get: <T>(path: string, options?: RequestOptions) => request<T>('GET', path, options),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) => request<T>('POST', path, { ...options, body }),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) => request<T>('PUT', path, { ...options, body }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) => request<T>('PATCH', path, { ...options, body }),
  delete: <T>(path: string, options?: RequestOptions) => request<T>('DELETE', path, options),
}
