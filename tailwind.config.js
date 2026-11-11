/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        editor: {
          black: '#000000',
          bg: '#09090b',
          panel: '#111113',
          card: '#18181b',
          input: '#0c0c0e',
          border: '#27272a',
          borderHover: '#3f3f46',
          orange: '#ff6b00',
          orangeHover: '#ff7d1a',
          orangeDim: 'rgba(255, 107, 0, 0.08)',
          orangeGlow: 'rgba(255, 107, 0, 0.25)',
        }
      },
      fontFamily: {
        sans: ['Inter', 'Kantumruy Pro', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'SF Mono', 'Menlo', 'monospace']
      }
    },
  },
  plugins: [],
};
