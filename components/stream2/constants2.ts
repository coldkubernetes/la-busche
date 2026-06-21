/**
 * Stream v2 — tuning constants ("finger through marbles / thick water").
 *
 * v2 is a SECOND, independent variant of the hidden ambient toy. It shares v1's
 * light primitives (palette, sprite glow, the rare-drift seeding, the optional
 * confluence tone) but replaces v1's interaction model wholesale:
 *
 *   v1 = inject-and-keep velocity → particles coast like pucks on ice, the
 *        field can be swept empty.
 *   v2 = DISPLACEMENT + heavy DAMPING + a RESTORING spring → the finger parts
 *        the field and it closes back in; nothing coasts; it cannot be emptied.
 *
 * The two numbers that define the whole feel are first, on purpose.
 */

// ── THE TWO NUMBERS — read and tune these FIRST ─────────────────────────────
// Velocity retained per frame. Below 1 so NOTHING coasts: the field goes still
// almost the instant the finger stops. Lower = thicker / more viscous water.
export const DAMPING = 0.82;
// Spring pull back toward each particle's home in the even spread. This is what
// makes the field ALWAYS want to be full — you physically cannot empty it.
// Higher = snappier refill (more "marbles"); lower = lazier (more "thick water").
export const RESTORING_STRENGTH = 0.012;

// ── The displacement field (the finger) ─────────────────────────────────────
// Reach of the finger, in px. Within this radius particles are shouldered
// radially OUTWARD, away from the pointer — never along its travel direction.
export const POINTER_RADIUS = 110;
// How hard the finger parts the field. Pure displacement; no inherited velocity.
export const DISPLACE_STRENGTH = 2.6;

// ── The even spread (what "full" looks like) ────────────────────────────────
// Hard-capped pool. Sized for a midrange phone at a steady frame budget (120–180).
export const PARTICLE_COUNT = 160;
// How irregular the rest grid is (0 = perfect lattice, 1 = fully scattered).
export const HOME_JITTER = 0.62;
// Slow breathing around home, in px, so a settled field still reads as alive
// suspended light rather than a frozen grid. Scaled down for reduced-motion.
export const AMBIENT = 2.4;

// ── Visual classes (the variety v1 flattened) ───────────────────────────────
// Fraction of the pool that are the brighter, larger "glints". The rest are
// faint motes. The third class — the rare drift object — is seeded per day below.
export const GLINT_CHANCE = 0.16;
// Twinkle: a slow, gentle brightness wobble. Speed in radians/ms.
export const TWINKLE_SPEED = 0.0016;

// ── "It kept going without you." ────────────────────────────────────────────
// v2's version of the kept-going effect: the suspended field has gently
// rearranged while you were away. Units: px of home drift accrued per second
// absent, hard-capped so a week away still reads as a small, legible shift.
export const DRIFT_RATE = 0.8;
export const MAX_DRIFT_PX = 34;

// ── The hand-shape whisper (deletable) ──────────────────────────────────────
// Same hard restriction as v1: to remove the entire effect, delete this
// constant and the one line in palette.ts that reads STIR_TINT_AMOUNT. v2
// reuses v1's palette module directly, so there is nothing extra to remove here.
// (Kept as a named re-export point only for discoverability.)

// ── Confluence tone (optional, off by default) ──────────────────────────────
// Reuses v1's Web-Audio ConfluenceTone. Starts muted, only ever on first touch.
export const CONFLUENCE_TONE = false;

// ── Dismissal (same guilt-free close as v1) ─────────────────────────────────
// Press-and-hold STILL to close. v2 keeps its own copy so the door is
// independently removable. Move past the tolerance and the hold is cancelled.
export const CLOSE_HOLD_MS = 650;
export const CLOSE_MOVE_TOLERANCE = 12;

// ── Hidden activation (the v2 door) ─────────────────────────────────────────
// v2 opens on a LONG-PRESS on the empty menu background — the same dead space
// v1 counts taps on, but a held press, not taps. No visual hint. A press that
// moves too far or releases early does nothing. Lives here so the door is
// independently removable alongside the component.
export const LONG_PRESS_MS = 1500;
export const LONG_PRESS_MOVE_TOLERANCE = 12;
