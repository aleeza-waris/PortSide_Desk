import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch } from '@/app/hooks'
import { signedOut } from '@/features/auth/authSlice'
import { filtersCleared as customerFiltersCleared } from '@/features/customers/customersSlice'
import { filtersCleared as ticketFiltersCleared } from '@/features/tickets/ticketsSlice'
import { useNotify } from '@/shared/hooks/useNotify'
import { http } from '@/shared/lib/http'

export function useSession() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const notify = useNotify()

  const signOut = () => {
    dispatch(signedOut())
    queryClient.clear()
    navigate('/login', { replace: true })
  }

  const resetDemoData = async () => {
    try {
      await http.post('/dev/reset')
      dispatch(ticketFiltersCleared())
      dispatch(customerFiltersCleared())
      await queryClient.invalidateQueries()
      notify.success('Demo data reset', 'Tickets, customers and the team are back to how they started.')
    } catch (error) {
      notify.error(error, 'Could not reset the demo data')
    }
  }

  return { signOut, resetDemoData }
}
