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
        border: {
          DEFAULT: 'var(--color-border)',
          focus: 'var(--color-border-focus)',
        },
      },
      fontFamily: {
        heading: ['var(--font-heading)'],
        body: ['var(--font-body)', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'ds-xs': ['0.75rem', { lineHeight: '1rem' }],
        'ds-sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'ds-base': ['1rem', { lineHeight: '1.5rem' }],
        'ds-lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'ds-xl': ['1.25rem', { lineHeight: '1.75rem' }],
        'ds-2xl': ['1.5rem', { lineHeight: '2rem' }],
        'ds-3xl': ['1.875rem', { lineHeight: '2.25rem' }],
      },
      spacing: {
        'ds-2xs': 'var(--space-2xs)',
        'ds-xs': 'var(--space-xs)',
        'ds-sm': 'var(--space-sm)',
        'ds-md': 'var(--space-md)',
        'ds-lg': 'var(--space-lg)',
        'ds-xl': 'var(--space-xl)',
        'ds-2xl': 'var(--space-2xl)',
        'ds-3xl': 'var(--space-3xl)',
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
        xl: 'var(--shadow-xl)',
        inner: 'var(--shadow-inner)',
      },
      transitionProperty: {
        brand: 'var(--transition)',
      },
      zIndex: {
        modal: 'var(--z-modal)',
        toast: 'var(--z-toast)',
      },
    },
  },
  plugins: [],
} satisfies Config
