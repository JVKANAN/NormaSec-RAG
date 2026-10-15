/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      keyframes: { slide: { '0%': { transform: 'translateX(-100%)' }, '100%': { transform: 'translateX(300%)' } } },
      fontFamily: { sans: ['Inter', 'system-ui', 'Segoe UI', 'sans-serif'] },
      colors: {
        brand: { DEFAULT: '#1b5e63', dark: '#144b4f', soft: '#e4f1f0', tint: '#eef6f5', ink: '#173f45' },
        ink: { DEFAULT: '#1d2f36', soft: '#5d6f75', mute: '#8a999e' },
        surface: { DEFAULT: '#f6f8f8', side: '#f1f5f5', line: '#e3e9e9' },
        amber: { soft: '#fbf2e3', ink: '#8a5a12' },
      },
    },
  },
}
