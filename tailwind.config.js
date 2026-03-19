/** @type {import('tailwindcss').Config} */
// ─────────────────────────────────────────────────────────────────────────────
// Figma Local Styles → Tailwind CSS mapping
// Source: Paw-Trace (tRWTL5cnaUKCXWKkbaTSWv) — extracted 2026-03-18
// ─────────────────────────────────────────────────────────────────────────────
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      // ── Color Tokens ──────────────────────────────────────────────────────
      colors: {
        brand: {
          teal:       '#22807F', // primary / icon / logo stroke
          'teal-dark':'#1A6665', // teal hover (darkened 10%)
          dark:       '#1A2E2D', // body text / headings
          cta:        '#D97757', // CTA button (terracotta)
          'cta-dark': '#C4664A', // CTA hover (darkened)
          sand:       '#E6D6B5', // hero background (beige)
          'sand-mid': '#ECE2CE', // card lines / dividers
          cream:      '#FCF1D8', // poster icon background
          surface:    '#F6F6F6', // input / bottom card bg
          muted:      '#AEAEB2', // placeholder / hint text
          label:      '#8E8E93', // form label / section heading
          radio:      '#D4D4D4', // unselected radio border
          border:     '#E5E5EA', // default border
          green:      '#406D1F', // MISSING text / tagline accent
          yellow:     '#EBC04D', // amber accent
          red:        '#ED1C24', // delete / error
          'red-dark': '#CC1219', // delete button hover
          charcoal:   '#444444', // general dark overlay
          white:      '#FFFFFF',
        },
      },

      // ── Typography ────────────────────────────────────────────────────────
      fontFamily: {
        brand: ['"Inria Sans"', 'Georgia', 'serif'],
        ui:    ['"LINE Seed JP App_OTF"', '"Noto Sans JP"', '"Hiragino Sans"',
                '"Yu Gothic"', 'sans-serif'],
      },

      fontSize: {
        'paw-logo':   ['32.9px', { lineHeight: '39.5px', letterSpacing: '0.1em'  }],
        'ui-lg':      ['18px',   { lineHeight: '23.4px', letterSpacing: '0.02em' }],
        'ui-md':      ['16px',   { lineHeight: '20.8px', letterSpacing: '0.02em' }],
        'ui-tag':     ['13px',   { lineHeight: '16.9px', letterSpacing: '0.1em'  }],
        'ui-body':    ['14px',   { lineHeight: '21px',   letterSpacing: '0.02em' }],
        'ui-caption': ['13px',   { lineHeight: '16.9px', letterSpacing: '0.02em' }],
        'ui-label':   ['11px',   { lineHeight: '1.4',    letterSpacing: '0.02em' }],
      },

      // ── Spacing ───────────────────────────────────────────────────────────
      spacing: {
        'pad-x':      '23.5px', // horizontal page padding (Figma frame)
        'modal-max':  '520px',  // desktop modal max-width
      },

      // ── Border Width ──────────────────────────────────────────────────────
      borderWidth: {
        '1.5': '1.5px',  // outline button / photo cell border
      },

      // ── Border Radius ─────────────────────────────────────────────────────
      borderRadius: {
        'input':  '12px', // inputs, textareas, photo cells
        'btn':    '8px',  // primary button
        'card':   '16px', // cards
        'modal':  '24px', // desktop modal
        'sheet':  '28px', // mobile bottom sheet (top corners)
      },

      // ── Box Shadow ────────────────────────────────────────────────────────
      boxShadow: {
        'cta':   '0 6px 20px rgba(217, 119, 87, 0.35)',
        'card':  '0 1px 4px rgba(0,0,0,0.06)',
        'modal': '0 8px 40px rgba(0,0,0,0.18)',
      },

      // ── Keyframes ─────────────────────────────────────────────────────────
      keyframes: {
        'paw-appear': {
          '0%':   { opacity: '0', transform: 'scale(0.6) rotate(var(--paw-rot, 0deg))' },
          '60%':  { opacity: '1', transform: 'scale(1.1) rotate(var(--paw-rot, 0deg))' },
          '100%': { opacity: '1', transform: 'scale(1)   rotate(var(--paw-rot, 0deg))' },
        },
        'slide-up': {
          '0%':   { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%':   { transform: 'scale(0.92)', opacity: '0' },
          '100%': { transform: 'scale(1)',    opacity: '1' },
        },
        'fade-in': {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      animation: {
        'paw-appear': 'paw-appear 0.35s ease-out forwards',
        'slide-up':   'slide-up 0.32s cubic-bezier(0.32,0,0.67,0) forwards',
        'scale-in':   'scale-in 0.22s ease-out forwards',
        'fade-in':    'fade-in 0.2s ease-out forwards',
      },
    },
  },
  plugins: [],
}
