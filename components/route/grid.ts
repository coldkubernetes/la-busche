/**
 * Route — the grid/tile data model and the ASCII-map parser.
 *
 * A layout (see layouts.ts) is parsed into a flat tile grid plus the spawn and a
 * dot tally. Everything downstream (movement, eating, rendering) is tile-based
 * and uses only cheap integer/float math — no per-pixel collision, no engine.
 *
 * Movement is center-to-center: the bus always heads toward a neighbouring tile
 * CENTRE (integer tile coords). On arrival it eats whatever pellet is there,
 * then either takes a buffered turn, continues straight, or stops. That single
 * rule produces the Pac-Man cornering feel exactly, and is trivial to reason
 * about. See Route.tsx for where it lives.
 */

import type { RouteLayout } from './layouts';

/** A tile is one of four kinds. Stored as a small int for a compact flat grid. */
export const enum Tile {
  Wall = 0,
  Empty = 1,
  Dot = 2,
  Stop = 3,
}

export interface Grid {
  cols: number;
  rows: number;
  /** Flat row-major grid of Tile values, length cols*rows. */
  tiles: Uint8Array;
  /** Bus spawn tile (centre coords are the integer col/row). */
  spawn: { col: number; row: number };
  /** Total pellets (dots + stops) at parse time — the completion target. */
  dotCount: number;
}

const isStreet = (t: Tile) => t !== Tile.Wall;

/** Parse one ASCII layout into a Grid, validating it in development. */
export function parseLayout(layout: RouteLayout): Grid {
  const map = layout.map;
  const rows = map.length;
  const cols = rows > 0 ? map[0].length : 0;
  const tiles = new Uint8Array(cols * rows);
  let spawn: { col: number; row: number } | null = null;
  let dotCount = 0;

  for (let row = 0; row < rows; row++) {
    const line = map[row];
    if (process.env.NODE_ENV !== 'production' && line.length !== cols) {
      throw new Error(
        `Route layout "${layout.id}": row ${row} is ${line.length} wide, expected ${cols}.`,
      );
    }
    for (let col = 0; col < cols; col++) {
      const ch = line[col] ?? '#';
      let tile: Tile;
      switch (ch) {
        case '#':
          tile = Tile.Wall;
          break;
        case '.':
          tile = Tile.Dot;
          dotCount++;
          break;
        case 'o':
        case 'O':
          tile = Tile.Stop;
          dotCount++;
          break;
        case '@':
          tile = Tile.Empty;
          spawn = { col, row };
          break;
        default: // ' ' and anything else → plain empty street
          tile = Tile.Empty;
          break;
      }
      tiles[row * cols + col] = tile;
    }
  }

  if (!spawn) {
    if (process.env.NODE_ENV !== 'production') {
      throw new Error(`Route layout "${layout.id}": no spawn ('@') found.`);
    }
    spawn = { col: 1, row: 1 }; // production fallback: never crash a user
  }

  const grid: Grid = { cols, rows, tiles, spawn, dotCount };

  // In development, assert full connectivity so a bad hand-edit fails loudly
  // rather than silently shipping an unwinnable board.
  if (process.env.NODE_ENV !== 'production') {
    const reached = floodFill(grid);
    let streetCount = 0;
    for (let i = 0; i < tiles.length; i++) if (isStreet(tiles[i])) streetCount++;
    if (reached !== streetCount) {
      throw new Error(
        `Route layout "${layout.id}": ${streetCount - reached} street tile(s) unreachable from spawn.`,
      );
    }
  }

  return grid;
}

/** Count street tiles reachable from the spawn (dev-time connectivity check). */
function floodFill(grid: Grid): number {
  const { cols, rows, tiles, spawn } = grid;
  const seen = new Uint8Array(cols * rows);
  const stack = [spawn.row * cols + spawn.col];
  seen[stack[0]] = 1;
  let count = 0;
  const dirs = [1, -1, cols, -cols];
  while (stack.length) {
    const idx = stack.pop()!;
    count++;
    const col = idx % cols;
    for (const d of dirs) {
      const n = idx + d;
      if (n < 0 || n >= tiles.length) continue;
      // Reject horizontal wrap-around (idx on left edge stepping to -1, etc.).
      if (d === 1 && col === cols - 1) continue;
      if (d === -1 && col === 0) continue;
      if (seen[n] || tiles[n] === Tile.Wall) continue;
      seen[n] = 1;
      stack.push(n);
    }
  }
  return count;
}

/** True if (col,row) is on the board and traversable (not a wall). */
export function isTraversable(grid: Grid, col: number, row: number): boolean {
  if (col < 0 || row < 0 || col >= grid.cols || row >= grid.rows) return false;
  return grid.tiles[row * grid.cols + col] !== Tile.Wall;
}

export function tileAt(grid: Grid, col: number, row: number): Tile {
  if (col < 0 || row < 0 || col >= grid.cols || row >= grid.rows) return Tile.Wall;
  return grid.tiles[row * grid.cols + col] as Tile;
}
