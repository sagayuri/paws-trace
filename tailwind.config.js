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
      // Mapped 1-to-1 from Figma unique fill colors
      colors: {
        brand: {
          // Primary palette
          teal:       '#22807F', // primary / icon / logo stroke
          dark:       '#1A2E2D', // body text / headings
          cta:        '#D97757', // CTA button (orange-salmon)

          // Backgrounds
          sand:       '#E6D6B5', // hero background (beige)
          'sand-mid': '#ECE2CE', // card lines / dividers
          cream:      '#FCF1D8', // poster icon background
          surface:    '#F6F6F6', // bottom card / wave fill

          // Accent
          green:      '#406D1F', // MISSING text / tagline accent
          yellow:     '#EBC04D', // amber accent
          red:        '#ED1C24', // location pin
          charcoal:   '#444444', // general dark (topImage overlay)
        },
      },

      // ── Typography ────────────────────────────────────────────────────────
      // Figma text styles → fontSize / fontWeight / letterSpacing / lineHeight
      fontFamily: {
        // Figma: "Inria Sans" — used for PAW TRACE logotype
        brand:  ['"Inria Sans"', 'Georgia', 'serif'],
        // Figma: "LINE Seed JP App_OTF" — used for all UI text
        // Falls back to system Japanese fonts when not loaded
        ui:     ['"LINE Seed JP App_OTF"', '"Noto Sans JP"', '"Hiragino Sans"',
                 '"Yu Gothic"', 'sans-serif'],
      },

      fontSize: {
        // Figma scale (px values from style inspection)
        'paw-logo':   ['32.9px', { lineHeight: '39.5px', letterSpacing: '0.1em'  }], // PAW TRACE
        'ui-lg':      ['18px',   { lineHeight: '23.4px', letterSpacing: '0.02em' }], // section title large
        'ui-md':      ['16px',   { lineHeight: '20.8px', letterSpacing: '0.02em' }], // section title / button
        'ui-tag':     ['13px',   { lineHeight: '16.9px', letterSpacing: '0.1em'  }], // tagline / badge (bold)
        'ui-body':    ['14px',   { lineHeight: '21px',   letterSpacing: '0.02em' }], // body / description
        'ui-caption': ['13px',   { lineHeight: '16.9px', letterSpacing: '0.02em' }], // small caption
      },

      fontWeight: {
        // Figma weights used
        normal: '400',
        bold:   '700',
      },

      // ── Spacing / Radius (inferred from Figma frame layout) ───────────────
      borderRadius: {
        'btn': '16px',   // CTA button (rounded-2xl equivalent)
        'card': '24px',  // bottom card corners
      },

      // ── Box Shadow ────────────────────────────────────────────────────────
      boxShadow: {
        'cta': '0 6px 20px rgba(217, 119, 87, 0.35)',  // CTA button glow
      },

      // ── Keyframes for paw-print trail animation ───────────────────────────
      keyframes: {
        'paw-appear': {
          '0%':   { opacity: '0', transform: 'scale(0.6) rotate(var(--paw-rot, -42deg))' },
          '60%':  { opacity: '1', transform: 'scale(1.1) rotate(var(--paw-rot, -42deg))' },
          '100%': { opacity: 'var(--paw-opacity, 0.55)', transform: 'scale(1) rotate(var(--paw-rot, -42deg))' },
        },
      },
      animation: {
        'paw-appear': 'paw-appear 0.35s ease-out forwards',
      },
    },
  },
  plugins: [],
}
