/**
 * Design Tokens — Paw Trace
 * Auto-mapped from Figma file: tRWTL5cnaUKCXWKkbaTSWv (2026-03-18)
 *
 * Usage:
 *   import { colors, typography } from './tokens'
 *   style={{ color: colors.brand.teal }}
 */

// ── Color Tokens ──────────────────────────────────────────────────────────────
export const colors = {
  brand: {
    teal:      '#22807F', // Primary / icon / logo stroke
    dark:      '#1A2E2D', // Body text / headings
    cta:       '#D97757', // CTA button (orange-salmon)
    sand:      '#E6D6B5', // Hero background (beige)
    sandMid:   '#ECE2CE', // Card lines / dividers
    cream:     '#FCF1D8', // Poster icon background
    surface:   '#F6F6F6', // Bottom card / wave fill
    green:     '#406D1F', // MISSING text / tagline accent
    yellow:    '#EBC04D', // Amber accent
    red:       '#ED1C24', // Location pin
    charcoal:  '#444444', // General dark overlay
    white:     '#FFFFFF',
  },
};

// ── Typography Tokens ─────────────────────────────────────────────────────────
export const typography = {
  fontFamily: {
    brand: '"Inria Sans", Georgia, serif',
    ui:    '"LINE Seed JP App_OTF", "Noto Sans JP", "Hiragino Sans", "Yu Gothic", sans-serif',
  },

  // Figma text styles (fontSize / lineHeight / letterSpacing / fontWeight)
  // All values are CSS strings (px) to avoid unitless-number issues in React
  styles: {
    pawLogo:   { fontSize: '32.9px', lineHeight: '39.5px', letterSpacing: '3.29px', fontWeight: 700 },
    uiLarge:   { fontSize: '18px',   lineHeight: '23.4px', letterSpacing: '0.36px', fontWeight: 700 },
    uiMedium:  { fontSize: '16px',   lineHeight: '20.8px', letterSpacing: '0.32px', fontWeight: 700 },
    uiTagline: { fontSize: '13px',   lineHeight: '16.9px', letterSpacing: '1.3px',  fontWeight: 700 },
    uiBody:    { fontSize: '14px',   lineHeight: '21px',   letterSpacing: '0.28px', fontWeight: 400 },
    uiCaption: { fontSize: '13px',   lineHeight: '16.9px', letterSpacing: '0.26px', fontWeight: 400 },
  },
};

// ── Spacing / Layout ──────────────────────────────────────────────────────────
export const layout = {
  frame: { width: 390, height: 844 },  // iPhone 13/14 frame (Figma)
  padX:  23.5,                          // horizontal padding (matches button rect x=23.5)
};

// ── Animation ─────────────────────────────────────────────────────────────────
export const animation = {
  pawTrail: {
    totalMs: 2000, // 2 seconds total
    stepMs:  167,  // 2000 / 12 prints ≈ 167ms per step
  },
};

// ── Paw print positions — exact Figma clipPath coordinates (390×844 frame) ───
// Each entry: x,y = translate origin in frame px; r = clockwise rotation in degrees
// Paths are from Figma node 8:511 (18×18 viewBox) applied via translate(x,y) rotate(r)
export const FIGMA_PAWS = [
  { x:  50.000, y: 279.183, r:  0.000 }, // 0  left-mid
  { x:   5.000, y: 338.814, r:  0.000 }, // 1  lower-left (trail start)
  { x: 112.302, y: 212.395, r:  7.301 }, // 2  center-mid
  { x: 268.471, y: 189.738, r: 52.487 }, // 3  center-right
  { x: 294.581, y:  94.440, r: 20.988 }, // 4  upper-right
  { x: 326.721, y:  47.000, r: 20.988 }, // 5  very upper-right
  { x: 253.564, y: 146.187, r: 23.502 }, // 6  right-mid
  { x: 309.159, y: 143.368, r: 24.340 }, // 7  right-mid-2
  { x: 353.228, y:  94.440, r: 24.340 }, // 8  upper-far-right
  { x: 374.661, y:  15.000, r: 24.340 }, // 9  top-right (trail end)
  { x: 110.846, y: 263.392, r: 33.621 }, // 10 left-mid-2
  { x:  56.775, y: 326.908, r: 33.621 }, // 11 lower-left-2
];

// Animation order: lower-left → upper-right (visual trail path)
export const PAW_ANIM_ORDER = [1, 11, 0, 10, 2, 3, 6, 7, 4, 8, 5, 9];

// Legacy alias — kept so other files that import PAW_POSITIONS still compile
export const PAW_POSITIONS = FIGMA_PAWS.map(p => ({
  l: p.x / 390 * 100,
  t: p.y / 844 * 100,
  r: p.r,
  s: 18,
  o: 0.55,
}));
