import { useCallback, useState } from 'react'

/**
 * Drop-in replacement for useState that persists the value in localStorage.
 * On read errors (private mode, quota exceeded), falls back to initialValue silently.
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T,
): [T, (value: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key)
      return item !== null ? (JSON.parse(item) as T) : initialValue
    } catch {
      return initialValue
    }
  })

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      setStoredValue((prev) => {
        const next = typeof value === 'function' ? (value as (prev: T) => T)(prev) : value
        try {
          window.localStorage.setItem(key, JSON.stringify(next))
        } catch {
          // quota exceeded or private mode — store in memory only
        }
        return next
      })
    },
    [key],
  )

  return [storedValue, setValue]
}
