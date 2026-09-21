import { Select, type SelectProps } from 'antd'
import { useMemo, useState } from 'react'
import { useDebouncedValue } from '@/shared/hooks/useDebounce'
import { useCustomerOptions } from '../api'
import type { CustomerOption } from '../types'

interface CustomerSelectProps extends Omit<SelectProps<string>, 'options' | 'loading' | 'onSearch' | 'filterOption'> {
  /** The currently selected customer, so its label shows before (or without) it appearing in search results. */
  selected?: CustomerOption
}

/** Searches customers on the server as you type. Works as an antd Form field (value/onChange). */
export function CustomerSelect({ selected, ...props }: CustomerSelectProps) {
  const [search, setSearch] = useState('')
  const debounced = useDebouncedValue(search.trim(), 250)
  const { data, isFetching } = useCustomerOptions(debounced)

  const options = useMemo(() => {
    const list = data ?? []
    const merged = selected && !list.some((option) => option.id === selected.id) ? [selected, ...list] : list
    return merged.map((option) => ({ value: option.id, label: option.company, contact: option.name }))
  }, [data, selected])

  return (
    <Select<string>
      showSearch={{ filterOption: false, onSearch: setSearch }}
      loading={isFetching}
      options={options}
      optionRender={(option) => (
        <div>
          <div>{option.label}</div>
          <div className="text-xs opacity-65">{option.data.contact}</div>
        </div>
      )}
      notFoundContent={isFetching ? 'Searching…' : 'No customers match that search'}
      {...props}
    />
  )
}
