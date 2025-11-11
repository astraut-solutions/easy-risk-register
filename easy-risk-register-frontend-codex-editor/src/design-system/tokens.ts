export const colorTokens = {
  brand: {
    primary: '#2563eb', // Indigo 600 - Main CTAs, brand elements
    primaryDark: '#1d4ed8', // Hover states, emphasis
    primaryLight: '#dbeafe', // Subtle backgrounds, highlights
    secondary: '#64748b', // Supporting elements (Slate 500)
    secondaryLight: '#e2e8f0', // Backgrounds, subtle accents
    secondaryPale: '#f1f5f9', // Selected states, highlights
  },
  semantic: {
    success: '#10b981', // Positive actions, confirmations (Emerald 500)
    successDark: '#059669', // Darker success variant
    warning: '#f59e0b', // Caution states, alerts (Amber 500)
    warningDark: '#d97706', // Darker warning variant
    danger: '#ef4444', // Errors, destructive actions (Red 500)
    dangerDark: '#dc2626', // Darker danger variant
    info: '#3b82f6', // Informational messages (Blue 500)
    infoDark: '#1d428a', // Darker info variant
  },
  status: {
    success: '#10b981', // Success status (Emerald 500)
    successDark: '#059669', // Darker success variant
    warning: '#f59e0b', // Warning status (Amber 500)
    warningDark: '#d97706', // Darker warning variant
    danger: '#ef4444', // Danger status (Red 500)
    dangerDark: '#dc2626', // Darker danger variant
    info: '#3b82f6', // Info status (Blue 500)
    infoDark: '#1d428a', // Darker info variant
    neutral: '#64748b', // Neutral status (Slate 500)
  },
  accent: {
    primary: '#059669', // Important actions, notifications (Emerald 600)
    secondary: '#d97706', // Warnings, highlights (Amber 600)
    gradientStart: '#3b82f6', // For gradient elements (Blue 500)
    gradientEnd: '#8b5cf6', // For gradient elements (Violet 500)
  },
  surface: {
    primary: '#ffffff', // Main surface background
    secondary: '#f8fafc', // Secondary surface background (slate-50)
    tertiary: '#f1f5f9', // Tertiary surface background (slate-100)
    quaternary: '#e2e8f0', // Quaternary surface background (slate-200)
  },
  border: {
    strong: '#cbd5e1', // Strong borders (slate-300)
    subtle: '#e2e8f0', // Subtle borders (slate-200)
    faint: '#f1f5f9', // Faint borders (slate-100)
  },
  text: {
    high: '#0f172a', // High contrast text (slate-900)
    mid: '#334155', // Medium contrast text (slate-800)
    low: '#64748b', // Low contrast text (slate-500)
    inverted: '#ffffff', // Text on dark backgrounds
  },
  neutral: {
    50: '#f8fafc', // Very light backgrounds
    100: '#f1f5f9', // Light backgrounds
    200: '#e2e8f0', // Borders, subtle dividers
    300: '#cbd5e1', // Medium borders
    400: '#94a3b8', // Medium text, icons
    500: '#64748b', // Body text
    600: '#475569', // Headings
    700: '#334155', // Dark headings
    800: '#1e293b', // Text on light backgrounds
    900: '#0f172a', // Text on light backgrounds
  },
  risk: {
    low: '#22c55e', // Green for low risk
    medium: '#f97316', // Amber for medium risk
    high: '#ef4444', // Red for high risk
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
