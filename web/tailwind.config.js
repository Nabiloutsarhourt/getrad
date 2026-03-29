/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#004ac6',
        'primary-container': '#2563eb',
        'primary-fixed': '#dbe1ff',
        'primary-fixed-dim': '#b4c5ff',
        'on-primary': '#ffffff',
        secondary: '#006c49',
        'secondary-fixed': '#c5f8e1',
        'secondary-container': '#6cf8bb',
        'on-secondary': '#ffffff',
        surface: '#f8f9fa',
        'surface-bright': '#f8f9fa',
        'surface-container': '#edeeef',
        'surface-container-low': '#f3f4f5',
        'surface-container-high': '#e7e8e9',
        'surface-container-highest': '#e1e3e4',
        'surface-container-lowest': '#ffffff',
        'on-surface': '#191c1d',
        'on-surface-variant': '#434655',
        danger: '#ba1a1a',
        'error-container': '#ffdad6',
        outline: '#737686',
        'outline-variant': '#c3c6d7',
        background: '#f8f9fa',
        'text-primary': '#191c1d',
        'text-secondary': '#434655',
        border: '#c3c6d7',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        xl: '12px',
        '2xl': '16px',
        '3xl': '24px',
      },
      boxShadow: {
        card: '0 4px 16px rgba(25, 28, 29, 0.06)',
        deep: '0 8px 24px rgba(25, 28, 29, 0.10)',
        subtle: '0 2px 8px rgba(25, 28, 29, 0.04)',
      },
      animation: {
        'pulse-dot': 'pulse 1.5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
