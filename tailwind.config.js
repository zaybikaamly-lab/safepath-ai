/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#070E1A',
          900: '#0A1628',
          800: '#0D1B2E',
          700: '#1A2E4A',
          600: '#2A3F5F',
          500: '#3A5A7A',
          400: '#5A7A9A',
          300: '#7A9AB8',
          200: '#C0D8F0',
          100: '#E8F4FD',
        },
        cyan: { DEFAULT: '#00D4FF' },
        amber: { DEFAULT: '#FF8C00' },
        hazard: { DEFAULT: '#FF4444' },
        safe: { DEFAULT: '#00FF88' },
        warn: { DEFAULT: '#FFD600' },
        violet: { DEFAULT: '#B388FF' },
      },
      fontFamily: {
        mono: ['"IBM Plex Mono"', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
