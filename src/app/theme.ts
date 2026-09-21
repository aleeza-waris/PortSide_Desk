import { theme as antTheme, type ThemeConfig } from 'antd'
import type { ThemeMode } from './uiSlice'

export const FONT_SANS = "'IBM Plex Sans', system-ui, -apple-system, 'Segoe UI', sans-serif"

/** Deep harbour blue: the sider stays this colour in both modes. */
export const HARBOUR = '#0F2A3D'
/** Buoy yellow: used once, to mark where you are in the sider. */
export const BUOY = '#F2B705'

export function buildTheme(mode: ThemeMode): ThemeConfig {
  const dark = mode === 'dark'
  return {
    cssVar: { key: 'portside' },
    hashed: false,
    algorithm: dark ? antTheme.darkAlgorithm : antTheme.defaultAlgorithm,
    token: {
      colorPrimary: dark ? '#4FB3C4' : '#1F7A8C',
      colorInfo: dark ? '#4FB3C4' : '#1F7A8C',
      colorLink: dark ? '#6CC3D2' : '#176476',
      borderRadius: 6,
      fontFamily: FONT_SANS,
      fontSize: 14,
      colorBgLayout: dark ? '#0B1620' : '#F1F4F6',
      colorBgContainer: dark ? '#122230' : '#FFFFFF',
      colorBgElevated: dark ? '#162B3C' : '#FFFFFF',
      colorBorderSecondary: dark ? '#22394C' : '#E3E9ED',
    },
    components: {
      Layout: {
        siderBg: HARBOUR,
        headerBg: dark ? '#122230' : '#FFFFFF',
        headerPadding: '0 20px',
        headerHeight: 56,
        bodyBg: dark ? '#0B1620' : '#F1F4F6',
      },
      Menu: {
        darkItemBg: HARBOUR,
        darkSubMenuItemBg: HARBOUR,
        darkItemColor: 'rgba(255,255,255,0.7)',
        darkItemHoverColor: '#FFFFFF',
        darkItemHoverBg: 'rgba(255,255,255,0.06)',
        darkItemSelectedBg: 'rgba(255,255,255,0.1)',
        darkItemSelectedColor: '#FFFFFF',
        itemHeight: 42,
        itemMarginInline: 10,
      },
      Table: {
        headerBg: dark ? '#162B3C' : '#F6F8F9',
        headerColor: dark ? 'rgba(255,255,255,0.75)' : '#3F5261',
        headerSplitColor: 'transparent',
        cellPaddingBlock: 12,
        rowSelectedBg: dark ? 'rgba(79,179,196,0.12)' : '#E7F3F5',
        rowSelectedHoverBg: dark ? 'rgba(79,179,196,0.18)' : '#DBEDF0',
      },
      Card: { headerFontSize: 15, borderRadiusLG: 8 },
    },
  }
}
