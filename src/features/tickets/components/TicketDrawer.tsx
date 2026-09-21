import { Button, DatePicker, Drawer, Flex, Form, Input, Select } from 'antd'
import type { Dayjs } from 'dayjs'
import { useEffect, useMemo, useState } from 'react'
import { CustomerSelect } from '@/features/customers'
import { AgentSelect } from '@/features/team'
import { useDiscardGuard } from '@/shared/hooks/useDiscardGuard'
import dayjs from '@/shared/lib/dayjs'
import { useCreateTicket, useUpdateTicket } from '../api'
import {
  CHANNEL_LABEL,
  PRIORITY_LABEL,
  ref,
  STATUS_LABEL,
  TICKET_CHANNELS,
  TICKET_PRIORITIES,
  TICKET_STATUSES,
  type TicketChannel,
  type TicketInput,
  type TicketPriority,
  type TicketRow,
  type TicketStatus,
} from '../types'

interface FormValues {
  subject: string
  customerId: string
  status: TicketStatus
  priority: TicketPriority
  channel: TicketChannel
  assigneeId?: string
  dueAt: Dayjs | null
  tags: string[]
  description: string
}

const FORM_ID = 'ticket-form'

function initialValues(ticket: TicketRow | null): FormValues {
  if (!ticket) {
    return {
      subject: '',
      customerId: undefined as unknown as string, // required, so it starts empty
      status: 'open',
      priority: 'medium',
      channel: 'email',
      assigneeId: undefined,
      dueAt: dayjs().add(1, 'day').minute(0).second(0),
      tags: [],
      description: '',
    }
  }
  return {
    subject: ticket.subject,
    customerId: ticket.customerId,
    status: ticket.status,
    priority: ticket.priority,
    channel: ticket.channel,
    assigneeId: ticket.assigneeId ?? undefined,
    dueAt: ticket.dueAt ? dayjs(ticket.dueAt) : null,
    tags: ticket.tags,
    description: ticket.description,
  }
}

interface TicketFormProps {
  ticket: TicketRow | null
  onDirty: () => void
  onSaving: (saving: boolean) => void
  onSaved: () => void
}

/** Mounted only while the drawer is open, so every open starts from a clean form instance. */
function TicketForm({ ticket, onDirty, onSaving, onSaved }: TicketFormProps) {
  const [form] = Form.useForm<FormValues>()
  const create = useCreateTicket()
  const update = useUpdateTicket()
  const initial = useMemo(() => initialValues(ticket), [ticket])
  const saving = create.isPending || update.isPending

  useEffect(() => onSaving(saving), [saving, onSaving])

  const submit = (values: FormValues) => {
    const input: TicketInput = {
      subject: values.subject.trim(),
      description: values.description.trim(),
      status: values.status,
      priority: values.priority,
      channel: values.channel,
      customerId: values.customerId,
      assigneeId: values.assigneeId ?? null,
      tags: values.tags ?? [],
      dueAt: values.dueAt ? values.dueAt.toISOString() : null,
    }
    if (ticket) update.mutate({ id: ticket.id, input }, { onSuccess: onSaved })
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
      <Form.Item label="Subject" name="subject" rules={[{ required: true, whitespace: true, message: 'Add a subject so the team can find this ticket.' }]}>
        <Input maxLength={120} showCount placeholder="What does the customer need?" autoFocus={!ticket} />
      </Form.Item>

      <Form.Item label="Customer" name="customerId" rules={[{ required: true, message: 'Choose a customer for this ticket.' }]}>
        <CustomerSelect
          placeholder="Search by company or contact"
          selected={ticket ? { id: ticket.customer.id, name: ticket.customer.name, company: ticket.customer.company } : undefined}
        />
      </Form.Item>

      <Flex gap={16} wrap>
        <Form.Item label="Status" name="status" className="flex-[1_1_200px]">
          <Select options={TICKET_STATUSES.map((value) => ({ value, label: STATUS_LABEL[value] }))} />
        </Form.Item>
        <Form.Item label="Priority" name="priority" className="flex-[1_1_200px]">
          <Select options={TICKET_PRIORITIES.map((value) => ({ value, label: PRIORITY_LABEL[value] }))} />
        </Form.Item>
      </Flex>

      <Flex gap={16} wrap>
        <Form.Item label="Channel" name="channel" className="flex-[1_1_200px]">
          <Select options={TICKET_CHANNELS.map((value) => ({ value, label: CHANNEL_LABEL[value] }))} />
        </Form.Item>
        <Form.Item label="Assignee" name="assigneeId" className="flex-[1_1_200px]">
          <AgentSelect allowClear placeholder="Unassigned" />
        </Form.Item>
      </Flex>

      <Form.Item label="Due" name="dueAt" extra="The deadline the team works to. Leave empty for no deadline.">
        <DatePicker
          showTime={{ format: 'HH:mm', minuteStep: 5 }}
          format="D MMM YYYY, HH:mm"
          className="w-full"
          placeholder="Pick a date and time"
        />
      </Form.Item>

      <Form.Item label="Tags" name="tags">
        <Select mode="tags" tokenSeparators={[',']} open={false} placeholder="Type a tag and press Enter" suffixIcon={null} />
      </Form.Item>

      <Form.Item label="Description" name="description" rules={[{ required: true, whitespace: true, message: 'Describe what the customer needs.' }]}>
        <Input.TextArea rows={6} placeholder="Include booking numbers, container numbers and what has already been tried." />
      </Form.Item>
    </Form>
  )
}

interface TicketDrawerProps {
  open: boolean
  /** The ticket being edited, or null when creating one. */
  ticket: TicketRow | null
  onClose: () => void
}

export function TicketDrawer({ open, ticket, onClose }: TicketDrawerProps) {
  const [saving, setSaving] = useState(false)
  const { dirty, markDirty, requestClose } = useDiscardGuard({ open, onClose, busy: saving, noun: 'ticket' })

  useEffect(() => {
    if (!open) setSaving(false)
  }, [open])

  return (
    <Drawer
      open={open}
      onClose={requestClose}
      destroyOnHidden
      size="min(560px, 100vw)"
      title={ticket ? `Edit ${ref(ticket.number)}` : 'New ticket'}
      mask={{ closable: !dirty }}
      footer={
        <Flex justify="flex-end" gap={8}>
          <Button onClick={requestClose}>Cancel</Button>
          <Button type="primary" htmlType="submit" form={FORM_ID} loading={saving}>
            Save ticket
          </Button>
        </Flex>
      }
    >
      <TicketForm ticket={ticket} onDirty={markDirty} onSaving={setSaving} onSaved={onClose} />
    </Drawer>
  )
}
