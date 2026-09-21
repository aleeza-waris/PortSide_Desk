import { Badge, Tag } from 'antd'
import { CUSTOMER_STATUS_LABEL, PLAN_LABEL, type CustomerPlan, type CustomerStatus } from '../types'

const PLAN_COLOR: Record<CustomerPlan, string> = { standard: 'default', priority: 'blue', enterprise: 'purple' }
const STATUS_BADGE: Record<CustomerStatus, 'success' | 'processing' | 'default'> = {
  active: 'success',
  onboarding: 'processing',
  paused: 'default',
}

export const PlanTag = ({ plan }: { plan: CustomerPlan }) => (
  <Tag color={PLAN_COLOR[plan]} variant="filled" className="me-0">
    {PLAN_LABEL[plan]}
  </Tag>
)

export const CustomerStatusBadge = ({ status }: { status: CustomerStatus }) => (
  <Badge status={STATUS_BADGE[status]} text={CUSTOMER_STATUS_LABEL[status]} />
)
