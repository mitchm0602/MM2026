import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: '#0a0d12',
        bg2: '#111520',
        bg3: '#1a1f2e',
        bg4: '#222840',
        border: '#2a3050',
        border2: '#3a4565',
        text1: '#e8ecf4',
        text2: '#8b95b0',
        text3: '#5a6380',
        accent: '#4f7eff',
        accent2: '#7b5cff',
        green: '#22c97a',
        red: '#ff4f6a',
        amber: '#ffb340',
      },
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        serif: ['DM Serif Display', 'serif'],
      },
    },
  },
  plugins: [],
}

export default config
