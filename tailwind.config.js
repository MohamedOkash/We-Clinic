/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'Cairo', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Inter', 'Cairo', 'system-ui', 'sans-serif'],
        arabic: ['Cairo', 'Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'glow-slow': 'glow 4s ease-in-out infinite alternate',
        'shimmer': 'shimmer 2s linear infinite',
        'slide-up': 'slide-up 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-down': 'slide-down 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'fade-in': 'fade-in 0.4s ease-out',
        'fade-scale': 'fade-scale 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'pulse-soft': 'pulse-soft 2s ease-in-out infinite',
        'spin-slow': 'spin 3s linear infinite',
        'counter': 'counter 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
        'bar-fill': 'bar-fill 1s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'stagger-1': 'slide-up 0.5s cubic-bezier(0.16,1,0.3,1) 0.05s both',
        'stagger-2': 'slide-up 0.5s cubic-bezier(0.16,1,0.3,1) 0.1s both',
        'stagger-3': 'slide-up 0.5s cubic-bezier(0.16,1,0.3,1) 0.15s both',
        'stagger-4': 'slide-up 0.5s cubic-bezier(0.16,1,0.3,1) 0.2s both',
        'stagger-5': 'slide-up 0.5s cubic-bezier(0.16,1,0.3,1) 0.25s both',
        'stagger-6': 'slide-up 0.5s cubic-bezier(0.16,1,0.3,1) 0.3s both',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(6, 182, 212, 0.2), 0 0 20px rgba(6, 182, 212, 0.1)' },
          '100%': { boxShadow: '0 0 20px rgba(6, 182, 212, 0.4), 0 0 60px rgba(6, 182, 212, 0.2)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-down': {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'fade-scale': {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        counter: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'bar-fill': {
          '0%': { transform: 'scaleX(0)' },
          '100%': { transform: 'scaleX(1)' },
        },
      },
      backdropBlur: {
        '3xl': '64px',
      },
      boxShadow: {
        'glow-cyan': '0 0 20px rgba(6, 182, 212, 0.3), 0 0 60px rgba(6, 182, 212, 0.1)',
        'glow-purple': '0 0 20px rgba(168, 85, 247, 0.3), 0 0 60px rgba(168, 85, 247, 0.1)',
        'glow-emerald': '0 0 20px rgba(16, 185, 129, 0.3), 0 0 60px rgba(16, 185, 129, 0.1)',
        'glow-amber': '0 0 20px rgba(245, 158, 11, 0.3), 0 0 60px rgba(245, 158, 11, 0.1)',
        'inner-deep': 'inset 4px 4px 15px rgba(0,0,0,0.6), inset -2px -2px 10px rgba(255,255,255,0.05)',
        'card': '10px 15px 35px rgba(0,0,0,0.7), inset 1px 1px 3px rgba(255,255,255,0.2)',
        'card-hover': '12px 18px 40px rgba(0,0,0,0.8), inset 1px 1px 4px rgba(255,255,255,0.25), 0 0 30px rgba(6,182,212,0.08)',
        'btn': '6px 8px 20px rgba(0,0,0,0.6), inset 2px 2px 5px rgba(255,255,255,0.4)',
        'btn-hover': '8px 10px 25px rgba(0,0,0,0.7), inset 2px 2px 6px rgba(255,255,255,0.5)',
      },
      transitionTimingFunction: {
        'bounce-out': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'smooth': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
};
