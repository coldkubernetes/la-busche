/**
 * Stream — tuning constants.
 *
 * This is the one file to live in while finding the feel. Everything that is
 * meant to be played with is here, named, and commented. The two you will
 * reach for first are DRIFT_RATE and TAP_RESET_WINDOW_MS.
 */

// ── "It kept going without you." ────────────────────────────────────────────
// The single most important number. How much the scene advances per second of
// absence. Too high and reopening reads as chaos (the thread is lost); too low
// and it feels dead. Units: simulated "arrivals" accrued per second away.
export const DRIFT_RATE = 1 / 45; // ≈ one new arrival per 45s away

// Hard cap on what can accrue while you are gone. A week away should still read
// as "one or two things moved", never a flood. This is what keeps the kept-going
// effect at its sweet spot of ONE or TWO differences.
export const MAX_ARRIVALS_ON_RETURN = 2;

// ── Hidden activation (5 taps on empty menu space) ──────────────────────────
export const TAPS_TO_REVEAL = 5;
// Rolling window allowed between taps. Miss it and the count quietly resets.
// A tune-by-feel number: long enough to be accidental, short enough to be rare.
export const TAP_RESET_WINDOW_MS = 2500;

// ── The surface ─────────────────────────────────────────────────────────────
// Hard-capped pool. Sized for a midrange phone at a steady frame budget.
export const PARTICLE_COUNT = 150;
// Downward bias of the current at rest (px/frame). The current always wins.
export const CURRENT_STRENGTH = 0.18;
// Gentle horizontal meander, so the flow is a stream and not a waterfall.
export const SWAY_STRENGTH = 0.12;
// How quickly the underlying current reclaims a disturbed particle. This is the
// honest meditation: higher = letting-go works faster, fighting works never.
export const SETTLE_RATE = 0.045;
// Finger influence: radius of effect (px) and how hard a drag nudges.
export const POINTER_RADIUS = 90;
export const POINTER_STRENGTH = 0.9;

// ── The rare drift ──────────────────────────────────────────────────────────
// Probability that any given calendar day is a "drift day" on which a single
// distinct object passes through. Seeded per day, so it is discoverable but
// uncommon — rare enough that people mention it to each other.
export const RARE_DRIFT_CHANCE = 0.08;

// ── The hand-shape whisper (deletable) ──────────────────────────────────────
// To remove the entire effect: delete this constant and the one line in
// palette.ts that reads it (see comment there). Zero impact on anything else.
// Max hue degrees the palette drifts based on the rolling stir-energy value.
export const STIR_TINT_AMOUNT = 14;

// ── Confluence tone (optional, off by default) ──────────────────────────────
// Soft sine tone tracking flow. Web Audio, starts muted, only on first touch.
export const CONFLUENCE_TONE = false;

// ── Dismissal ───────────────────────────────────────────────────────────────
// Press-and-hold (still) to close. Subtle, undiscoverable-by-accident, and
// poetic: you go still, and the stream returns you to where you were.
export const HOLD_TO_CLOSE_MS = 650;
export const HOLD_MOVE_TOLERANCE = 12; // px of drift allowed during the hold
