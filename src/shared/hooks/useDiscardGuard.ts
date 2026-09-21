import { App } from 'antd'
import { useCallback, useEffect, useState } from 'react'

interface DiscardGuardOptions {
  open: boolean
  onClose: () => void
  /** Ignore close attempts while a save is in flight. */
  busy?: boolean
  /** "ticket", "customer": used in the confirmation text. */
  noun: string
}

/**
 * Closing a drawer or modal with unsaved edits asks first.
 * Call `markDirty` from the form's onValuesChange and use `requestClose` for every way out.
 */
export function useDiscardGuard({ open, onClose, busy = false, noun }: DiscardGuardOptions) {
  const { modal } = App.useApp()
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    if (!open) setDirty(false)
  }, [open])

  const markDirty = useCallback(() => setDirty(true), [])

  const requestClose = () => {
    if (busy) return
    if (!dirty) return onClose()
    modal.confirm({
      title: 'Discard your changes?',
      content: `The edits you made to this ${noun} have not been saved.`,
      okText: 'Discard changes',
      okButtonProps: { danger: true },
      cancelText: 'Keep editing',
      onOk: onClose,
    })
  }

  return { dirty, markDirty, requestClose }
}
