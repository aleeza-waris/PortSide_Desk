import { Alert, Button } from 'antd'
import { ApiError } from '@/shared/lib/http'

interface QueryErrorProps {
  title: string
  error: unknown
  onRetry: () => void
}

export function QueryError({ title, error, onRetry }: QueryErrorProps) {
  return (
    <Alert
      type="error"
      showIcon
      title={title}
      description={error instanceof ApiError ? error.message : 'Try again in a moment.'}
      action={<Button size="small" onClick={onRetry}>Try again</Button>}
      className="mb-4"
    />
  )
}
