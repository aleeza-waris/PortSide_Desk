export type SortOrder = 'ascend' | 'descend'

export interface Paged<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}

/** A calendar day in `YYYY-MM-DD` form. Dates in Redux stay strings so state remains serialisable. */
export type DayString = string
export type DayRange = [DayString, DayString]
