/**
 * Route — tuning constants.
 *
 * The THIRD hidden experience, and the deliberate odd one out: where the two
 * water toys are ambient and unloseable, Route HAS a goal, a score and levels.
 * The challenge is completion + efficiency + flow, never threat — there are no
 * enemies, the bus cannot die, and the only "failure" is simply not finishing.
 *
 * This is the one file to live in while finding the feel. The three numbers you
 * will reach for first are at the very top, on purpose:
 *   BUS_SPEED_TPS         — how fast the bus drives.
 *   FLOW_DECAY_PER_SEC    — how quickly the flow multiplier bleeds away.
 *   TURN_BUFFER_MS        — how long a turn set early stays armed (Pac-Man feel).
 */

// ── THE THREE NUMBERS — read and tune these FIRST ───────────────────────────
// Bus travel speed, in tiles per second. Mazes are sized so a clean run lands
// in ~30–60s at this speed. Higher = twitchier; lower = more meditative.
export const BUS_SPEED_TPS = 5.2;

// How fast the flow multiplier decays, per second, when you are NOT eating.
// This is what makes flow about keeping it ROLLING: stop feeding it and it
// quietly drains back toward 1×. Higher = stricter; lower = more forgiving.
export const FLOW_DECAY_PER_SEC = 0.32;

// How long (ms) a buffered turn stays armed. Set a direction before a junction
// and it takes at the next valid one — but only within this window, so a turn
// queued far too early doesn't surprise you a corridor later. The classic
// "press early, it remembers" cornering window.
export const TURN_BUFFER_MS = 1100;

// ── Flow combo (the quiet second stake) ─────────────────────────────────────
// Flow is a 0..FLOW_MAX value. The on-screen multiplier is (1 + flow), shown
// subtly — never a screaming combo meter. Eating in unbroken succession builds
// it; idling, backtracking and empty stretches let it decay.
export const FLOW_MAX = 1.6; // → up to a 2.6× multiplier at full roll
// Added to flow per ordinary dot eaten. Tuned so a steady run climbs over a
// handful of dots, not instantly.
export const FLOW_GAIN_PER_DOT = 0.14;
// A bus-stop pellet is a deliberate detour that should pay: a chunk of flow on
// top of its bigger score — the brief "flow boost" that rewards routing.
export const FLOW_STOP_BOOST = 0.45;
// One-time flow hit for reversing direction (backtracking). Gentle: enough to
// discourage yo-yoing, not enough to punish a genuine correction.
export const FLOW_BACKTRACK_PENALTY = 0.3;
// Extra decay per second while the bus is idle (stopped against a wall with no
// valid buffered turn). Idling should cost flow faster than merely coasting.
export const FLOW_IDLE_DECAY_PER_SEC = 0.7;

// ── Score ───────────────────────────────────────────────────────────────────
// Base points for an ordinary dot and a bus-stop pellet, each multiplied by the
// live (1 + flow) multiplier at the moment of pickup. The bigger bus-stop
// pellets are worth markedly more — a clear reason to plan a route through them.
export const DOT_VALUE = 10;
export const STOP_VALUE = 150;

// ── The "route complete" beat ────────────────────────────────────────────────
// After the last pellet: hold the finished board for a moment, then dissolve to
// the next route. A tap continues immediately. Calmer (longer, softer) under
// reduced-motion so nothing snaps.
export const COMPLETE_HOLD_MS = 2600;

// ── Rendering (cheap, phone-first) ───────────────────────────────────────────
// Outer breathing room around the maze, in px, so it never kisses the edges.
export const BOARD_PADDING = 18;
// Channel width as a fraction of a tile — the faint "street" stroke. The maze
// reads as soft channels, not loud walls.
export const CHANNEL_FRAC = 0.46;
// Dot and bus-stop glow radii as fractions of a tile.
export const DOT_RADIUS_FRAC = 0.14;
export const STOP_RADIUS_FRAC = 0.3;
// Bus body size as a fraction of a tile.
export const BUS_SIZE_FRAC = 0.78;

// ── Hidden activation (the Route door) ───────────────────────────────────────
// Route opens on a SWIPE across the same empty menu background the water toys
// use — a clear directional drag that TRAVELS this far (px). Discrete taps go
// to v1, a held still press to v2, and a drag this long to here; the three can
// never collide. Lives here so the door is independently removable with the
// component. Kept comfortably above the move-tolerance the menu uses to reject
// taps/long-presses (12px) so a swipe is unambiguous.
export const SWIPE_OPEN_DISTANCE = 60;

// ── Controls ──────────────────────────────────────────────────────────────--
// In-game: minimum travel (px) of a drag before it counts as a steering swipe.
// Below this, a touch is treated as a tap (e.g. to dismiss the complete beat).
export const STEER_SWIPE_MIN = 24;

// ── Dismissal (same guilt-free close as the toys) ────────────────────────────
// Press-and-hold STILL to close. Route keeps its own copy so the door is
// independently removable. Move past the tolerance and the hold is cancelled —
// which, mid-run, simply reads as steering.
export const CLOSE_HOLD_MS = 650;
export const CLOSE_MOVE_TOLERANCE = 12;
