import { theme as antTheme } from 'antd'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useAppSelector } from '@/app/hooks'
import { selectThemeMode } from '@/app/uiSlice'
import { CHANNEL_LABEL, PRIORITY_LABEL } from '@/features/tickets/types'
import dayjs from '@/shared/lib/dayjs'
import type { AnalyticsReport } from '../types'

function useChartColors() {
  const { token } = antTheme.useToken()
  const dark = useAppSelector(selectThemeMode) === 'dark'
  return {
    text: token.colorTextSecondary,
    grid: token.colorBorderSecondary,
    created: token.colorPrimary,
    resolved: dark ? '#F2B705' : '#B37D00',
    channels: dark ? ['#4FB3C4', '#8FD0DB', '#D9C7A0', '#7C9BB6'] : ['#1F7A8C', '#5FB3C2', '#C9B27F', '#3B5870'],
    priority: { low: dark ? '#8C98A4' : '#98A4AF', medium: '#597EF7', high: '#FA8C16', urgent: '#CF1322' },
    tooltip: {
      background: token.colorBgElevated,
      border: `1px solid ${token.colorBorderSecondary}`,
      borderRadius: 6,
      color: token.colorText,
      boxShadow: token.boxShadowSecondary,
    },
  }
}

/** Recharts paints legend text in the series colour; keep it in the normal text colour so it stays readable. */
const legendText = (color: string) => (value: string) => <span style={{ color }}>{value}</span>

interface ChartProps {
  report: AnalyticsReport
}

export function VolumeChart({ report }: ChartProps) {
  const c = useChartColors()
  const data = report.daily.map((day) => ({ ...day, label: dayjs(day.date).format('D MMM') }))
  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data} margin={{ top: 8, right: 12, left: -12, bottom: 0 }} accessibilityLayer>
        <defs>
          <linearGradient id="fillCreated" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={c.created} stopOpacity={0.28} />
            <stop offset="100%" stopColor={c.created} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={c.grid} vertical={false} />
        <XAxis dataKey="label" tick={{ fill: c.text, fontSize: 12 }} tickLine={false} axisLine={{ stroke: c.grid }} minTickGap={28} />
        <YAxis allowDecimals={false} tick={{ fill: c.text, fontSize: 12 }} tickLine={false} axisLine={false} />
        <Tooltip contentStyle={c.tooltip} />
        <Legend verticalAlign="top" align="right" height={32} iconType="plainline" formatter={legendText(c.text)} />
        <Area type="monotone" name="Created" dataKey="created" stroke={c.created} strokeWidth={2} fill="url(#fillCreated)" />
        <Area type="monotone" name="Resolved" dataKey="resolved" stroke={c.resolved} strokeWidth={2} fill="none" />
      </AreaChart>
    </ResponsiveContainer>
  )
}

export function ChannelChart({ report }: ChartProps) {
  const c = useChartColors()
  const data = report.byChannel.map((row) => ({ name: CHANNEL_LABEL[row.channel], value: row.count }))
  const total = data.reduce((sum, row) => sum + row.value, 0)
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart accessibilityLayer>
        <Pie data={total ? data : [{ name: 'No tickets', value: 1 }]} dataKey="value" nameKey="name" innerRadius={62} outerRadius={94} paddingAngle={total ? 2 : 0} stroke="none">
          {data.map((row, index) => (
            <Cell key={row.name} fill={total ? c.channels[index % c.channels.length] : c.grid} />
          ))}
        </Pie>
        {total > 0 && <Tooltip contentStyle={c.tooltip} />}
        <Legend verticalAlign="bottom" iconType="circle" formatter={legendText(c.text)} />
      </PieChart>
    </ResponsiveContainer>
  )
}

export function PriorityChart({ report }: ChartProps) {
  const c = useChartColors()
  const data = report.byPriority.map((row) => ({ priority: row.priority, name: PRIORITY_LABEL[row.priority], count: row.count }))
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }} accessibilityLayer>
        <CartesianGrid stroke={c.grid} vertical={false} />
        <XAxis dataKey="name" tick={{ fill: c.text, fontSize: 12 }} tickLine={false} axisLine={{ stroke: c.grid }} />
        <YAxis allowDecimals={false} tick={{ fill: c.text, fontSize: 12 }} tickLine={false} axisLine={false} />
        <Tooltip contentStyle={c.tooltip} cursor={{ fill: c.grid, opacity: 0.4 }} />
        <Bar dataKey="count" name="Tickets" radius={[4, 4, 0, 0]} maxBarSize={56}>
          {data.map((row) => (
            <Cell key={row.priority} fill={c.priority[row.priority]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

export function AgentChart({ report }: ChartProps) {
  const c = useChartColors()
  const data = report.byAgent.map((row) => ({ ...row, first: row.name.split(' ')[0] }))
  return (
    <ResponsiveContainer width="100%" height={Math.max(220, data.length * 40 + 30)}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 24, left: 8, bottom: 0 }} accessibilityLayer>
        <CartesianGrid stroke={c.grid} horizontal={false} />
        <XAxis type="number" allowDecimals={false} tick={{ fill: c.text, fontSize: 12 }} tickLine={false} axisLine={{ stroke: c.grid }} />
        <YAxis type="category" dataKey="first" width={72} tick={{ fill: c.text, fontSize: 13 }} tickLine={false} axisLine={false} />
        <Tooltip
          contentStyle={c.tooltip}
          cursor={{ fill: c.grid, opacity: 0.4 }}
          formatter={(value) => [value, 'Resolved']}
          labelFormatter={(_, payload) => {
            const row = payload?.[0]?.payload as (typeof data)[number] | undefined
            return row ? `${row.name}${row.csat ? `  ·  ${row.csat.toFixed(1)} rating` : ''}` : ''
          }}
        />
        <Bar dataKey="resolved" name="Resolved" fill={c.created} radius={[0, 4, 4, 0]} maxBarSize={22} />
      </BarChart>
    </ResponsiveContainer>
  )
}
