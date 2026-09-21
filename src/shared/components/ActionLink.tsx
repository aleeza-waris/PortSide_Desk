import { Typography } from 'antd'
import type { KeyboardEvent, ReactNode } from 'react'

interface ActionLinkProps {
  onActivate: () => void
  children: ReactNode
  className?: string
  title?: string
  style?: React.CSSProperties
}

/**
 * A text link that performs an action rather than navigating (opening an edit drawer).
 * antd's Typography.Link renders an <a> without href, which is not focusable and has
 * no role, so give it button semantics and Enter/Space activation.
 */
export function ActionLink({ onActivate, children, ...rest }: ActionLinkProps) {
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onActivate()
    }
  }
  return (
    <Typography.Link role="button" tabIndex={0} onClick={onActivate} onKeyDown={onKeyDown} {...rest}>
      {children}
    </Typography.Link>
  )
}
