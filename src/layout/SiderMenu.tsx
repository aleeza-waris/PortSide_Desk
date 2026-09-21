import { Menu } from 'antd'
import { Link, useLocation } from 'react-router-dom'
import { activePath, NAV_ITEMS } from './navigation'

/** A buoy-yellow tick inside the left edge of the selected item: the one place the accent colour appears in the chrome. */
const SELECTED_TICK = [
  '[&_.ant-menu-item-selected]:relative',
  "[&_.ant-menu-item-selected]:before:absolute [&_.ant-menu-item-selected]:before:content-['']",
  '[&_.ant-menu-item-selected]:before:inset-y-2.5 [&_.ant-menu-item-selected]:before:start-0',
  '[&_.ant-menu-item-selected]:before:w-[3px] [&_.ant-menu-item-selected]:before:rounded-[3px]',
  '[&_.ant-menu-item-selected]:before:bg-buoy',
].join(' ')

export function SiderMenu({ onNavigate }: { onNavigate?: () => void }) {
  const { pathname } = useLocation()
  return (
    <Menu
      className={SELECTED_TICK}
      theme="dark"
      mode="inline"
      selectedKeys={[activePath(pathname)]}
      onClick={onNavigate}
      items={NAV_ITEMS.map((item) => ({
        key: item.path,
        icon: item.icon,
        // Real links: middle-click, copy address and keyboard navigation all work.
        label: <Link to={item.path}>{item.label}</Link>,
      }))}
    />
  )
}
