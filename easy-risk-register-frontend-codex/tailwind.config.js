/** @type {import('tailwindcss').Config} */
const config = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#2563eb',
          primaryDark: '#1d4ed8',
          primaryLight: '#dbeafe',
        },
        surface: {
          primary: '#ffffff',
          secondary: '#f8fafc',
          tertiary: '#f1f5f9',
        },
        text: {
          high: '#0f172a',
          mid: '#334155',
          low: '#64748b',
          muted: '#94a3b8',
        },
        border: {
          strong: '#cbd5e1',
          subtle: '#e2e8f0',
          faint: '#f1f5f9',
        },
        status: {
          success: '#10b981',
          warning: '#f59e0b',
          danger: '#ef4444',
          info: '#3b82f6',
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
