// web/tailwind.config.ts
import type { Config } from 'tailwindcss'

export default {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './features/**/*.{ts,tsx}',
  ],
  darkMode: 'class',
  theme: { extend: {} },
  plugins: [],
} satisfies Config
