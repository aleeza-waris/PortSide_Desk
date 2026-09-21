import { Drawer, Grid, Layout } from 'antd'
import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { selectSiderCollapsed, siderCollapsedChanged } from '@/app/uiSlice'
import { HeaderBar } from './HeaderBar'
import { Logo } from './Logo'
import { SiderMenu } from './SiderMenu'

const SIDER_WIDTH = 232
const SIDER_COLLAPSED_WIDTH = 72

export function AppLayout() {
  const dispatch = useAppDispatch()
  const collapsed = useAppSelector(selectSiderCollapsed)
  const screens = Grid.useBreakpoint()
  const location = useLocation()
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Below 768px the sider becomes a drawer; between 768 and 992px it starts collapsed to icons.
  const isPhoneScreen = screens.md === false

  const closeMobileNavigation = () => setDrawerOpen(false)
  const toggleNavigation = () => {
    if (isPhoneScreen) {
      setDrawerOpen((isOpen) => !isOpen)
      return
    }

    dispatch(siderCollapsedChanged(!collapsed))
  }

  useEffect(() => closeMobileNavigation(), [location.pathname])

  return (
    <Layout className="min-h-screen">
      {isPhoneScreen ? (
        <Drawer
          placement="left"
          size={SIDER_WIDTH}
          open={drawerOpen}
          onClose={closeMobileNavigation}
          closable={false}
          classNames={{ body: 'p-0 bg-harbour', header: 'hidden' }}
        >
          <div className="flex h-14 items-center px-5">
            <Logo light />
          </div>
          <SiderMenu onNavigate={closeMobileNavigation} />
        </Drawer>
      ) : (
        <Layout.Sider
          className="sticky top-0 h-screen overflow-auto"
          width={SIDER_WIDTH}
          collapsedWidth={SIDER_COLLAPSED_WIDTH}
          collapsed={collapsed}
          breakpoint="lg"
          onCollapse={(isCollapsed) => dispatch(siderCollapsedChanged(isCollapsed))}
          trigger={null}
        >
          <div className="flex h-14 items-center px-5">
            <Logo light compact={collapsed} />
          </div>
          <SiderMenu />
        </Layout.Sider>
      )}

      <Layout>
        <HeaderBar
          collapsed={isPhoneScreen ? !drawerOpen : collapsed}
          onToggleNav={toggleNavigation}
        />
        <Layout.Content className="p-6 max-[991px]:p-4 max-[575px]:p-3">
          <div className="mx-auto w-full max-w-[1360px]">
            <Outlet />
          </div>
        </Layout.Content>
      </Layout>
    </Layout>
  )
}
