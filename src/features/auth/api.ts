import { useMutation } from '@tanstack/react-query'
import { http } from '@/shared/lib/http'
import type { LoginRequest, LoginResponse } from './types'

export const useLogin = () =>
  useMutation({
    mutationFn: (credentials: LoginRequest) => http.post<LoginResponse>('/auth/login', credentials),
  })
