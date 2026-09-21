import { useEffect, useState } from 'react'

export function useDebouncedValue<T>(value: T, delay = 250): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debounced
}

/**
 * A text input backed by a committed value (here: a Redux filter).
 * Typing updates the box immediately and commits after a pause; when the committed
 * value changes from elsewhere (header search, "clear filters") the box follows.
 */
export function useDebouncedInput(committed: string, commit: (value: string) => void, delay = 300) {
  const [text, setText] = useState(committed)

  useEffect(() => setText(committed), [committed])

  useEffect(() => {
    if (text === committed) return
    const timer = setTimeout(() => commit(text), delay)
    return () => clearTimeout(timer)
    // `commit` is intentionally left out: callers pass a fresh closure every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, committed, delay])

  return [text, setText] as const
}
