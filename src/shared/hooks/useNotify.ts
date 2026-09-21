import { App } from 'antd'
import { useMemo, type ReactNode } from 'react'
import { ApiError } from '@/shared/lib/http'

/**
 * Consistent toasts. Copy convention: the toast repeats the verb on the button
 * that caused it ("Save ticket" → "Ticket saved").
 */
export function useNotify() {
  const { notification } = App.useApp()
  return useMemo(
    () => ({
      success: (title: string, description?: ReactNode) => notification.success({ title, description, placement: 'bottomRight' }),
      error: (error: unknown, title: string) =>
        notification.error({
          title,
          description: error instanceof ApiError ? error.message : 'Something unexpected happened. Try again in a moment.',
          placement: 'bottomRight',
        }),
    }),
    [notification],
  )
}
