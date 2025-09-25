// tailwind.config.ts
import type { Config } from 'tailwindcss'
export default {
darkMode: 'class',
content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
theme: {
extend: {
colors: {
match: {
bg: '#0B0F14',
green: '#14B45C',
neon: '#EFFF57',
gray: '#9AA4AE',
},
},
},
},
plugins: [],
} satisfies Config