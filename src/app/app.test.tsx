import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { renderApp } from '@/test/renderApp'

const dataRows = () => document.querySelectorAll('tbody tr.ant-table-row')

async function signIn(path = '/') {
  const app = renderApp(path)
  const user = userEvent.setup()
  await screen.findByRole('heading', { name: 'Sign in' })
  await user.click(screen.getByRole('button', { name: 'Sign in' })) // demo credentials are pre-filled
  return { ...app, user }
}

describe('protected area', () => {
  it('sends signed-out visitors to the login page', async () => {
    const { router } = renderApp('/tickets')
    await screen.findByRole('heading', { name: 'Sign in' })
    expect(router.state.location.pathname).toBe('/login')
  })

  it('returns you to the page you were heading for after signing in', async () => {
    const { router } = await signIn('/customers')
    await screen.findByRole('heading', { name: 'Customers' })
    expect(router.state.location.pathname).toBe('/customers')
  })

  it('shows the API message when the password is wrong', async () => {
    renderApp('/')
    const user = userEvent.setup()
    const password = await screen.findByLabelText('Password')
    await user.clear(password)
    await user.type(password, 'wrong')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))
    expect(await screen.findByText('That email and password do not match.')).toBeInTheDocument()
  })

  it('signs out from the account menu', async () => {
    const { user, router } = await signIn('/')
    await screen.findByText(/^Good (morning|afternoon|evening), Mara/)
    await user.click(screen.getByRole('button', { name: 'Account menu' }))
    await user.click(await screen.findByText('Sign out'))
    await screen.findByRole('heading', { name: 'Sign in' })
    expect(router.state.location.pathname).toBe('/login')
  })
})

describe('navigation', () => {
  it('moves between sections without leaving the app', async () => {
    const { user, router } = await signIn('/')
    await screen.findByText(/^Good (morning|afternoon|evening), Mara/)

    for (const [link, heading, path] of [
      ['Tickets', 'Tickets', '/tickets'],
      ['Customers', 'Customers', '/customers'],
      ['Analytics', 'Analytics', '/analytics'],
      ['Team', 'Team', '/team'],
    ] as const) {
      await user.click(screen.getByRole('link', { name: link }))
      await screen.findByRole('heading', { name: heading })
      expect(router.state.location.pathname).toBe(path)
    }
  })

  it('opens the Tickets page already filtered when an Overview tile is clicked', async () => {
    const { user, router, store } = await signIn('/')
    await user.click(await screen.findByRole('button', { name: /Overdue/ }))
    await screen.findByRole('heading', { name: 'Tickets' })
    expect(router.state.location.pathname).toBe('/tickets')
    expect(store.getState().tickets.params.overdue).toBe(true)
    expect(screen.getByRole('checkbox', { name: 'Overdue only' })).toBeChecked()
  })
})

describe('tickets', () => {
  it('lists, filters by search and clears the filter', async () => {
    const { user, store } = await signIn('/tickets')
    await waitFor(() => expect(dataRows()).toHaveLength(10))

    await user.type(screen.getByLabelText('Filter tickets by text'), 'PS-1240')
    await waitFor(() => expect(dataRows()).toHaveLength(1), { timeout: 4000 })
    expect(store.getState().tickets.params.q).toBe('PS-1240')

    await user.click(screen.getByRole('button', { name: 'Clear filters' }))
    await waitFor(() => expect(dataRows()).toHaveLength(10))
  })

  it('creates a ticket from the drawer, then edits and deletes it', async () => {
    const { user } = await signIn('/tickets')
    await waitFor(() => expect(dataRows()).toHaveLength(10))

    await user.click(screen.getByRole('button', { name: /New ticket/ }))
    const drawer = await screen.findByRole('dialog')

    // Validation comes first.
    await user.click(within(drawer).getByRole('button', { name: 'Save ticket' }))
    expect(await within(drawer).findByText('Add a subject so the team can find this ticket.')).toBeInTheDocument()

    await user.type(within(drawer).getByLabelText('Subject'), 'Reefer alarm on MSKU1234567')
    await user.click(within(drawer).getByLabelText('Customer'))
    await user.type(within(drawer).getByLabelText('Customer'), 'Alder')
    await user.click(await screen.findByTitle('Alder & Finch Textiles'))
    await user.type(within(drawer).getByLabelText('Description'), 'Temperature is above set point.')
    await user.click(within(drawer).getByRole('button', { name: 'Save ticket' }))

    expect(await screen.findByText('Ticket created')).toBeInTheDocument()
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())

    // Find it again and change it.
    await user.type(screen.getByLabelText('Filter tickets by text'), 'Reefer alarm')
    await waitFor(() => expect(dataRows()).toHaveLength(1), { timeout: 4000 })
    await user.click(screen.getByRole('button', { name: 'Reefer alarm on MSKU1234567' }))
    const editor = await screen.findByRole('dialog')
    const subject = within(editor).getByLabelText('Subject')
    await user.clear(subject)
    await user.type(subject, 'Reefer alarm resolved')
    await user.click(within(editor).getByRole('button', { name: 'Save ticket' }))
    expect(await screen.findByText('Ticket saved')).toBeInTheDocument()
    await waitFor(() => expect(screen.getByRole('button', { name: 'Reefer alarm resolved' })).toBeInTheDocument())

    // And remove it.
    await user.click(screen.getByRole('button', { name: /^Delete PS-/ }))
    await user.click(await screen.findByRole('button', { name: 'Delete ticket' }))
    expect(await screen.findByText('Ticket deleted')).toBeInTheDocument()
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Reefer alarm resolved' })).not.toBeInTheDocument())
  })

  it('asks before discarding unsaved edits', async () => {
    const { user } = await signIn('/tickets')
    await waitFor(() => expect(dataRows()).toHaveLength(10))
    await user.click(screen.getByRole('button', { name: /New ticket/ }))
    const drawer = await screen.findByRole('dialog')
    await user.type(within(drawer).getByLabelText('Subject'), 'half written')
    await user.click(within(drawer).getByRole('button', { name: 'Cancel' }))
    expect((await screen.findAllByText('Discard your changes?')).length).toBeGreaterThan(0)
    await user.click(screen.getByRole('button', { name: 'Keep editing' }))
    expect(within(drawer).getByLabelText('Subject')).toHaveValue('half written')
  })

  it('keeps the selection while paging', async () => {
    const { user, store } = await signIn('/tickets')
    await waitFor(() => expect(dataRows()).toHaveLength(10))
    const boxes = () => within(document.querySelector('tbody') as HTMLElement).getAllByRole('checkbox')
    await user.click(boxes()[0]!)
    await user.click(boxes()[1]!)
    expect(await screen.findByText('2 tickets selected')).toBeInTheDocument()

    await user.click(screen.getByTitle('2'))
    await waitFor(() => expect(store.getState().tickets.params.page).toBe(2))
    expect(store.getState().tickets.selectedIds).toHaveLength(2)
  })
})

describe('customers', () => {
  it('creates a customer in the modal, then deletes it', async () => {
    const { user } = await signIn('/customers')
    await waitFor(() => expect(dataRows()).toHaveLength(10))

    await user.click(screen.getByRole('button', { name: /New customer/ }))
    const modal = await screen.findByRole('dialog')
    await user.type(within(modal).getByLabelText('Company'), 'Zed Harbour Freight')
    await user.type(within(modal).getByLabelText('Main contact'), 'Zoe Adler')
    await user.type(within(modal).getByLabelText('Email'), 'zoe@zedharbour.com')
    await user.click(within(modal).getByRole('button', { name: 'Save customer' }))
    expect(await screen.findByText('Customer created')).toBeInTheDocument()
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())

    await user.type(screen.getByLabelText('Search customers'), 'Zed Harbour')
    await waitFor(() => expect(dataRows()).toHaveLength(1), { timeout: 4000 })
    await user.click(screen.getByRole('button', { name: 'Delete Zed Harbour Freight' }))
    await user.click(await screen.findByRole('button', { name: 'Delete customer' }))
    expect(await screen.findByText('Customer deleted')).toBeInTheDocument()
  })

  it('shows the server message when a customer still has open tickets', async () => {
    const { user } = await signIn('/customers')
    await waitFor(() => expect(dataRows()).toHaveLength(10))
    // First row of the alphabet that has open tickets: Alder & Finch may or may not, so sort by open tickets.
    const header = screen.getByRole('columnheader', { name: /Open tickets/ })
    await user.click(header)
    await user.click(header)
    await waitFor(() => {
      const first = dataRows()[0]!
      expect(within(first as HTMLElement).getByRole('button', { name: /open tickets for/ })).toBeInTheDocument()
    })
    const first = dataRows()[0] as HTMLElement
    await user.click(within(first).getByRole('button', { name: /^Delete / }))
    await user.click(await screen.findByRole('button', { name: 'Delete customer' }))
    expect(await screen.findByText(/still has \d+ open/)).toBeInTheDocument()
  })
})

describe('team and analytics', () => {
  it('toggles an agent’s availability', async () => {
    const { user } = await signIn('/team')
    await waitFor(() => expect(dataRows()).toHaveLength(7))
    const toggle = screen.getByRole('switch', { name: 'Tomasz Wrona is available' })
    expect(toggle).toBeChecked()
    await user.click(toggle)
    expect(await screen.findByText('Marked away')).toBeInTheDocument()
    await waitFor(() => expect(screen.getByRole('switch', { name: 'Tomasz Wrona is available' })).not.toBeChecked())
  })

  it('loads the analytics summary for the default range', async () => {
    await signIn('/analytics')
    expect(await screen.findByText('Tickets created')).toBeInTheDocument()
    await waitFor(() => expect(screen.getByText('Tickets resolved').closest('.ant-card')).toHaveTextContent(/\d+/))
  })
})
