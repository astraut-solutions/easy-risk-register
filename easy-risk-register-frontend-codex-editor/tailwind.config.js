/** @type {import('tailwindcss').Config} */
const config = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#2563eb', // Indigo 600 - Main CTAs, brand elements
          primaryDark: '#1d4ed8', // Hover states, emphasis
          primaryLight: '#dbeafe', // Subtle backgrounds, highlights
        },
        surface: {
          primary: '#ffffff', // From neutral-50
          secondary: '#f8fafc', // From neutral-50
          tertiary: '#f1f5f9', // From neutral-100
        },
        text: {
          high: '#0f172a', // From neutral-900 - Text on light backgrounds
          mid: '#334155', // From neutral-800 - Dark headings
          low: '#64748b', // From neutral-500 - Body text
          muted: '#94a3b8', // From neutral-400 - Medium text, icons
        },
        border: {
          strong: '#cbd5e1', // From neutral-300 - Medium borders
          subtle: '#e2e8f0', // From neutral-200 - Borders, subtle dividers
          faint: '#f1f5f9', // From neutral-100 - Light backgrounds
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
        status: {
          success: '#10b981', // Positive actions, confirmations (Emerald 500)
          warning: '#f59e0b', // Caution states, alerts (Amber 500)
          danger: '#ef4444', // Errors, destructive actions (Red 500)
          info: '#3b82f6', // Informational messages (Blue 500)
        },
        accent: {
          primary: '#059669', // Important actions, notifications (Emerald 600)
          secondary: '#d97706', // Warnings, highlights (Amber 600)
        },
        gradient: {
          start: '#3b82f6', // For gradient elements (Blue 500)
          end: '#8b5cf6', // For gradient elements (Violet 500)
        },
        risk: {
          low: '#22c55e', // Green for low risk
          medium: '#f97316', // Amber for medium risk
          high: '#ef4444', // Red for high risk
        },
      },
      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'card-soft': '0 20px 45px -20px rgba(15, 23, 42, 0.18)',
        'card-strong': '0 35px 80px -45px rgba(15, 23, 42, 0.2)',
      },
      borderRadius: {
        xl: '1.25rem',
        '2xl': '1.5rem',
      },
    },
  },
  plugins: [],
}

export default config
