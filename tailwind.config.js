/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0f1115',
        panel: '#171a21',
        panel2: '#1d222c',
        text: '#f4f6fb',
        muted: '#aab3c5',
        green: '#35d07f',
        red: '#ff5d73',
        yellow: '#f5c451',
        accent: '#7aa2ff',
      },
      boxShadow: {
        glow: '0 18px 50px rgba(0, 0, 0, 0.32)',
      },
    },
  },
  plugins: [],
}
