import { DeleteOutlined } from '@ant-design/icons'
import { Button, Popconfirm, Tooltip } from 'antd'
import { useState, type ReactNode } from 'react'

interface RowDeleteButtonProps {
  /** Accessible name for the icon button, e.g. "Delete PS-1042". */
  label: string
  title: string
  description: ReactNode
  okText: string
  cancelText: string
  loading?: boolean
  showText?: boolean
  className?: string
  onConfirm: () => Promise<unknown> | void
}

/**
 * Icon button with a confirmation popover. While the confirmation is open the
 * hover tooltip is suppressed: otherwise it sits on top of the popover's own buttons.
 */
export function RowDeleteButton({ label, title, description, okText, cancelText, loading, showText = false, className, onConfirm }: RowDeleteButtonProps) {
  const [confirming, setConfirming] = useState(false)
  return (
    <Popconfirm
      open={confirming}
      onOpenChange={setConfirming}
      title={title}
      description={description}
      okText={okText}
      okButtonProps={{ danger: true }}
      cancelText={cancelText}
      placement="topRight"
      onConfirm={onConfirm}
    >
      <Tooltip title="Delete" open={confirming ? false : undefined}>
        <Button type="text" danger icon={<DeleteOutlined />} aria-label={label} loading={loading} className={className}>
          {showText ? 'Delete' : null}
        </Button>
      </Tooltip>
    </Popconfirm>
  )
}
