/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Enhanced dark mode colors for better contrast and readability
        slate: {
          750: '#1e293b',
          850: '#0f172a',
        },
      },
      backgroundColor: {
        'dark-primary': '#0f172a',
        'dark-secondary': '#1e293b',
        'dark-tertiary': '#334155',
      },
      textColor: {
        'dark-primary': '#f1f5f9',
        'dark-secondary': '#cbd5e1',
      },
      boxShadow: {
        'dark-sm': '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
        'dark-md': '0 4px 6px 0 rgba(0, 0, 0, 0.3)',
        'dark-lg': '0 10px 15px 0 rgba(0, 0, 0, 0.4)',
      },
    },
  },
  plugins: [],
}

