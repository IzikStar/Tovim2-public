import type { Config } from 'tailwindcss';
import animate from 'tailwindcss-animate';

// shadcn/ui theme: colors are CSS variables (src/index.css) so the palette
// lives in one place.
const color = (name: string) => `hsl(var(--${name}) / <alpha-value>)`;

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    container: { center: true, padding: '1.25rem', screens: { '2xl': '1120px' } },
    extend: {
      fontFamily: {
        sans: ['Heebo', 'system-ui', '-apple-system', 'Segoe UI', 'Arial', 'sans-serif'],
      },
      colors: {
        background: color('background'),
        foreground: color('foreground'),
        card: { DEFAULT: color('card'), foreground: color('card-foreground') },
        popover: { DEFAULT: color('popover'), foreground: color('popover-foreground') },
        primary: { DEFAULT: color('primary'), foreground: color('primary-foreground'), soft: color('primary-soft') },
        secondary: { DEFAULT: color('secondary'), foreground: color('secondary-foreground') },
        muted: { DEFAULT: color('muted'), foreground: color('muted-foreground') },
        accent: { DEFAULT: color('accent'), foreground: color('accent-foreground') },
        destructive: { DEFAULT: color('destructive'), foreground: color('destructive-foreground'), soft: color('destructive-soft') },
        success: { DEFAULT: color('success'), soft: color('success-soft') },
        warning: { DEFAULT: color('warning'), soft: color('warning-soft') },
        gold: { DEFAULT: color('gold'), soft: color('gold-soft') },
        whatsapp: color('whatsapp'),
        border: color('border'),
        input: color('input'),
        ring: color('ring'),
      },
      borderRadius: {
        xl: 'calc(var(--radius) + 4px)',
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 4px)',
        sm: 'calc(var(--radius) - 8px)',
      },
      boxShadow: {
        soft: '0 1px 2px rgb(42 34 48 / 0.05), 0 6px 20px rgb(42 34 48 / 0.05)',
        lift: '0 10px 30px rgb(42 34 48 / 0.10)',
      },
    },
  },
  plugins: [animate],
};

export default config;
