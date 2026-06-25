/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          base: '#0F0F0F',
          raised: '#2A2929',
          card: '#444342',
        },
        accent: {
          DEFAULT: '#FFB700',
          bright: '#FFD000',
          muted: 'rgba(255, 183, 0, 0.15)',
          brightMuted: 'rgba(255, 208, 0, 0.1)',
        },
        warning: {
          DEFAULT: '#FFB700',
          muted: 'rgba(255, 183, 0, 0.15)',
        },
        critical: {
          DEFAULT: '#9A3412',
          muted: 'rgba(154, 52, 18, 0.12)',
        },
      },
      boxShadow: {
        card: '0 1px 0 rgba(255,255,255,0.04), 0 4px 12px rgba(0,0,0,0.4)',
        glowGold: '0 0 12px rgba(255, 183, 0, 0.35)',
        glowBright: '0 0 14px rgba(255, 208, 0, 0.3)',
      },
      borderRadius: {
        card: '0.625rem',
      },
      animation: {
        shimmer: 'shimmer 1.5s ease-in-out infinite',
        'fade-in-up': 'fadeInUp 0.3s ease-out',
      },
      keyframes: {
        shimmer: {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
