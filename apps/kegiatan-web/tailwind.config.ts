import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        marine: { 50: '#eef3f9', 100: '#d9e5f2', 500: '#2d5a9e', 600: '#25497f', 700: '#1e3a5f', 900: '#14263f' },
      },
      fontFamily: { sans: ['var(--font-inter)', 'system-ui', 'sans-serif'] },
    },
  },
  plugins: [],
}

export default config
