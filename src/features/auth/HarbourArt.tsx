/** Stacked containers on a waterline. Purely decorative, so it is hidden from assistive tech. */

interface Box {
  x: number
  y: number
  fill: string
}

const W = 100
const H = 42
const STEP = 104

const TEAL = '#1F7A8C'
const SEA = '#5FB3C2'
const SAND = '#D9C7A0'
const RUST = '#B4553B'
const SLATE = '#3B5870'

const boxes: Box[] = [
  ...[TEAL, SAND, SLATE, RUST].map((fill, i) => ({ x: 24 + i * STEP, y: 262, fill })),
  ...[SEA, TEAL, SAND].map((fill, i) => ({ x: 76 + i * STEP, y: 216, fill })),
  ...[RUST, SEA].map((fill, i) => ({ x: 128 + i * STEP, y: 170, fill })),
  { x: 180, y: 124, fill: SLATE },
]

export function HarbourArt({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 460 380" role="presentation" aria-hidden="true" focusable="false" overflow="visible">
      <defs>
        <pattern id="ribs" width="6" height="6" patternUnits="userSpaceOnUse">
          <rect width="6" height="6" fill="none" />
          <rect x="4" width="1.4" height="6" fill="#000" opacity="0.16" />
        </pattern>
      </defs>
      {boxes.map((box) => (
        <g key={`${box.x}-${box.y}`}>
          <rect x={box.x} y={box.y} width={W} height={H} fill={box.fill} />
          <rect x={box.x} y={box.y} width={W} height={H} fill="url(#ribs)" />
          <rect x={box.x + W - 12} y={box.y} width="12" height={H} fill="#000" opacity="0.14" />
        </g>
      ))}
      <rect x="-800" y="316" width="800" height="200" fill="#163A52" />
      <rect x="460" y="316" width="800" height="200" fill="#163A52" />
      <rect x="-800" y="340" width="800" height="200" fill="#1B4661" />
      <rect x="460" y="340" width="800" height="200" fill="#1B4661" />
      <path d="M0 316 C 60 302 110 330 170 316 S 290 302 350 316 S 430 330 460 316 V520 H0Z" fill="#163A52" />
      <path d="M0 340 C 70 326 120 352 190 338 S 300 326 370 340 S 440 350 460 340 V520 H0Z" fill="#1B4661" />
    </svg>
  )
}
