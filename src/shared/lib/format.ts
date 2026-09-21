import dayjs from './dayjs'

export const DAY_FORMAT = 'YYYY-MM-DD'

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/)
  return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '')).toUpperCase()
}

const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
export const formatUsd = (value: number) => usd.format(value)

export const formatDateTime = (iso: string) => dayjs(iso).format('D MMM YYYY, HH:mm')
export const formatDate = (iso: string) => dayjs(iso).format('D MMM YYYY')

/** "3 hours ago" / "in 2 days" */
export const fromNow = (iso: string) => dayjs(iso).fromNow()

export function formatHours(hours: number): string {
  if (hours < 1) return `${Math.round(hours * 60)} min`
  if (hours < 48) return `${hours.toFixed(1)} h`
  return `${(hours / 24).toFixed(1)} days`
}

export function pluralize(count: number, singular: string, plural = `${singular}s`) {
  return `${count.toLocaleString('en-US')} ${count === 1 ? singular : plural}`
}
