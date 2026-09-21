import { Drawer, Grid, Layout } from 'antd'
import { useEffect, useState } from 'react'
import { Outlet, useLocation, useNavigation } from 'react-router-dom'
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
  const navigation = useNavigation()
  const location = useLocation()
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Below 768px the sider becomes a drawer; between 768 and 992px it starts collapsed to icons.
  const isPhone = screens.md === false

  useEffect(() => setDrawerOpen(false), [location.pathname])

  return (
    <Layout className="min-h-screen">
      {navigation.state === 'loading' && (
        <div
          className="fixed inset-x-0 top-0 z-[1100] h-0.5 origin-left animate-grow bg-brand motion-reduce:animate-none motion-reduce:scale-x-60"
          role="progressbar"
          aria-label="Loading page"
        />
      )}

      {isPhone ? (
        <Drawer
          placement="left"
          size={SIDER_WIDTH}
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          closable={false}
          classNames={{ body: 'p-0 bg-harbour', header: 'hidden' }}
        >
          <div className="flex h-14 items-center px-5">
            <Logo light />
          </div>
          <SiderMenu onNavigate={() => setDrawerOpen(false)} />
        </Drawer>
      ) : (
        <Layout.Sider
          className="sticky top-0 h-screen overflow-auto"
          width={SIDER_WIDTH}
          collapsedWidth={SIDER_COLLAPSED_WIDTH}
          collapsed={collapsed}
          breakpoint="lg"
          onCollapse={(next) => dispatch(siderCollapsedChanged(next))}
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
          collapsed={isPhone ? !drawerOpen : collapsed}
          onToggleNav={() => (isPhone ? setDrawerOpen((open) => !open) : dispatch(siderCollapsedChanged(!collapsed)))}
        />
        <Layout.Content className="p-6 max-[991px]:p-4">
          <div className="mx-auto w-full max-w-[1360px]">
            <Outlet />
          </div>
        </Layout.Content>
      </Layout>
    </Layout>
  )
}

export { AppLayout as Component }
