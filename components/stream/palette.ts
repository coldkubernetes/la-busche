/**
 * Palette — a few harmonious presets, all built from HSL so the surface can be
 * tinted continuously. The "hand-shape whisper" lives here as a single, barely
 * perceptible hue drift driven by the rolling stir-energy value.
 *
 * Kept decoupled from the canvas so it can be reused elsewhere later.
 */

import { STIR_TINT_AMOUNT } from './constants';

export interface Palette {
  /** Solid background fill. */
  bg: string;
  /** Translucent fill drawn each frame to leave soft trails (no hard edges). */
  trail: string;
  /** Colour of an ordinary water/light particle. */
  dot: string;
  /** Colour of the rare drifting object — distinct, a touch warmer/brighter. */
  rare: string;
}

interface Preset {
  name: string;
  bgH: number; bgS: number; bgL: number;
  dotH: number; dotS: number; dotL: number;
  rareH: number; rareS: number; rareL: number;
}

// Restrained, glassy, unhurried. Cool water tones with one warmer member so the
// daily rotation has a little life without ever getting loud.
const PRESETS: Preset[] = [
  // deep slate-blue water (matches the app's indigo night palette)
  { name: 'slate', bgH: 230, bgS: 30, bgL: 7, dotH: 215, dotS: 55, dotL: 70, rareH: 45, rareS: 75, rareL: 72 },
  // teal mountain stream
  { name: 'teal', bgH: 200, bgS: 32, bgL: 7, dotH: 185, dotS: 50, dotL: 68, rareH: 32, rareS: 70, rareL: 70 },
  // dusk violet
  { name: 'dusk', bgH: 250, bgS: 30, bgL: 8, dotH: 255, dotS: 45, dotL: 72, rareH: 200, rareS: 60, rareL: 75 },
];

/** Pick a preset for the given day so the base mood shifts gently over time. */
export function presetForDay(dayIndex: number): Preset {
  return PRESETS[((dayIndex % PRESETS.length) + PRESETS.length) % PRESETS.length];
}

/**
 * Build the concrete palette. `stirEnergy` (0..1) nudges exactly one property —
 * the particle hue — by at most STIR_TINT_AMOUNT degrees. That is the whole
 * whisper: never shown, never explained, just slowly theirs.
 *
 * TO DELETE THE WHISPER: drop the STIR_TINT_AMOUNT import + constant and change
 * the `dotH` line below to `const dotH = preset.dotH;`. Nothing else changes.
 */
export function makePalette(preset: Preset, stirEnergy: number): Palette {
  const dotH = preset.dotH + STIR_TINT_AMOUNT * (stirEnergy * 2 - 1); // ← the one line
  return {
    bg: `hsl(${preset.bgH} ${preset.bgS}% ${preset.bgL}%)`,
    trail: `hsla(${preset.bgH} ${preset.bgS}% ${preset.bgL}% / 0.22)`,
    dot: `hsl(${dotH} ${preset.dotS}% ${preset.dotL}%)`,
    rare: `hsl(${preset.rareH} ${preset.rareS}% ${preset.rareL}%)`,
  };
}
