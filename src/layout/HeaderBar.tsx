import {
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  MoonOutlined,
  ReloadOutlined,
  SunOutlined,
} from '@ant-design/icons'
import { Button, Dropdown, Flex, Grid, Input, Layout, Switch, Typography } from 'antd'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { selectThemeMode, themeModeChanged } from '@/app/uiSlice'
import { selectCurrentUser } from '@/features/auth/authSlice'
import { filtersReplaced } from '@/features/tickets/ticketsSlice'
import { UserAvatar } from '@/shared/components/UserAvatar'
import { useSession } from './useSession'

interface HeaderBarProps {
  collapsed: boolean
  onToggleNav: () => void
}

export function HeaderBar({ collapsed, onToggleNav }: HeaderBarProps) {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const screens = Grid.useBreakpoint()
  const user = useAppSelector(selectCurrentUser)
  const themeMode = useAppSelector(selectThemeMode)
  const { signOut, resetDemoData } = useSession()

  /** Global search sends its text to the Tickets page through Redux. */
  const searchTickets = (searchText: string) => {
    dispatch(filtersReplaced({ q: searchText.trim() }))
    navigate('/tickets')
  }

  const toggleTheme = (isDark: boolean) => {
    dispatch(themeModeChanged(isDark ? 'dark' : 'light'))
  }

  return (
    <Layout.Header className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-line">
      <Flex align="center" gap={12} className="min-w-0">
        <Button
          type="text"
          aria-label={collapsed ? 'Open navigation' : 'Collapse navigation'}
          icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          onClick={onToggleNav}
        />
        {screens.md !== false && (
          <Input.Search
            allowClear
            className="w-[min(420px,38vw)]"
            placeholder="Search tickets by subject, customer or PS number"
            aria-label="Search all tickets"
            onSearch={searchTickets}
          />
        )}
      </Flex>

      <Flex align="center" gap={16}>
        <Switch
          checked={themeMode === 'dark'}
          onChange={toggleTheme}
          checkedChildren={<MoonOutlined />}
          unCheckedChildren={<SunOutlined />}
          aria-label="Dark mode"
        />
        {user && (
          <Dropdown
            trigger={['click']}
            placement="bottomRight"
            menu={{
              items: [
                {
                  key: 'who',
                  disabled: true,
                  label: (
                    <div>
                      <Typography.Text strong>{user.name}</Typography.Text>
                      <br />
                      <Typography.Text type="secondary">{user.email}</Typography.Text>
                    </div>
                  ),
                },
                { type: 'divider' },
                { key: 'reset', icon: <ReloadOutlined />, label: 'Reset demo data', onClick: resetDemoData },
                { key: 'signout', icon: <LogoutOutlined />, label: 'Sign out', onClick: signOut },
              ],
            }}
          >
            <Button type="text" className="inline-flex h-10 items-center gap-2 ps-1.5 pe-2.5" aria-label="Account menu">
              <UserAvatar name={user.name} color={user.avatarColor} size={28} />
              {screens.lg !== false && <span>{user.name}</span>}
            </Button>
          </Dropdown>
        )}
      </Flex>
    </Layout.Header>
  )
}
