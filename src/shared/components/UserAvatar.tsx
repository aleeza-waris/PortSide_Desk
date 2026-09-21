import { Avatar } from 'antd'
import { initials } from '@/shared/lib/format'

interface UserAvatarProps {
  name: string
  color: string
  size?: number
}

export function UserAvatar({ name, color, size = 28 }: UserAvatarProps) {
  return (
    // Colour and size are per-agent runtime values, so these two stay inline; the rest is utilities.
    <Avatar size={size} className="flex-none font-medium text-white" style={{ backgroundColor: color, fontSize: size * 0.4 }}>
      {initials(name)}
    </Avatar>
  )
}
