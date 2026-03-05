import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f6f7ff',
          100: '#ebeefd',
          200: '#d2dafb',
          300: '#b0c0f8',
          400: '#8ba2f3',
          500: '#6f83ec',
          600: '#5868de',
          700: '#4a54c4',
          800: '#3f46a0',
          900: '#363f7f'
        }
      },
      boxShadow: {
        glass: '0 24px 70px -38px rgba(18, 22, 58, 0.55)'
      }
    }
  },
  plugins: []
};

export default config;
