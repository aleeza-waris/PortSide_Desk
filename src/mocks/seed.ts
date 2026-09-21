/**
 * Deterministic seed data for Portside, an invented freight forwarder.
 * Customers are importers and exporters; tickets are the things that go wrong
 * between a booking and a delivery.
 */
import type { Customer, CustomerPlan, CustomerStatus } from '@/features/customers/types'
import type { Agent } from '@/features/team/types'
import type { Ticket, TicketChannel, TicketPriority, TicketStatus } from '@/features/tickets/types'

export interface DbState {
  agents: Agent[]
  customers: Customer[]
  tickets: Ticket[]
}

/** Every seeded agent signs in with this password. */
export const DEMO_PASSWORD = 'harbour'

const HOUR = 3_600_000
const DAY = 24 * HOUR

function mulberry32(seed: number) {
  let a = seed
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export const AGENTS: Agent[] = [
  { id: 'agt_mara', name: 'Mara Okonkwo', email: 'mara@portside.dev', role: 'admin', avatarColor: '#1F7A8C', available: true },
  { id: 'agt_tomasz', name: 'Tomasz Wrona', email: 'tomasz@portside.dev', role: 'agent', avatarColor: '#9A6414', available: true },
  { id: 'agt_priya', name: 'Priya Raman', email: 'priya@portside.dev', role: 'agent', avatarColor: '#4B4F9C', available: true },
  { id: 'agt_lucas', name: 'Lucas Ferreira', email: 'lucas@portside.dev', role: 'agent', avatarColor: '#A34E3C', available: false },
  { id: 'agt_aiko', name: 'Aiko Tanaka', email: 'aiko@portside.dev', role: 'agent', avatarColor: '#4F7A3F', available: true },
  { id: 'agt_daniel', name: 'Daniel Osei', email: 'daniel@portside.dev', role: 'admin', avatarColor: '#7A4A6B', available: true },
  { id: 'agt_sofia', name: 'Sofia Marchetti', email: 'sofia@portside.dev', role: 'agent', avatarColor: '#4A5F7A', available: false },
]

const COMPANIES: [string, string][] = [
  ['Alder & Finch Textiles', 'United Kingdom'], ['Brightwater Coffee Imports', 'United States'],
  ['Calloway Auto Parts', 'United States'], ['Dunmore Furniture', 'United Kingdom'],
  ['Eastgate Electronics', 'Singapore'], ['Fenwick Foods', 'Australia'],
  ['Goldcrest Toys', 'Germany'], ['Harlow Medical Supply', 'Canada'],
  ['Ironbark Timber', 'Australia'], ['Juniper Home Goods', 'United States'],
  ['Kestrel Outdoor Gear', 'Canada'], ['Larkspur Flowers', 'Netherlands'],
  ['Meridian Tiles', 'Spain'], ['Northfield Bicycles', 'Netherlands'],
  ['Oakmont Wines', 'France'], ['Pelham Paper', 'United Kingdom'],
  ['Quillon Cables', 'Germany'], ['Redfern Ceramics', 'United Kingdom'],
  ['Saltmarsh Seafood', 'Japan'], ['Thornbury Tools', 'United States'],
  ['Umber & Oak Interiors', 'Australia'], ['Vantage Solar', 'Spain'],
  ['Wexford Wool', 'United Kingdom'], ['Yarrow Botanicals', 'France'],
  ['Zephyr Drones', 'Japan'], ['Ashgrove Bakeware', 'United States'],
  ['Bellweather Audio', 'Germany'], ['Cinder & Salt Cookware', 'Canada'],
  ['Driftwood Surf Co.', 'Brazil'], ['Emberline Candles', 'United States'],
  ['Foxglove Cosmetics', 'France'], ['Granite Peak Climbing', 'Canada'],
  ['Halcyon Bikes', 'Netherlands'], ['Inkwell Stationers', 'United Kingdom'],
  ['Jasper Lighting', 'South Korea'], ['Kindling Outdoor', 'United States'],
  ['Lumen Optics', 'Singapore'], ['Marlow Marine Supply', 'Australia'],
  ['Nettle & Rye Provisions', 'United Kingdom'], ['Orchard Row Cider', 'Spain'],
]

const FIRST = ['Amelia', 'Noah', 'Ines', 'Kenji', 'Farah', 'Oliver', 'Marta', 'Leon', 'Grace', 'Rafael', 'Hana', 'Callum', 'Zara', 'Mateo', 'Freya', 'Andre', 'Yuki', 'Nadia', 'Felix', 'Imogen']
const LAST = ['Hartley', 'Brandt', 'Moreau', 'Sato', 'Haddad', 'Whitcombe', 'Kowalska', 'Vogel', 'Adeyemi', 'Costa', 'Nakamura', 'Fraser', 'Qureshi', 'Ortega', 'Lindqvist', 'Bauer', 'Ito', 'Petrov', 'Delaney', 'Marsh']

const PORTS = ['Rotterdam', 'Felixstowe', 'Hamburg', 'Singapore', 'Savannah', 'Long Beach', 'Antwerp', 'Busan', 'Santos', 'Melbourne', 'Valencia', 'Vancouver']

interface Template {
  subject: string
  body: string
  tags: string[]
}

const TEMPLATES: Template[] = [
  { subject: 'Container held at customs in {port}', body: 'Container {cont} was flagged for inspection at {port}. We have no reason or release date. Please chase the broker and tell us which documents are missing.', tags: ['customs'] },
  { subject: 'Tracking has not updated in {n} days', body: 'Booking {ref} shows the same status it did {n} days ago. The vessel should have sailed. Can you confirm the cargo is on board?', tags: ['tracking'] },
  { subject: 'Invoice total does not match the quote', body: 'The invoice for {ref} is higher than the quote we accepted. Please send a breakdown of the extra charges.', tags: ['billing'] },
  { subject: 'Damaged pallets on delivery', body: 'Several pallets from {ref} arrived crushed at the warehouse. We have photos and the driver signed for a damaged delivery. How do we start a claim?', tags: ['damage', 'claims'] },
  { subject: 'Change delivery address on booking {ref}', body: 'The consignee has moved warehouses. Please update the final delivery address before the container is released.', tags: ['booking'] },
  { subject: 'Vessel ETA has moved again', body: 'The ETA for {ref} into {port} has slipped a third time. We have a production line waiting on this cargo and need a firm date.', tags: ['tracking'] },
  { subject: 'Cannot download the bill of lading', body: 'The download button for the bill of lading on {ref} does nothing. Our bank needs the document today.', tags: ['documents', 'portal'] },
  { subject: 'Disputed demurrage charge at {port}', body: 'We were charged demurrage on {cont} but the terminal was closed for two of those days. Please review and reverse the charge.', tags: ['billing', 'customs'] },
  { subject: 'Add a second consignee to booking {ref}', body: 'Half of this shipment now goes to a different buyer. Can we add a second consignee without rebooking?', tags: ['booking', 'documents'] },
  { subject: 'Reefer temperature alert on {cont}', body: 'The tracker shows the reefer above set point for the last few hours. The cargo is perishable. Please escalate to the carrier.', tags: ['reefer'] },
  { subject: 'Portal login keeps failing', body: 'Two people on our team get an invalid credentials error even after resetting the password.', tags: ['portal'] },
  { subject: 'Need a customs pre-clearance letter', body: 'The importer of record has asked for a pre-clearance letter for {ref}. Can you issue one today?', tags: ['customs', 'documents'] },
  { subject: 'Wrong HS code on the commercial invoice', body: 'The HS code on the invoice for {ref} is for finished goods, but this is a component shipment. It needs correcting before arrival.', tags: ['customs', 'documents'] },
  { subject: 'Cargo insurance certificate needed', body: 'Our lender needs a cargo insurance certificate naming them as loss payee for {ref}.', tags: ['documents', 'insurance'] },
  { subject: 'Trucker missed the pickup window', body: 'The trucker never arrived for the 09:00 pickup and is not answering. The container is now accruing storage fees.', tags: ['trucking'] },
  { subject: 'Quote request: LCL to {port}', body: 'We have about 6 cubic metres a month to {port}. Can you quote LCL rates and transit times?', tags: ['quote'] },
  { subject: 'Container missing after transshipment at {port}', body: 'Container {cont} was discharged at {port} for transshipment and has not been seen since. Please locate it.', tags: ['tracking'] },
  { subject: 'Status webhooks stopped arriving', body: 'Our system has not received a status webhook since yesterday morning. Nothing changed on our side.', tags: ['api'] },
  { subject: 'Can we split the shipment across two vessels?', body: 'Only part of the cargo is ready. Is it possible to ship what we have now and the rest on the next sailing under one booking?', tags: ['booking'] },
  { subject: 'Free time extension at {port}', body: 'Customs is slow this week. Can you ask the carrier for three extra days of free time on {cont}?', tags: ['billing'] },
]

function makeSeed(now: number): DbState {
  const rand = mulberry32(20260920)
  const pick = <T,>(items: readonly T[]): T => items[Math.floor(rand() * items.length)]!
  const between = (min: number, max: number) => min + rand() * (max - min)
  const roundTo = (value: number, step: number) => Math.round(value / step) * step
  const weighted = <T,>(entries: readonly (readonly [T, number])[]): T => {
    let roll = rand() * entries.reduce((sum, [, weight]) => sum + weight, 0)
    for (const [value, weight] of entries) {
      roll -= weight
      if (roll <= 0) return value
    }
    return entries[entries.length - 1]![0]
  }

  const customers: Customer[] = COMPANIES.map(([company, country], index) => {
    const first = FIRST[index % FIRST.length]!
    const last = LAST[(index * 7 + 3) % LAST.length]!
    const plan = weighted<CustomerPlan>([['standard', 50], ['priority', 32], ['enterprise', 18]])
    const status = weighted<CustomerStatus>([['active', 80], ['onboarding', 12], ['paused', 8]])
    const [mrrMin, mrrMax] = { standard: [400, 1800], priority: [1800, 5500], enterprise: [6000, 22000] }[plan]
    const [volMin, volMax] = { standard: [5, 40], priority: [30, 150], enterprise: [120, 600] }[plan]
    const domain = company.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '') + '.com'
    return {
      id: `cus_${String(index + 1).padStart(3, '0')}`,
      name: `${first} ${last}`,
      email: `${first.toLowerCase()}.${last.toLowerCase()}@${domain}`,
      company,
      country,
      plan,
      status,
      shipmentsPerMonth: Math.round(between(volMin, volMax)),
      mrr: status === 'onboarding' ? 0 : roundTo(between(mrrMin, mrrMax), 50),
      notes: '',
      createdAt: new Date(now - between(30, 900) * DAY).toISOString(),
      lastContactAt: rand() < 0.85 ? new Date(now - between(0, 60) * DAY).toISOString() : null,
    }
  })

  const slaHours: Record<TicketPriority, number> = { urgent: 8, high: 36, medium: 96, low: 168 }
  const tickets: Ticket[] = []

  for (let i = 0; i < 240; i++) {
    // Skew towards recent days, and mostly skip weekends.
    let created = now - Math.pow(rand(), 1.5) * 90 * DAY
    for (let attempt = 0; attempt < 4; attempt++) {
      const weekday = new Date(created).getDay()
      if ((weekday === 0 || weekday === 6) && rand() < 0.75) created -= 2 * DAY
      else break
    }
    const createdDate = new Date(created)
    createdDate.setHours(Math.floor(between(7, 19)), Math.floor(between(0, 60)), 0, 0)
    created = Math.min(createdDate.getTime(), now - 20 * 60_000)

    const ageDays = (now - created) / DAY
    // Old tickets are finished: a real desk does not leave three-month-old tickets open.
    const status: TicketStatus =
      ageDays < 3
        ? weighted<TicketStatus>([['open', 55], ['pending', 35], ['resolved', 10]])
        : ageDays < 10
          ? weighted<TicketStatus>([['open', 9], ['pending', 17], ['resolved', 52], ['closed', 22]])
          : weighted<TicketStatus>([['resolved', 50], ['closed', 50]])

    const priority = weighted<TicketPriority>([['low', 22], ['medium', 40], ['high', 28], ['urgent', 10]])
    const channel = weighted<TicketChannel>([['email', 45], ['chat', 22], ['portal', 20], ['phone', 13]])
    const template = pick(TEMPLATES)
    const customer = pick(customers)
    const fill = (text: string) =>
      text
        .replace(/\{port\}/g, pick(PORTS))
        .replace(/\{n\}/g, String(Math.floor(between(3, 9))))
        .replace(/\{ref\}/g, `PSB-${Math.floor(between(40000, 59999))}`)
        .replace(/\{cont\}/g, `MSKU${Math.floor(between(1000000, 9999999))}`)

    const isDone = status === 'resolved' || status === 'closed'
    const dueAt = created + slaHours[priority] * HOUR
    const resolvedAt = isDone ? Math.min(created + between(0.3, 1.6) * slaHours[priority] * HOUR, now - 5 * 60_000) : null
    const assigned = !(status === 'open' && ageDays < 3 && rand() < 0.4)

    tickets.push({
      id: `tkt_${String(i + 1).padStart(4, '0')}`,
      number: 0, // assigned after sorting
      subject: fill(template.subject),
      description: fill(template.body),
      status,
      priority,
      channel,
      customerId: customer.id,
      assigneeId: assigned ? pick(AGENTS).id : null,
      tags: template.tags,
      dueAt: new Date(dueAt).toISOString(),
      createdAt: new Date(created).toISOString(),
      updatedAt: new Date(resolvedAt ?? Math.min(now, created + between(0.1, 1) * (now - created))).toISOString(),
      resolvedAt: resolvedAt === null ? null : new Date(resolvedAt).toISOString(),
      csat: isDone && rand() < 0.55 ? weighted([[5, 45], [4, 30], [3, 15], [2, 6], [1, 4]] as const) : null,
    })
  }

  tickets.sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  tickets.forEach((ticket, index) => {
    ticket.number = 1001 + index
  })

  return { agents: AGENTS.map((agent) => ({ ...agent })), customers, tickets }
}

export function createSeed(now = Date.now()): DbState {
  return makeSeed(now)
}
