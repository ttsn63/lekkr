import type { Config } from 'tailwindcss'

export default {
  content: ['./client/index.html', './client/src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: 'var(--color-navy)',
          light: 'var(--color-navy-light)',
          dark: 'var(--color-navy-dark)',
        },
        brand: {
          red: 'var(--color-red)',
          'red-light': 'var(--color-red-light)',
          'red-dark': 'var(--color-red-dark)',
          mint: 'var(--color-mint)',
          'mint-light': 'var(--color-mint-light)',
          'mint-dark': 'var(--color-mint-dark)',
          cream: 'var(--color-cream)',
          'cream-dark': 'var(--color-cream-dark)',
          'cream-darker': 'var(--color-cream-darker)',
        },
        text: {
          primary: 'var(--color-text-primary)',
          secondary: 'var(--color-text-secondary)',
          light: 'var(--color-text-light)',
        },
        bg: {
          primary: 'var(--color-bg-primary)',
          secondary: 'var(--color-bg-secondary)',
          dark: 'var(--color-bg-dark)',
        },
      },
      fontFamily: {
        heading: ['"Playfair Display"', 'serif'],
        body: ['"DM Sans"', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        full: 'var(--radius-full)',
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
      },
      transitionProperty: {
        brand: 'var(--transition)',
      },
    },
  },
  plugins: [],
} satisfies Config
