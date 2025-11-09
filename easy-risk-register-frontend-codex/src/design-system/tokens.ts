export const colorTokens = {
  brand: {
    primary: '#2563eb',
    primaryDark: '#1d4ed8',
    primaryLight: '#dbeafe',
    secondary: '#64748b',
    secondaryLight: '#e2e8f0',
    secondaryPale: '#f1f5f9',
  },
  semantic: {
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    info: '#3b82f6',
  },
  neutral: {
    textHigh: '#0f172a',
    textMid: '#334155',
    textLow: '#64748b',
    textMuted: '#94a3b8',
    bgPrimary: '#ffffff',
    bgSecondary: '#f8fafc',
    bgTertiary: '#f1f5f9',
    borderStrong: '#cbd5e1',
    borderMid: '#e2e8f0',
    borderWeak: '#f1f5f9',
  },
  gradient: {
    start: '#3b82f6',
    end: '#8b5cf6',
  },
  risk: {
    low: '#22c55e',
    medium: '#f97316',
    high: '#ef4444',
  },
} as const

export const spacingTokens = {
  xs: '0.25rem', // 4px
  sm: '0.5rem', // 8px
  md: '1rem', // 16px
  lg: '1.5rem', // 24px
  xl: '2rem', // 32px
  '2xl': '3rem', // 48px
  '3xl': '4rem', // 64px
  '4xl': '8rem', // 128px
} as const

export const radiusTokens = {
  sm: '0.5rem',
  md: '0.75rem',
  lg: '1rem',
  pill: '999px',
} as const

export const shadowTokens = {
  cardSoft: '0 20px 45px -20px rgba(15, 23, 42, 0.18)',
  cardStrong: '0 30px 70px -30px rgba(15, 23, 42, 0.25)',
  focus: '0 0 0 4px rgba(37, 99, 235, 0.2)',
} as const

export const typographyTokens = {
  fontFamily: {
    sans: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif',
    mono: '"JetBrains Mono", "Fira Code", Consolas, "Courier New", monospace',
  },
  weights: {
    light: 300,
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  sizes: {
    h1: '2.5rem',
    h2: '2rem',
    h3: '1.75rem',
    h4: '1.5rem',
    h5: '1.25rem',
    h6: '1.125rem',
    body: '1rem',
    bodySmall: '0.875rem',
    caption: '0.75rem',
  },
} as const

export const componentTokens = {
  button: {
    height: '2.75rem',
    radius: radiusTokens.md,
    paddingX: spacingTokens.lg,
  },
  card: {
    radius: radiusTokens.lg,
    padding: spacingTokens.xl,
  },
  input: {
    height: '2.75rem',
    radius: radiusTokens.md,
    paddingX: spacingTokens.md,
  },
  container: {
    maxWidth: '1200px',
    paddingX: spacingTokens.xl,
    paddingY: spacingTokens['2xl'],
  },
} as const

export const designTokens = {
  colors: colorTokens,
  spacing: spacingTokens,
  radii: radiusTokens,
  shadows: shadowTokens,
  typography: typographyTokens,
  components: componentTokens,
} as const

export type DesignTokens = typeof designTokens
