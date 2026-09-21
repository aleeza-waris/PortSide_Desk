import { BUOY } from '@/app/theme'

interface LogoProps {
  size?: number
  /** On the dark sider and login panel the wordmark is white. */
  light?: boolean
  /** Mark only, for the collapsed sider. */
  compact?: boolean
}

export function Logo({ size = 28, light = false, compact = false }: LogoProps) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${light ? 'text-white' : 'text-ink'}`}>
      <svg width={size} height={size} viewBox="0 0 32 32" role="img" aria-label="Portside Desk">
        <rect width="32" height="32" rx="7" fill={light ? '#1B4661' : '#0F2A3D'} />
        <rect x="6" y="9" width="9" height="7" fill="#1F7A8C" />
        <rect x="17" y="9" width="9" height="7" fill={BUOY} />
        <rect x="6" y="18" width="20" height="7" fill="#5FB3C2" />
      </svg>
      {!compact && <span className="text-[17px] font-semibold tracking-[-0.01em] whitespace-nowrap">Portside Desk</span>}
    </span>
  )
}
