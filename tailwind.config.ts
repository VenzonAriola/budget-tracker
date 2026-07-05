import type { Config } from 'tailwindcss';
import animate from 'tailwindcss-animate';

const config: Config = {
  darkMode: ['class'],
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    container: {
      center: true,
      padding: '1rem',
    },
    extend: {
      fontFamily: {
        display: ['var(--font-display)', 'sans-serif'],
        sans: ['var(--font-body)', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        ink: {
          DEFAULT: '#12172B',
          50: '#F4F5F8',
          100: '#E7E9F0',
          200: '#C7CBDB',
          400: '#5B6280',
          600: '#2B324D',
          800: '#181D33',
          900: '#0C0F1C',
        },
        emerald: {
          DEFAULT: '#1FAA75',
          50: '#E9FBF3',
          600: '#178B5F',
        },
        coral: {
          DEFAULT: '#E2543D',
          50: '#FDEEEB',
          600: '#C43F2B',
        },
        violet: {
          DEFAULT: '#6C63F5',
          50: '#EFEEFE',
          600: '#5750D6',
        },
        amber: {
          DEFAULT: '#E8A63A',
          50: '#FDF4E4',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      backgroundImage: {
        'ledger-grid':
          'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)',
      },
      backgroundSize: {
        ledger: '100% 2.25rem',
      },
    },
  },
  plugins: [animate],
};

export default config;
