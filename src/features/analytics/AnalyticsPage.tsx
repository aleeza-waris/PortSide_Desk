import { Card, Col, DatePicker, Row, Statistic } from 'antd'
import type { Dayjs } from 'dayjs'
import { useMemo } from 'react'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { PageHeader } from '@/shared/components/PageHeader'
import { QueryError } from '@/shared/components/QueryError'
import dayjs from '@/shared/lib/dayjs'
import { DAY_FORMAT, formatHours } from '@/shared/lib/format'
import { useAnalytics } from './api'
import { rangeChanged, selectAnalyticsRange } from './analyticsSlice'
import { AgentChart, ChannelChart, PriorityChart, VolumeChart } from './components/Charts'

export function AnalyticsPage() {
  const dispatch = useAppDispatch()
  const range = useAppSelector(selectAnalyticsRange)
  const { data, isLoading, isError, error, refetch } = useAnalytics(range)

  const presets = useMemo(
    () => [
      { label: 'Last 7 days', value: [dayjs().subtract(6, 'day'), dayjs()] as [Dayjs, Dayjs] },
      { label: 'Last 30 days', value: [dayjs().subtract(29, 'day'), dayjs()] as [Dayjs, Dayjs] },
      { label: 'Last 90 days', value: [dayjs().subtract(89, 'day'), dayjs()] as [Dayjs, Dayjs] },
      { label: 'This month', value: [dayjs().startOf('month'), dayjs()] as [Dayjs, Dayjs] },
    ],
    [],
  )

  const kpis = [
    { title: 'Tickets created', value: data?.totals.created },
    { title: 'Tickets resolved', value: data?.totals.resolved },
    { title: 'Average time to resolve', value: data ? (data.totals.resolved ? formatHours(data.totals.avgResolutionHours) : '–') : undefined },
    {
      title: 'Customer rating',
      value: data ? (data.totals.ratings ? `${data.totals.csat.toFixed(2)} / 5` : '–') : undefined,
      note: data?.totals.ratings ? `from ${data.totals.ratings} ratings` : undefined,
    },
  ]

  return (
    <>
      <PageHeader
        title="Analytics"
        description="How the desk is doing over the period you pick."
        actions={
          <DatePicker.RangePicker
            allowClear={false}
            format="D MMM YYYY"
            presets={presets}
            value={[dayjs(range[0]), dayjs(range[1])]}
            disabledDate={(day) => day.isAfter(dayjs(), 'day')}
            onChange={(next) => next?.[0] && next[1] && dispatch(rangeChanged([next[0].format(DAY_FORMAT), next[1].format(DAY_FORMAT)]))}
          />
        }
      />

      {isError && <QueryError title="Could not load analytics" error={error} onRetry={() => void refetch()} />}

      <Row gutter={[16, 16]}>
        {kpis.map((kpi) => (
          <Col key={kpi.title} xs={12} lg={6}>
            <Card className="h-full">
              <Statistic title={kpi.title} value={kpi.value} loading={isLoading} classNames={{ content: 'font-semibold' }} />
              {kpi.note && <span className="text-[12.5px] opacity-65">{kpi.note}</span>}
            </Card>
          </Col>
        ))}

        <Col xs={24}>
          <Card title="Tickets created and resolved, per day" loading={isLoading}>
            {data && <VolumeChart report={data} />}
          </Card>
        </Col>
        <Col xs={24} md={12} xl={8}>
          <Card title="Where tickets come from" loading={isLoading} className="h-full">
            {data && <ChannelChart report={data} />}
          </Card>
        </Col>
        <Col xs={24} md={12} xl={8}>
          <Card title="Created by priority" loading={isLoading} className="h-full">
            {data && <PriorityChart report={data} />}
          </Card>
        </Col>
        <Col xs={24} xl={8}>
          <Card title="Resolved per agent" loading={isLoading} className="h-full">
            {data && <AgentChart report={data} />}
          </Card>
        </Col>
      </Row>
    </>
  )
}
