/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        /* Neutral graphite base - deliberately warm-neutral, not blue-navy */
        base: {
          0: '#0a0a0c',
          1: '#0e0e11',
          2: '#131316',
          3: '#18181c',
          4: '#1f1f25',
          5: '#2a2a32',
        },
        /* Desaturated steel blue - the single brand/interactive accent */
        steel: {
          200: '#c2d6e6',
          300: '#9dbdd6',
          400: '#7aa2c4',
          500: '#5b8db8',
          600: '#46728f',
          700: '#33556c',
        },
        /* Status triad - used ONLY for real state, never decoration */
        ok: {
          DEFAULT: '#5fb87f',
          dim: 'rgba(95,184,127,0.12)',
        },
        warn: {
          DEFAULT: '#d9a441',
          dim: 'rgba(217,164,65,0.12)',
        },
        crit: {
          DEFAULT: '#d96b6b',
          dim: 'rgba(217,107,107,0.13)',
        },
        cold: {
          DEFAULT: '#6b93d9',
          dim: 'rgba(107,147,217,0.12)',
        },
      },
      fontFamily: {
        sans: ['"IBM Plex Sans"', 'system-ui', 'sans-serif'],
        cond: ['"IBM Plex Sans Condensed"', '"IBM Plex Sans"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        /* Floor is 11.5px: these labels get read off a projector from across a
           room, so nothing smaller earns its place. */
        '2xs': ['11.5px', { lineHeight: '15px', letterSpacing: '0.05em' }],
        'xs': ['12.5px', { lineHeight: '17px' }],
        'sm': ['13.5px', { lineHeight: '19px' }],
        'base': ['15px', { lineHeight: '22px' }],
      },
      boxShadow: {
        card: '0 1px 0 0 rgba(255,255,255,0.035) inset, 0 12px 28px -18px rgba(0,0,0,0.9)',
        lift: '0 1px 0 0 rgba(255,255,255,0.05) inset, 0 20px 44px -22px rgba(0,0,0,0.95)',
      },
      keyframes: {
        'alert-breathe': {
          '0%, 100%': { borderColor: 'rgba(217,107,107,0.35)' },
          '50%': { borderColor: 'rgba(217,107,107,0.85)' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'alert-breathe': 'alert-breathe 2s ease-in-out infinite',
        'slide-up': 'slide-up 0.2s ease-out',
      }
    },
  },
  plugins: [],
}
