/**
 * Route — the handcrafted layouts.
 *
 * Each layout is an ASCII map: an array of equal-length strings, one per row.
 * Hand-edit these freely — the parser (grid.ts) turns them into a tile grid and
 * validates them. Keep them small (phone-sized) and finishable in ~30–60s.
 * Handcrafted reads better than a generator and weighs nothing.
 *
 *   '#'  wall / building   — not traversable
 *   '.'  street + dot      — a waiting passenger, base value
 *   'o'  bus-stop pellet   — a landmark worth more, with a flow boost
 *   ' '  empty street      — traversable, no pellet
 *   '@'  bus spawn         — exactly one per map; an empty street tile
 *
 * Rules for a valid map: rectangular (all rows equal length), exactly one '@',
 * and every street tile reachable from the spawn (no orphaned pockets). The
 * parser asserts these in development so a bad hand-edit fails loudly.
 *
 * The labels are a light Sofia-route flavour — no real-data dependency, just a
 * nod. Reorder or rename at will; the array order is the play order, and it
 * cycles.
 */

export interface RouteLayout {
  /** Stable id — used as the localStorage key for this route's best run. */
  id: string;
  /** Shown in the restrained HUD, e.g. "Route 76". */
  label: string;
  /** The ASCII map; see the legend above. */
  map: string[];
}

export const LAYOUTS: RouteLayout[] = [
  {
    id: 'route-12',
    label: 'Route 12',
    // The gentle opener: a double ring with cross-spokes. Quick to learn the
    // turn-buffer feel; the four corner stops invite a full loop.
    map: [
      '###########',
      '#o.......o#',
      '#.#.###.#.#',
      '#.#.....#.#',
      '#.#.#.#.#.#',
      '#....@....#',
      '#.#.#.#.#.#',
      '#.#.....#.#',
      '#.#.###.#.#',
      '#o.......o#',
      '###########',
    ],
  },
  {
    id: 'route-76',
    label: 'Route 76',
    // Open grid with pillar rows — lots of route choices, rewards committing to
    // a sweep rather than dithering. Corner + edge stops.
    map: [
      '#############',
      '#o.........o#',
      '#.###.#.###.#',
      '#...........#',
      '#.#.#.#.#.#.#',
      '#...........#',
      '##.#.###.#.##',
      '#...........#',
      '#.#.#.#.#.#.#',
      '#...........#',
      '#.###.#.###.#',
      '#o...@.....o#',
      '#############',
    ],
  },
  {
    id: 'route-94',
    label: 'Route 94',
    // Tighter, chambered. Stops tucked in pockets so they cost a small detour —
    // the route-planning one.
    map: [
      '#############',
      '#...........#',
      '#.#####.###.#',
      '#.#...o...#.#',
      '#.#.###.#.#.#',
      '#...#...#...#',
      '#.#.#.#.#.#.#',
      '#@#...#...#o#',
      '#.#.#.#.#.#.#',
      '#...#...#...#',
      '#.#.###.#.#.#',
      '#o..........#',
      '#############',
    ],
  },
  {
    id: 'route-280',
    label: 'Route 280',
    // The long one: a symmetric loop maze, the widest board. A clean flow run
    // here is the real time-attack. Four corner stops anchor the perimeter.
    map: [
      '###############',
      '#o...........o#',
      '#.###.###.###.#',
      '#.#.........#.#',
      '#.#.#####.#.#.#',
      '#...#...#...#.#',
      '#.#.#.#.#.###.#',
      '#.#...#@#.....#',
      '#.#.#.#.#.###.#',
      '#...#...#...#.#',
      '#.#.#####.#.#.#',
      '#.#.........#.#',
      '#.###.###.###.#',
      '#o...........o#',
      '###############',
    ],
  },
  {
    id: 'route-7',
    label: 'Route 7',
    // Wide and breezy: two long avenues with stop pellets studding every
    // junction. Rewards fast, committed left-right sweeps that keep the flow up.
    map: [
      '#############',
      '#o..o...o..o#',
      '#.#.#.#.#.#.#',
      '#...........#',
      '#.###.#.###.#',
      '#@.........o#',
      '#.###.#.###.#',
      '#...........#',
      '#.#.#.#.#.#.#',
      '#o..o...o..o#',
      '#############',
    ],
  },
  {
    id: 'route-305',
    label: 'Route 305',
    // Symmetric chambers around a central spawn. Eight stop pellets ring the
    // board — the route-planning showpiece now that stops pay big.
    map: [
      '###############',
      '#o....o.o....o#',
      '#.###.#.#.###.#',
      '#.#.........#.#',
      '#.#.#.###.#.#.#',
      '#...#.#@#.#...#',
      '#.#.#.#.#.#.#.#',
      '#.#.........#.#',
      '#.###.#.#.###.#',
      '#o....o.o....o#',
      '###############',
    ],
  },
];
