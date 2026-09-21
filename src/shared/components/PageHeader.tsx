import { Flex, Typography } from 'antd'
import type { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  description?: ReactNode
  actions?: ReactNode
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <Flex justify="space-between" align="flex-start" gap={16} wrap className="mb-5">
      <div className="min-w-0">
        <Typography.Title level={3} className="m-0">
          {title}
        </Typography.Title>
        {description && (
          <Typography.Text type="secondary" className="mt-0.5 block">
            {description}
          </Typography.Text>
        )}
      </div>
      {actions && <Flex gap={8} wrap>{actions}</Flex>}
    </Flex>
  )
}
