module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        uk: {
          DEFAULT: '#3b82f6',
          accent: '#f97316',
          dark: '#0b1220',
        },
      },
    },
  },
  safelist: [
    'text-green-600', 'text-red-600', 'bg-[#0b1220]', 'bg-[#3b82f6]'
  ],
  plugins: [],
};
