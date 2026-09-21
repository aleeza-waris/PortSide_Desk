import { beforeEach, describe, expect, it } from 'vitest'
import type { CustomerInput, CustomerRow } from '@/features/customers/types'
import type { LoginResponse } from '@/features/auth/types'
import type { Ticket, TicketInput, TicketRow } from '@/features/tickets/types'
import { ApiError, configureHttp, http } from '@/shared/lib/http'
import type { Paged } from '@/shared/types'

let token: string | null = null
configureHttp({ getToken: () => token, onUnauthorized: () => {} })

async function signIn(email = 'mara@portside.dev', password = 'harbour') {
  const session = await http.post<LoginResponse>('/auth/login', { email, password })
  token = session.token
  return session
}

const rejection = async (promise: Promise<unknown>) => promise.then(() => null, (error: unknown) => error as ApiError)

const validTicket = (customerId: string, overrides: Partial<TicketInput> = {}): TicketInput => ({
  subject: 'Pallets crushed on delivery',
  description: 'Three pallets arrived damaged.',
  status: 'open',
  priority: 'high',
  channel: 'email',
  customerId,
  assigneeId: null,
  tags: ['damage'],
  dueAt: null,
  ...overrides,
})

const listTickets = (params: Record<string, string | number | string[]> = {}) =>
  http.get<Paged<TicketRow>>('/tickets', { params: { pageSize: 10, ...params } })

beforeEach(() => {
  token = null
})

describe('auth', () => {
  it('signs in a seeded agent and rejects a wrong password', async () => {
    const session = await signIn()
    expect(session.user).toMatchObject({ name: 'Mara Okonkwo', role: 'admin' })

    const error = await rejection(http.post('/auth/login', { email: 'mara@portside.dev', password: 'nope' }))
    expect(error).toBeInstanceOf(ApiError)
    expect(error?.status).toBe(401)
  })

  it('refuses every data request without a token', async () => {
    for (const path of ['/tickets', '/customers', '/agents', '/dashboard', '/analytics']) {
      const error = await rejection(http.get(path))
      expect(error?.status, path).toBe(401)
    }
  })
})

describe('tickets', () => {
  beforeEach(async () => {
    await signIn()
  })

  it('paginates on the server', async () => {
    const first = await listTickets({ page: 1 })
    const second = await listTickets({ page: 2 })
    expect(first.total).toBe(240)
    expect(first.items).toHaveLength(10)
    expect(second.items).toHaveLength(10)
    expect(second.items[0]!.id).not.toBe(first.items[0]!.id)
  })

  it('sorts by priority in both directions', async () => {
    const desc = await listTickets({ sortField: 'priority', sortOrder: 'descend' })
    const asc = await listTickets({ sortField: 'priority', sortOrder: 'ascend' })
    expect(desc.items[0]!.priority).toBe('urgent')
    expect(asc.items[0]!.priority).toBe('low')
  })

  it('filters by status, assignee and text', async () => {
    const open = await listTickets({ status: ['open'], pageSize: 100 })
    expect(open.items.length).toBeGreaterThan(0)
    expect(open.items.every((ticket) => ticket.status === 'open')).toBe(true)

    const unassigned = await listTickets({ assigneeId: 'unassigned', pageSize: 100 })
    expect(unassigned.items.every((ticket) => ticket.assigneeId === null)).toBe(true)

    const target = (await listTickets()).items[0]!
    const byRef = await listTickets({ q: `PS-${target.number}` })
    expect(byRef.items.map((ticket) => ticket.id)).toContain(target.id)
    expect(byRef.total).toBe(1)
  })

  it('returns overdue tickets only when asked', async () => {
    const overdue = await listTickets({ overdue: 'true', pageSize: 100 })
    expect(overdue.items.length).toBeGreaterThan(0)
    for (const ticket of overdue.items) {
      expect(['open', 'pending']).toContain(ticket.status)
      expect(Date.parse(ticket.dueAt!)).toBeLessThan(Date.now())
    }
  })

  it('creates, updates and deletes a ticket', async () => {
    const before = (await listTickets()).total
    const customer = (await listTickets()).items[0]!.customer

    const created = await http.post<TicketRow>('/tickets', validTicket(customer.id))
    expect(created.number).toBe(1241)
    expect((await listTickets()).total).toBe(before + 1)

    // Resolving stamps resolvedAt; reopening clears it again.
    const resolved = await http.put<Ticket>(`/tickets/${created.id}`, validTicket(customer.id, { status: 'resolved' }))
    expect(resolved.resolvedAt).not.toBeNull()
    const reopened = await http.put<Ticket>(`/tickets/${created.id}`, validTicket(customer.id, { status: 'open' }))
    expect(reopened.resolvedAt).toBeNull()

    await http.delete(`/tickets/${created.id}`)
    expect((await listTickets()).total).toBe(before)
    const again = await rejection(http.delete(`/tickets/${created.id}`))
    expect(again?.status).toBe(404)
  })

  it('validates input with a message the form can show', async () => {
    const customer = (await listTickets()).items[0]!.customer
    const noSubject = await rejection(http.post('/tickets', validTicket(customer.id, { subject: '   ' })))
    expect(noSubject?.status).toBe(422)
    expect(noSubject?.message).toMatch(/subject/i)

    const badCustomer = await rejection(http.post('/tickets', validTicket('cus_missing')))
    expect(badCustomer?.status).toBe(422)
  })

  it('applies bulk actions', async () => {
    const open = (await listTickets({ status: ['open'], pageSize: 3 })).items
    const ids = open.map((ticket) => ticket.id)

    const { affected } = await http.post<{ affected: number }>('/tickets/bulk', { action: 'setStatus', ids, status: 'resolved' })
    expect(affected).toBe(3)
    const remaining = await listTickets({ status: ['open'], pageSize: 100 })
    expect(remaining.items.some((ticket) => ids.includes(ticket.id))).toBe(false)

    const deleted = await http.post<{ affected: number }>('/tickets/bulk', { action: 'delete', ids })
    expect(deleted.affected).toBe(3)
    expect((await listTickets()).total).toBe(237)
  })
})

describe('customers', () => {
  beforeEach(async () => {
    await signIn()
  })

  const input = (overrides: Partial<CustomerInput> = {}): CustomerInput => ({
    company: 'Zed Harbour Freight',
    name: 'Zoe Adler',
    email: 'zoe@zedharbour.com',
    country: 'Canada',
    plan: 'standard',
    status: 'onboarding',
    shipmentsPerMonth: 4,
    mrr: 0,
    notes: '',
    createdAt: new Date().toISOString(),
    ...overrides,
  })

  it('creates and deletes a customer with no tickets', async () => {
    const created = await http.post<CustomerRow>('/customers', input())
    expect(created.openTickets).toBe(0)
    await http.delete(`/customers/${created.id}`)
    const list = await http.get<Paged<CustomerRow>>('/customers', { params: { q: 'Zed Harbour' } })
    expect(list.total).toBe(0)
  })

  it('refuses a duplicate email', async () => {
    await http.post('/customers', input())
    const error = await rejection(http.post('/customers', input({ company: 'Another Co' })))
    expect(error?.status).toBe(422)
    expect(error?.message).toMatch(/already uses this email/i)
  })

  it('will not delete a customer who still has open tickets', async () => {
    const withOpen = (await http.get<Paged<CustomerRow>>('/customers', { params: { sortField: 'openTickets', sortOrder: 'descend', pageSize: 1 } })).items[0]!
    expect(withOpen.openTickets).toBeGreaterThan(0)
    const error = await rejection(http.delete(`/customers/${withOpen.id}`))
    expect(error?.status).toBe(409)
    expect(error?.message).toMatch(/still has \d+ open/)
  })

  it('filters by plan and searches by text', async () => {
    const enterprise = await http.get<Paged<CustomerRow>>('/customers', { params: { plan: ['enterprise'], pageSize: 100 } })
    expect(enterprise.items.every((customer) => customer.plan === 'enterprise')).toBe(true)
    const search = await http.get<Paged<CustomerRow>>('/customers', { params: { q: 'brightwater' } })
    expect(search.items.map((customer) => customer.company)).toContain('Brightwater Coffee Imports')
  })
})

describe('reports', () => {
  beforeEach(async () => {
    await signIn()
  })

  it('builds one bucket per day in the analytics range', async () => {
    const report = await http.get<{ daily: { date: string }[]; totals: { created: number } }>('/analytics', {
      params: { from: '2026-09-01', to: '2026-09-10' },
    })
    expect(report.daily).toHaveLength(10)
    expect(report.daily[0]!.date).toBe('2026-09-01')
  })

  it('summarises the queue for the overview', async () => {
    const summary = await http.get<{ counts: Record<string, number>; overdue: number; dueNext: TicketRow[] }>('/dashboard')
    expect(Object.values(summary.counts).reduce((a, b) => a + b, 0)).toBe(240)
    expect(summary.dueNext.length).toBeLessThanOrEqual(8)
  })
})
