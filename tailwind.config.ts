import type { Config } from 'tailwindcss'

// 设计 token：在此统一定义配色 / 间距 / 字体 / 圆角，
// feature/skill-welcome 分支应直接复用这些 token，勿重复定义。
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // 主色：用于 CTA、强调
        brand: {
          DEFAULT: '#4f46e5',
          50: '#eef2ff',
          100: '#e0e7ff',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
        },
        // 中性色：文本、边框、背景层级
        ink: {
          DEFAULT: '#1f2937',
          muted: '#6b7280',
        },
        surface: {
          DEFAULT: '#ffffff',
          subtle: '#f9fafb',
          border: '#e5e7eb',
        },
      },
      fontFamily: {
        sans: [
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'PingFang SC',
          'Microsoft YaHei',
          'sans-serif',
        ],
      },
      borderRadius: {
        card: '1rem',
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)',
        'card-hover': '0 8px 24px rgba(0,0,0,0.10)',
      },
    },
  },
  plugins: [],
} satisfies Config
