import { LockOutlined, MailOutlined } from '@ant-design/icons'
import { Alert, Button, Form, Input, Typography } from 'antd'
import { Navigate, useLocation } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { Logo } from '@/layout/Logo'
import { useLogin } from './api'
import { signedIn, selectIsAuthenticated } from './authSlice'
import { HarbourArt } from './HarbourArt'
import type { LoginRequest } from './types'

interface LocationState {
  from?: { pathname: string; search?: string }
}

export function LoginPage() {
  const dispatch = useAppDispatch()
  const isAuthenticated = useAppSelector(selectIsAuthenticated)
  const location = useLocation()
  const login = useLogin()

  const from = (location.state as LocationState | null)?.from
  const destination = from ? `${from.pathname}${from.search ?? ''}` : '/'

  // Also covers "already signed in and opened /login": one redirect path for both cases.
  if (isAuthenticated) return <Navigate to={destination} replace />

  return (
    <div className="grid min-h-screen bg-surface min-[900px]:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
      <aside className="relative hidden flex-col justify-between gap-8 overflow-hidden bg-harbour px-12 pt-10 text-white min-[900px]:flex">
        <Logo size={30} light />
        <div>
          <h1 className="mb-3 max-w-[15em] text-[clamp(26px,3.2vw,38px)] leading-[1.18] font-semibold tracking-[-0.015em] text-white">
            Every late container has a customer waiting on an answer.
          </h1>
          <p className="m-0 max-w-[28em] text-base leading-normal text-white/70">Portside Desk is where the support team answers them.</p>
        </div>
        <HarbourArt className="mx-auto mt-auto block w-[min(100%,560px)]" />
      </aside>

      <main className="grid place-items-center px-6 py-8">
        <div className="w-full max-w-[380px]">
          <div className="mb-7 min-[900px]:hidden">
            <Logo size={28} />
          </div>
          <Typography.Title level={2} className="mt-0 mb-1">
            Sign in
          </Typography.Title>
          <Typography.Paragraph type="secondary">Use your Portside team account.</Typography.Paragraph>

          {login.isError && (
            <Alert type="error" showIcon title={login.error.message} className="mb-4" />
          )}

          <Form<LoginRequest>
            layout="vertical"
            requiredMark={false}
            initialValues={{ email: 'mara@portside.dev', password: 'harbour' }}
            onFinish={(values) => login.mutate(values, { onSuccess: (session) => dispatch(signedIn(session)) })}
          >
            <Form.Item
              label="Email"
              name="email"
              rules={[
                { required: true, message: 'Enter your email address.' },
                { type: 'email', message: 'That does not look like an email address.' },
              ]}
            >
              <Input size="large" prefix={<MailOutlined />} autoComplete="username" placeholder="you@portside.dev" />
            </Form.Item>
            <Form.Item label="Password" name="password" rules={[{ required: true, message: 'Enter your password.' }]}>
              <Input.Password size="large" prefix={<LockOutlined />} autoComplete="current-password" />
            </Form.Item>
            <Button type="primary" htmlType="submit" size="large" block loading={login.isPending}>
              Sign in
            </Button>
          </Form>

          {/* <Typography.Paragraph type="secondary" className="mt-6 text-[13px] leading-[1.55]">
            This is a demo running on a mock API. The account above is filled in for you, and any teammate
            (tomasz@, priya@, aiko@ and so on, all at portside.dev) signs in with the password <code className="font-mono">harbour</code>.
          </Typography.Paragraph> */}
        </div>
      </main>
    </div>
  )
}
