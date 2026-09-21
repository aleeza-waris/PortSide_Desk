/**
 * The mock REST API. Each handler does what a real backend would: authenticates,
 * validates, filters/sorts/paginates on the "server", and answers with the
 * status codes the UI has to cope with (401, 404, 409, 422).
 */
import { delay, http, HttpResponse } from 'msw'
import {
  CUSTOMER_PLANS,
  CUSTOMER_STATUSES,
  type Customer,
  type CustomerInput,
  type CustomerOption,
  type CustomerRow,
} from '@/features/customers/types'
import type { AgentRow, Agent } from '@/features/team/types'
import type { LoginRequest, LoginResponse } from '@/features/auth/types'
import type { AnalyticsReport } from '@/features/analytics/types'
import type { DashboardSummary } from '@/features/dashboard/types'
import {
  TICKET_CHANNELS,
  TICKET_PRIORITIES,
  TICKET_STATUSES,
  UNASSIGNED,
  type BulkTicketAction,
  type Ticket,
  type TicketInput,
  type TicketRow,
  type TicketStatus,
} from '@/features/tickets/types'
import dayjs from '@/shared/lib/dayjs'
import type { Paged } from '@/shared/types'
import { commit, getDb, newId, nextTicketNumber, resetDb } from './db'
import { DEMO_PASSWORD } from './seed'

// These helpers are shared by the endpoint definitions at the bottom of this file.

const latency = () => delay(import.meta.env.MODE === 'test' ? 0 : 160 + Math.random() * 240)

const fail = (status: number, message: string) => HttpResponse.json({ message }, { status })
const noContent = () => new HttpResponse(null, { status: 204 })

function currentAgent(request: Request): Agent | null {
  const match = /^Bearer mock-(.+)$/.exec(request.headers.get('Authorization') ?? '')
  return match ? (getDb().agents.find((agent) => agent.id === match[1]) ?? null) : null
}

interface Ctx {
  request: Request
  params: Record<string, string | readonly string[] | undefined>
}

/** Adds simulated latency and rejects requests without a valid token. */
function secured(resolver: (ctx: Ctx) => Response | Promise<Response>) {
  return async (ctx: Ctx) => {
    await latency()
    if (!currentAgent(ctx.request)) return fail(401, 'Your session has expired. Sign in again.')
    return resolver(ctx)
  }
}

const ACTIVE: readonly TicketStatus[] = ['open', 'pending']
const isActive = (ticket: Ticket) => ACTIVE.includes(ticket.status)
const isDone = (status: TicketStatus) => status === 'resolved' || status === 'closed'
const isOverdue = (ticket: Ticket) => isActive(ticket) && !!ticket.dueAt && Date.parse(ticket.dueAt) < Date.now()

function paginate<T>(items: T[], sp: URLSearchParams): Paged<T> {
  const pageSize = Math.min(100, Math.max(1, Number(sp.get('pageSize')) || 10))
  const lastPage = Math.max(1, Math.ceil(items.length / pageSize))
  const page = Math.min(lastPage, Math.max(1, Number(sp.get('page')) || 1))
  return { items: items.slice((page - 1) * pageSize, page * pageSize), total: items.length, page, pageSize }
}

function direction(sp: URLSearchParams) {
  return sp.get('sortOrder') === 'descend' ? -1 : 1
}

const uniqueStrings = (values: unknown): string[] =>
  Array.isArray(values)
    ? [...new Set(values.map((value) => String(value).trim().toLowerCase()).filter(Boolean))].slice(0, 8)
    : []

// A ticket in the database only has IDs. A ticket table row also includes customer and agent details.

const PRIORITY_RANK = { low: 0, medium: 1, high: 2, urgent: 3 } as const
const STATUS_RANK = { open: 0, pending: 1, resolved: 2, closed: 3 } as const

function toRow(ticket: Ticket): TicketRow {
  const { customers, agents } = getDb()
  const customer = customers.find((item) => item.id === ticket.customerId)
  const assignee = agents.find((item) => item.id === ticket.assigneeId)
  return {
    ...ticket,
    customer: customer
      ? { id: customer.id, name: customer.name, company: customer.company }
      : { id: ticket.customerId, name: 'Unknown', company: 'Deleted customer' },
    assignee: assignee ? { id: assignee.id, name: assignee.name, avatarColor: assignee.avatarColor } : null,
  }
}

function listTickets(sp: URLSearchParams): TicketRow[] {
  const q = (sp.get('q') ?? '').trim().toLowerCase()
  const status = sp.getAll('status')
  const priority = sp.getAll('priority')
  const assigneeId = sp.get('assigneeId')
  const customerId = sp.get('customerId')
  const from = sp.get('createdFrom') ? dayjs(sp.get('createdFrom')).startOf('day').valueOf() : null
  const to = sp.get('createdTo') ? dayjs(sp.get('createdTo')).endOf('day').valueOf() : null
  const overdueOnly = sp.get('overdue') === 'true'

  let rows = getDb().tickets.map(toRow)

  if (q) {
    rows = rows.filter((row) =>
      [`ps-${row.number}`, String(row.number), row.subject, row.customer.company, row.customer.name, row.tags.join(' ')]
        .join(' ')
        .toLowerCase()
        .includes(q),
    )
  }
  if (status.length) rows = rows.filter((row) => status.includes(row.status))
  if (priority.length) rows = rows.filter((row) => priority.includes(row.priority))
  if (assigneeId) rows = rows.filter((row) => (assigneeId === UNASSIGNED ? row.assigneeId === null : row.assigneeId === assigneeId))
  if (customerId) rows = rows.filter((row) => row.customerId === customerId)
  if (from !== null) rows = rows.filter((row) => Date.parse(row.createdAt) >= from)
  if (to !== null) rows = rows.filter((row) => Date.parse(row.createdAt) <= to)
  if (overdueOnly) rows = rows.filter(isOverdue)

  const field = sp.get('sortField') ?? 'createdAt'
  const dir = sp.get('sortField') ? direction(sp) : -1
  const compare: Record<string, (a: TicketRow, b: TicketRow) => number> = {
    number: (a, b) => a.number - b.number,
    customer: (a, b) => a.customer.company.localeCompare(b.customer.company),
    status: (a, b) => STATUS_RANK[a.status] - STATUS_RANK[b.status],
    priority: (a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority],
    assignee: (a, b) => (a.assignee?.name ?? '~').localeCompare(b.assignee?.name ?? '~'),
    dueAt: (a, b) => (a.dueAt ? Date.parse(a.dueAt) : Infinity) - (b.dueAt ? Date.parse(b.dueAt) : Infinity),
    createdAt: (a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt),
  }
  const byField = compare[field] ?? compare.createdAt!
  // Tie-break on number so paging through equal values is stable.
  return rows.sort((a, b) => byField(a, b) * dir || (a.number - b.number) * -1)
}

type Validated<T> = { ok: true; value: T } | { ok: false; message: string }

function validateTicket(body: unknown): Validated<TicketInput> {
  const input = (body ?? {}) as Partial<TicketInput>
  const { customers, agents } = getDb()

  const subject = String(input.subject ?? '').trim()
  if (!subject) return { ok: false, message: 'Add a subject so the team can find this ticket.' }
  if (subject.length > 120) return { ok: false, message: 'Keep the subject under 120 characters.' }

  const description = String(input.description ?? '').trim()
  if (!description) return { ok: false, message: 'Describe what the customer needs.' }

  if (!TICKET_STATUSES.includes(input.status as TicketStatus)) return { ok: false, message: 'Choose a valid status.' }
  if (!TICKET_PRIORITIES.includes(input.priority as never)) return { ok: false, message: 'Choose a valid priority.' }
  if (!TICKET_CHANNELS.includes(input.channel as never)) return { ok: false, message: 'Choose a valid channel.' }
  if (!customers.some((customer) => customer.id === input.customerId)) return { ok: false, message: 'Choose a customer for this ticket.' }

  const assigneeId = input.assigneeId ?? null
  if (assigneeId !== null && !agents.some((agent) => agent.id === assigneeId)) return { ok: false, message: 'That agent no longer exists.' }

  const dueAt = input.dueAt ?? null
  if (dueAt !== null && Number.isNaN(Date.parse(dueAt))) return { ok: false, message: 'The due date is not valid.' }

  return {
    ok: true,
    value: {
      subject,
      description,
      status: input.status as TicketStatus,
      priority: input.priority!,
      channel: input.channel!,
      customerId: input.customerId!,
      assigneeId,
      tags: uniqueStrings(input.tags),
      dueAt: dueAt === null ? null : new Date(dueAt).toISOString(),
    },
  }
}

function setStatus(ticket: Ticket, status: TicketStatus) {
  ticket.status = status
  if (isDone(status)) {
    ticket.resolvedAt ??= new Date().toISOString()
  } else {
    ticket.resolvedAt = null
    ticket.csat = null
  }
}

// Customer endpoints use these helpers for validation and open-ticket rules.

const PLAN_RANK = { standard: 0, priority: 1, enterprise: 2 } as const

function openTicketCounts(): Map<string, number> {
  const counts = new Map<string, number>()
  for (const ticket of getDb().tickets) {
    if (isActive(ticket)) counts.set(ticket.customerId, (counts.get(ticket.customerId) ?? 0) + 1)
  }
  return counts
}

function validateCustomer(body: unknown, ignoreId?: string): Validated<CustomerInput> {
  const input = (body ?? {}) as Partial<CustomerInput>

  const company = String(input.company ?? '').trim()
  if (!company) return { ok: false, message: 'Add the company name.' }
  const name = String(input.name ?? '').trim()
  if (!name) return { ok: false, message: 'Add the name of the main contact.' }
  const email = String(input.email ?? '').trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, message: 'Enter a valid email address.' }
  if (getDb().customers.some((customer) => customer.email === email && customer.id !== ignoreId)) {
    return { ok: false, message: 'Another customer already uses this email address.' }
  }
  if (!CUSTOMER_PLANS.includes(input.plan as never)) return { ok: false, message: 'Choose a plan.' }
  if (!CUSTOMER_STATUSES.includes(input.status as never)) return { ok: false, message: 'Choose a status.' }

  const mrr = Number(input.mrr ?? 0)
  const shipments = Number(input.shipmentsPerMonth ?? 0)
  if (!Number.isFinite(mrr) || mrr < 0) return { ok: false, message: 'Monthly revenue cannot be negative.' }
  if (!Number.isFinite(shipments) || shipments < 0) return { ok: false, message: 'Shipments per month cannot be negative.' }

  return {
    ok: true,
    value: {
      company,
      name,
      email,
      country: String(input.country ?? '').trim() || 'United States',
      plan: input.plan!,
      status: input.status!,
      mrr: Math.round(mrr),
      shipmentsPerMonth: Math.round(shipments),
      notes: String(input.notes ?? '').trim(),
      createdAt: input.createdAt && !Number.isNaN(Date.parse(input.createdAt)) ? new Date(input.createdAt).toISOString() : new Date().toISOString(),
    },
  }
}

// Each item below is one endpoint in the fake API. The path matches the path used by the feature's api.ts.

export const handlers = [
  // Auth
  http.post('/api/auth/login', async ({ request }) => {
    await latency()
    const { email, password } = (await request.json().catch(() => ({}))) as Partial<LoginRequest>
    const agent = getDb().agents.find((item) => item.email === String(email ?? '').trim().toLowerCase())
    if (!agent || password !== DEMO_PASSWORD) return fail(401, 'That email and password do not match.')
    const response: LoginResponse = {
      token: `mock-${agent.id}`,
      user: { id: agent.id, name: agent.name, email: agent.email, role: agent.role, avatarColor: agent.avatarColor },
    }
    return HttpResponse.json(response)
  }),

  http.post('/api/dev/reset', secured(() => {
    resetDb()
    return noContent()
  })),

  // Dashboard
  http.get('/api/dashboard', secured(() => {
    const { tickets } = getDb()
    const now = Date.now()
    const counts: Record<TicketStatus, number> = { open: 0, pending: 0, resolved: 0, closed: 0 }
    for (const ticket of tickets) counts[ticket.status]++

    const active = tickets.filter(isActive)
    const summary: DashboardSummary = {
      counts,
      overdue: active.filter(isOverdue).length,
      unassigned: active.filter((ticket) => ticket.assigneeId === null).length,
      createdThisWeek: tickets.filter((ticket) => now - Date.parse(ticket.createdAt) < 7 * 86_400_000).length,
      createdLastWeek: tickets.filter((ticket) => {
        const age = now - Date.parse(ticket.createdAt)
        return age >= 7 * 86_400_000 && age < 14 * 86_400_000
      }).length,
      dueNext: active
        .filter((ticket) => ticket.dueAt)
        .sort((a, b) => Date.parse(a.dueAt!) - Date.parse(b.dueAt!))
        .slice(0, 8)
        .map(toRow),
    }
    return HttpResponse.json(summary)
  })),

  // Tickets
  http.get('/api/tickets', secured(({ request }) => {
    const sp = new URL(request.url).searchParams
    return HttpResponse.json(paginate(listTickets(sp), sp))
  })),

  http.post('/api/tickets/bulk', secured(async ({ request }) => {
    const body = (await request.json()) as BulkTicketAction
    const ids = new Set(body.ids ?? [])
    const db = getDb()
    if (ids.size === 0) return fail(422, 'Select at least one ticket.')

    if (body.action === 'delete') {
      const before = db.tickets.length
      db.tickets = db.tickets.filter((ticket) => !ids.has(ticket.id))
      commit()
      return HttpResponse.json({ affected: before - db.tickets.length })
    }
    if (body.action === 'setStatus' && TICKET_STATUSES.includes(body.status)) {
      let affected = 0
      for (const ticket of db.tickets) {
        if (!ids.has(ticket.id)) continue
        setStatus(ticket, body.status)
        ticket.updatedAt = new Date().toISOString()
        affected++
      }
      commit()
      return HttpResponse.json({ affected })
    }
    return fail(422, 'That bulk action is not supported.')
  })),

  http.post('/api/tickets', secured(async ({ request }) => {
    const result = validateTicket(await request.json().catch(() => null))
    if (!result.ok) return fail(422, result.message)

    const now = new Date().toISOString()
    const ticket: Ticket = {
      ...result.value,
      id: newId('tkt'),
      number: nextTicketNumber(),
      createdAt: now,
      updatedAt: now,
      resolvedAt: null,
      csat: null,
    }
    setStatus(ticket, result.value.status)
    getDb().tickets.push(ticket)
    commit()
    return HttpResponse.json(toRow(ticket), { status: 201 })
  })),

  http.get('/api/tickets/:id', secured(({ params }) => {
    const ticket = getDb().tickets.find((item) => item.id === params.id)
    return ticket ? HttpResponse.json(toRow(ticket)) : fail(404, 'This ticket no longer exists.')
  })),

  http.put('/api/tickets/:id', secured(async ({ request, params }) => {
    const ticket = getDb().tickets.find((item) => item.id === params.id)
    if (!ticket) return fail(404, 'This ticket no longer exists. It may have been deleted by someone else.')
    const result = validateTicket(await request.json().catch(() => null))
    if (!result.ok) return fail(422, result.message)

    const { status, ...fields } = result.value
    Object.assign(ticket, fields)
    setStatus(ticket, status)
    ticket.updatedAt = new Date().toISOString()
    commit()
    return HttpResponse.json(toRow(ticket))
  })),

  http.delete('/api/tickets/:id', secured(({ params }) => {
    const db = getDb()
    const index = db.tickets.findIndex((item) => item.id === params.id)
    if (index === -1) return fail(404, 'This ticket was already deleted.')
    db.tickets.splice(index, 1)
    commit()
    return noContent()
  })),

  // Customers
  http.get('/api/customers/options', secured(({ request }) => {
    const sp = new URL(request.url).searchParams
    const q = (sp.get('q') ?? '').trim().toLowerCase()
    const options: CustomerOption[] = getDb()
      .customers.filter((customer) => !q || `${customer.company} ${customer.name}`.toLowerCase().includes(q))
      .sort((a, b) => a.company.localeCompare(b.company))
      .slice(0, 20)
      .map(({ id, name, company }) => ({ id, name, company }))
    return HttpResponse.json(options)
  })),

  http.get('/api/customers', secured(({ request }) => {
    const sp = new URL(request.url).searchParams
    const q = (sp.get('q') ?? '').trim().toLowerCase()
    const plans = sp.getAll('plan')
    const statuses = sp.getAll('status')
    const counts = openTicketCounts()

    let rows: CustomerRow[] = getDb().customers.map((customer) => ({ ...customer, openTickets: counts.get(customer.id) ?? 0 }))
    if (q) rows = rows.filter((row) => `${row.company} ${row.name} ${row.email} ${row.country}`.toLowerCase().includes(q))
    if (plans.length) rows = rows.filter((row) => plans.includes(row.plan))
    if (statuses.length) rows = rows.filter((row) => statuses.includes(row.status))

    const compare: Record<string, (a: CustomerRow, b: CustomerRow) => number> = {
      company: (a, b) => a.company.localeCompare(b.company),
      plan: (a, b) => PLAN_RANK[a.plan] - PLAN_RANK[b.plan],
      status: (a, b) => a.status.localeCompare(b.status),
      shipmentsPerMonth: (a, b) => a.shipmentsPerMonth - b.shipmentsPerMonth,
      mrr: (a, b) => a.mrr - b.mrr,
      createdAt: (a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt),
      openTickets: (a, b) => a.openTickets - b.openTickets,
    }
    const byField = compare[sp.get('sortField') ?? 'company'] ?? compare.company!
    const dir = direction(sp)
    rows.sort((a, b) => byField(a, b) * dir || a.company.localeCompare(b.company))
    return HttpResponse.json(paginate(rows, sp))
  })),

  http.post('/api/customers', secured(async ({ request }) => {
    const result = validateCustomer(await request.json().catch(() => null))
    if (!result.ok) return fail(422, result.message)
    const customer: Customer = { ...result.value, id: newId('cus'), lastContactAt: null }
    getDb().customers.push(customer)
    commit()
    return HttpResponse.json({ ...customer, openTickets: 0 } satisfies CustomerRow, { status: 201 })
  })),

  http.put('/api/customers/:id', secured(async ({ request, params }) => {
    const customer = getDb().customers.find((item) => item.id === params.id)
    if (!customer) return fail(404, 'This customer no longer exists.')
    const result = validateCustomer(await request.json().catch(() => null), customer.id)
    if (!result.ok) return fail(422, result.message)
    Object.assign(customer, result.value)
    commit()
    return HttpResponse.json({ ...customer, openTickets: openTicketCounts().get(customer.id) ?? 0 } satisfies CustomerRow)
  })),

  http.delete('/api/customers/:id', secured(({ params }) => {
    const db = getDb()
    const customer = db.customers.find((item) => item.id === params.id)
    if (!customer) return fail(404, 'This customer was already deleted.')

    const open = openTicketCounts().get(customer.id) ?? 0
    if (open > 0) {
      return fail(409, `${customer.company} still has ${open} open ${open === 1 ? 'ticket' : 'tickets'}. Resolve or reassign ${open === 1 ? 'it' : 'them'} first.`)
    }
    db.customers = db.customers.filter((item) => item.id !== customer.id)
    db.tickets = db.tickets.filter((ticket) => ticket.customerId !== customer.id) // finished tickets go with the customer
    commit()
    return noContent()
  })),

  // Team
  http.get('/api/agents', secured(() => {
    const { agents, tickets } = getDb()
    const weekAgo = Date.now() - 7 * 86_400_000
    const rows: AgentRow[] = agents.map((agent) => {
      const mine = tickets.filter((ticket) => ticket.assigneeId === agent.id)
      const ratings = mine.map((ticket) => ticket.csat).filter((value): value is number => value !== null)
      return {
        ...agent,
        openTickets: mine.filter(isActive).length,
        resolvedThisWeek: mine.filter((ticket) => ticket.resolvedAt && Date.parse(ticket.resolvedAt) >= weekAgo).length,
        csat: ratings.length ? ratings.reduce((sum, value) => sum + value, 0) / ratings.length : 0,
      }
    })
    return HttpResponse.json(rows)
  })),

  http.patch('/api/agents/:id', secured(async ({ request, params }) => {
    const agent = getDb().agents.find((item) => item.id === params.id)
    if (!agent) return fail(404, 'This agent no longer exists.')
    const body = (await request.json().catch(() => ({}))) as Partial<Pick<Agent, 'available'>>
    if (typeof body.available === 'boolean') agent.available = body.available
    commit()
    return HttpResponse.json(agent)
  })),

  // Analytics
  http.get('/api/analytics', secured(({ request }) => {
    const sp = new URL(request.url).searchParams
    const end = (sp.get('to') ? dayjs(sp.get('to')) : dayjs()).endOf('day')
    let start = (sp.get('from') ? dayjs(sp.get('from')) : end.subtract(29, 'day')).startOf('day')
    if (end.diff(start, 'day') > 366) start = end.subtract(366, 'day').startOf('day')
    if (start.isAfter(end)) return fail(422, 'The start date must be before the end date.')

    const inRange = (iso: string) => {
      const value = dayjs(iso)
      return !value.isBefore(start) && !value.isAfter(end)
    }
    const { tickets, agents } = getDb()
    const created = tickets.filter((ticket) => inRange(ticket.createdAt))
    const resolved = tickets.filter((ticket) => ticket.resolvedAt && inRange(ticket.resolvedAt))

    const buckets = new Map<string, { created: number; resolved: number }>()
    for (let day = start; !day.isAfter(end); day = day.add(1, 'day')) {
      buckets.set(day.format('YYYY-MM-DD'), { created: 0, resolved: 0 })
    }
    for (const ticket of created) buckets.get(dayjs(ticket.createdAt).format('YYYY-MM-DD'))!.created++
    for (const ticket of resolved) buckets.get(dayjs(ticket.resolvedAt!).format('YYYY-MM-DD'))!.resolved++

    const ratings = resolved.map((ticket) => ticket.csat).filter((value): value is number => value !== null)
    const average = (values: number[]) => (values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0)

    const report: AnalyticsReport = {
      totals: {
        created: created.length,
        resolved: resolved.length,
        avgResolutionHours: average(resolved.map((ticket) => (Date.parse(ticket.resolvedAt!) - Date.parse(ticket.createdAt)) / 3_600_000)),
        csat: average(ratings),
        ratings: ratings.length,
      },
      daily: [...buckets].map(([date, counts]) => ({ date, ...counts })),
      byChannel: TICKET_CHANNELS.map((channel) => ({ channel, count: created.filter((ticket) => ticket.channel === channel).length })),
      byPriority: TICKET_PRIORITIES.map((priority) => ({ priority, count: created.filter((ticket) => ticket.priority === priority).length })),
      byAgent: agents
        .map((agent) => {
          const mine = resolved.filter((ticket) => ticket.assigneeId === agent.id)
          return {
            agentId: agent.id,
            name: agent.name,
            resolved: mine.length,
            csat: average(mine.map((ticket) => ticket.csat).filter((value): value is number => value !== null)),
          }
        })
        .sort((a, b) => b.resolved - a.resolved),
    }
    return HttpResponse.json(report)
  })),
]
