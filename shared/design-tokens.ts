/**
 * Shared design tokens — single source of truth for both
 * the learner-facing app (src/, Tailwind v4) and the admin
 * console (admin/, Antd 5). Frontend consumes via Tailwind
 * `@theme`; admin consumes via `ConfigProvider.theme.token`.
 */

const brand = {
  50: '#eef4ff',
  100: '#dbe6ff',
  200: '#bccfff',
  300: '#8eaeff',
  400: '#5d83fa',
  500: '#3a60ee',
  600: '#2a47d4',
  700: '#2438ab',
  800: '#21338a',
  900: '#1f2f72',
} as const;

const neutral = {
  0: '#ffffff',
  50: '#f8fafc',
  100: '#f1f5f9',
  200: '#e2e8f0',
  300: '#cbd5e1',
  400: '#94a3b8',
  500: '#64748b',
  600: '#475569',
  700: '#334155',
  800: '#1e293b',
  900: '#0f172a',
  950: '#020617',
} as const;

const success = { 50: '#ecfdf5', 500: '#10b981', 600: '#059669', 700: '#047857' } as const;
const warning = { 50: '#fffbeb', 500: '#f59e0b', 600: '#d97706', 700: '#b45309' } as const;
const danger = { 50: '#fef2f2', 500: '#ef4444', 600: '#dc2626', 700: '#b91c1c' } as const;

export const colors = { brand, neutral, success, warning, danger } as const;

export const radius = {
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 20,
  full: 9999,
} as const;

export const shadow = {
  sm: '0 1px 2px 0 rgb(15 23 42 / 0.04), 0 1px 1px 0 rgb(15 23 42 / 0.03)',
  md: '0 4px 8px -2px rgb(15 23 42 / 0.06), 0 2px 4px -2px rgb(15 23 42 / 0.04)',
  lg: '0 12px 24px -8px rgb(15 23 42 / 0.10), 0 4px 8px -4px rgb(15 23 42 / 0.05)',
  xl: '0 24px 48px -12px rgb(15 23 42 / 0.14)',
} as const;

export const fontFamily = {
  sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "PingFang SC", "Microsoft YaHei", sans-serif',
} as const;

export const controlHeight = {
  sm: 32,
  md: 36,
  lg: 44,
} as const;

/**
 * Antd 5 `theme.token` shape. Pass to <ConfigProvider theme={{ token: antdToken }}>.
 *
 * Tailwind side mirrors these same hex values inside `src/index.css`'s
 * `@theme` block — keep both in sync if you change a value here.
 */
export const antdToken = {
  colorPrimary: brand[500],
  colorPrimaryBg: brand[50],
  colorPrimaryBgHover: brand[100],
  colorPrimaryBorder: brand[200],
  colorPrimaryHover: brand[400],
  colorPrimaryActive: brand[700],
  colorSuccess: success[500],
  colorWarning: warning[500],
  colorError: danger[500],
  colorInfo: brand[500],
  colorTextBase: neutral[900],
  colorTextSecondary: neutral[600],
  colorTextTertiary: neutral[500],
  colorBorder: neutral[200],
  colorBorderSecondary: neutral[100],
  colorBgLayout: neutral[50],
  colorBgContainer: neutral[0],
  colorBgElevated: neutral[0],
  borderRadius: radius.md,
  borderRadiusLG: radius.lg,
  borderRadiusSM: radius.sm,
  controlHeight: controlHeight.md,
  controlHeightSM: controlHeight.sm,
  controlHeightLG: controlHeight.lg,
  fontFamily: fontFamily.sans,
  boxShadow: shadow.md,
  boxShadowSecondary: shadow.sm,
  wireframe: false,
} as const;

export type DesignTokens = {
  colors: typeof colors;
  radius: typeof radius;
  shadow: typeof shadow;
  fontFamily: typeof fontFamily;
  controlHeight: typeof controlHeight;
};
