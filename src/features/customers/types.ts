import type { SortOrder } from '@/shared/types'

export const CUSTOMER_PLANS = ['standard', 'priority', 'enterprise'] as const
export type CustomerPlan = (typeof CUSTOMER_PLANS)[number]

export const CUSTOMER_STATUSES = ['active', 'onboarding', 'paused'] as const
export type CustomerStatus = (typeof CUSTOMER_STATUSES)[number]

export const PLAN_LABEL: Record<CustomerPlan, string> = {
  standard: 'Standard',
  priority: 'Priority',
  enterprise: 'Enterprise',
}
export const CUSTOMER_STATUS_LABEL: Record<CustomerStatus, string> = {
  active: 'Active',
  onboarding: 'Onboarding',
  paused: 'Paused',
}

export const COUNTRIES = [
  'Australia', 'Brazil', 'Canada', 'France', 'Germany', 'Japan', 'Netherlands',
  'Singapore', 'South Korea', 'Spain', 'United Kingdom', 'United States',
] as const

export interface Customer {
  id: string
  /** Main contact */
  name: string
  email: string
  company: string
  country: string
  plan: CustomerPlan
  status: CustomerStatus
  /** Shipments booked per month */
  shipmentsPerMonth: number
  /** Monthly recurring revenue, USD */
  mrr: number
  notes: string
  createdAt: string
  lastContactAt: string | null
}

export interface CustomerRow extends Customer {
  openTickets: number
}

export type CustomerInput = Pick<
  Customer,
  'name' | 'email' | 'company' | 'country' | 'plan' | 'status' | 'shipmentsPerMonth' | 'mrr' | 'notes' | 'createdAt'
>

export type CustomerSortField = 'company' | 'plan' | 'status' | 'shipmentsPerMonth' | 'mrr' | 'createdAt' | 'openTickets'

export interface CustomerListParams {
  page: number
  pageSize: number
  sortField: CustomerSortField | null
  sortOrder: SortOrder | null
  q: string
  plan: CustomerPlan[]
  status: CustomerStatus[]
}

export interface CustomerOption {
  id: string
  name: string
  company: string
}
