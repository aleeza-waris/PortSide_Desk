import { Button, Col, DatePicker, Form, Input, InputNumber, Modal, Radio, Row, Select } from 'antd'
import type { Dayjs } from 'dayjs'
import { useEffect, useMemo, useState } from 'react'
import { useDiscardGuard } from '@/shared/hooks/useDiscardGuard'
import dayjs from '@/shared/lib/dayjs'
import { useCreateCustomer, useUpdateCustomer } from '../api'
import {
  COUNTRIES,
  CUSTOMER_PLANS,
  CUSTOMER_STATUSES,
  CUSTOMER_STATUS_LABEL,
  PLAN_LABEL,
  type CustomerInput,
  type CustomerPlan,
  type CustomerRow,
  type CustomerStatus,
} from '../types'

interface FormValues {
  company: string
  name: string
  email: string
  country: string
  plan: CustomerPlan
  status: CustomerStatus
  shipmentsPerMonth: number
  mrr: number
  createdAt: Dayjs
  notes: string
}

const FORM_ID = 'customer-form'

function initialValues(customer: CustomerRow | null): FormValues {
  if (!customer) {
    return {
      company: '',
      name: '',
      email: '',
      country: 'United States',
      plan: 'standard',
      status: 'onboarding',
      shipmentsPerMonth: 0,
      mrr: 0,
      createdAt: dayjs(),
      notes: '',
    }
  }
  return { ...customer, createdAt: dayjs(customer.createdAt) }
}

interface CustomerFormProps {
  customer: CustomerRow | null
  onDirty: () => void
  onSaving: (saving: boolean) => void
  onSaved: () => void
}

function CustomerForm({ customer, onDirty, onSaving, onSaved }: CustomerFormProps) {
  const [form] = Form.useForm<FormValues>()
  const create = useCreateCustomer()
  const update = useUpdateCustomer()
  const initial = useMemo(() => initialValues(customer), [customer])
  const saving = create.isPending || update.isPending

  useEffect(() => onSaving(saving), [saving, onSaving])

  const submit = (values: FormValues) => {
    const input: CustomerInput = {
      company: values.company.trim(),
      name: values.name.trim(),
      email: values.email.trim(),
      country: values.country,
      plan: values.plan,
      status: values.status,
      shipmentsPerMonth: values.shipmentsPerMonth ?? 0,
      mrr: values.mrr ?? 0,
      notes: values.notes?.trim() ?? '',
      createdAt: values.createdAt.toISOString(),
    }
    if (customer) update.mutate({ id: customer.id, input }, { onSuccess: onSaved })
    else create.mutate(input, { onSuccess: onSaved })
  }

  return (
    <Form<FormValues>
      id={FORM_ID}
      form={form}
      layout="vertical"
      initialValues={initial}
      onValuesChange={onDirty}
      onFinish={submit}
      disabled={saving}
    >
      <Row gutter={16}>
        <Col xs={24} sm={12}>
          <Form.Item label="Company" name="company" rules={[{ required: true, whitespace: true, message: 'Add the company name.' }]}>
            <Input autoFocus={!customer} placeholder="Brightwater Coffee Imports" />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item label="Main contact" name="name" rules={[{ required: true, whitespace: true, message: 'Add the name of the main contact.' }]}>
            <Input placeholder="Amelia Hartley" />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: 'Add the contact’s email address.' },
              { type: 'email', message: 'That does not look like an email address.' },
            ]}
          >
            <Input inputMode="email" placeholder="amelia@brightwater.com" />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item label="Country" name="country">
            <Select showSearch={{ optionFilterProp: 'label' }} options={COUNTRIES.map((value) => ({ value, label: value }))} />
          </Form.Item>
        </Col>
        <Col xs={24}>
          <Form.Item label="Plan" name="plan">
            <Radio.Group
              optionType="button"
              buttonStyle="solid"
              options={CUSTOMER_PLANS.map((value) => ({ value, label: PLAN_LABEL[value] }))}
            />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item label="Status" name="status">
            <Select options={CUSTOMER_STATUSES.map((value) => ({ value, label: CUSTOMER_STATUS_LABEL[value] }))} />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item label="Customer since" name="createdAt" rules={[{ required: true, message: 'Pick the date they signed up.' }]}>
            <DatePicker className="w-full" format="D MMM YYYY" allowClear={false} disabledDate={(day) => day.isAfter(dayjs(), 'day')} />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item label="Shipments per month" name="shipmentsPerMonth">
            <InputNumber min={0} precision={0} className="w-full" />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item label="Monthly revenue" name="mrr">
            <InputNumber min={0} precision={0} prefix="$" className="w-full" />
          </Form.Item>
        </Col>
        <Col xs={24}>
          <Form.Item label="Notes" name="notes">
            <Input.TextArea rows={3} placeholder="Preferred carrier, customs broker, anything the next agent should know." />
          </Form.Item>
        </Col>
      </Row>
    </Form>
  )
}

interface CustomerModalProps {
  open: boolean
  customer: CustomerRow | null
  onClose: () => void
}

export function CustomerModal({ open, customer, onClose }: CustomerModalProps) {
  const [saving, setSaving] = useState(false)
  const { markDirty, requestClose } = useDiscardGuard({ open, onClose, busy: saving, noun: 'customer' })

  useEffect(() => {
    if (!open) setSaving(false)
  }, [open])

  return (
    <Modal
      open={open}
      onCancel={requestClose}
      destroyOnHidden
      centered
      width="min(680px, calc(100vw - 32px))"
      title={customer ? `Edit ${customer.company}` : 'New customer'}
      mask={{ closable: false }}
      footer={
        <>
          <Button onClick={requestClose}>Cancel</Button>
          <Button type="primary" htmlType="submit" form={FORM_ID} loading={saving}>
            Save customer
          </Button>
        </>
      }
    >
      <CustomerForm customer={customer} onDirty={markDirty} onSaving={setSaving} onSaved={onClose} />
    </Modal>
  )
}
