// Break design tokens, taken from the "Break Project" Figma file.
// Values live as CSS variables in src/index.css so they can be tuned in one place.
const token = (name) => `rgb(var(--${name}) / <alpha-value>)`;

export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: token('primary'), hover: token('primary-hover') },
        accent: { DEFAULT: token('accent'), soft: token('accent-soft') },
        bg: token('bg'),
        surface: token('surface'),
        line: token('line'),
        ink: { DEFAULT: token('ink'), muted: token('ink-muted') },
        danger: { DEFAULT: token('danger'), soft: token('danger-soft') },
        success: { DEFAULT: token('success'), soft: token('success-soft') },
        warning: { DEFAULT: token('warning'), soft: token('warning-soft') },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        display: ['"Playfair Display"', 'Georgia', 'serif'],
      },
      borderRadius: { xl: '12px', '2xl': '16px', '3xl': '20px' },
      boxShadow: {
        card: '0 1px 2px rgb(30 27 46 / 0.04), 0 4px 16px rgb(30 27 46 / 0.05)',
        pop: '0 12px 40px rgb(30 27 46 / 0.16)',
      },
    },
  },
  plugins: [],
};
