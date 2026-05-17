import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'aura-bg': 'var(--aura-bg)',
        'aura-surface': 'var(--aura-surface)',
        'aura-accent': 'var(--aura-accent)',
        'aura-accent-warm': 'var(--aura-accent-warm)',
        'aura-accent-cool': 'var(--aura-accent-cool)',
        'aura-text-primary': 'var(--aura-text-primary)',
        'aura-text-subtle': 'var(--aura-text-subtle)',
      },
      fontFamily: {
        display: ['Gowun Batang', 'DM Serif Display', 'serif'],
        body: ['Geist', 'Inter', 'sans-serif'],
        mono: ['Geist Mono', 'monospace'],
      },
      borderRadius: {
        'aura': '16px',
        'aura-lg': '24px',
      },
      boxShadow: {
        'aura': '0 4px 24px rgba(0, 0, 0, 0.5)',
        'aura-lg': '0 8px 48px rgba(0, 0, 0, 0.7)',
      },
      animation: {
        'breathe': 'breathe 4s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        breathe: {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.8' },
          '50%': { transform: 'scale(1.05)', opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px var(--aura-accent), 0 0 10px var(--aura-accent)' },
          '100%': { boxShadow: '0 0 20px var(--aura-accent), 0 0 40px var(--aura-accent)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
