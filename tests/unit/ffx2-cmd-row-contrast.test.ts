/**
 * PR-0018, the FFX-2 half (iteration 2, B6): every command-row state reads at 4.5:1 or better.
 *
 * Two FFX-2 row states failed on the declared colours alone:
 * - **disabled**: the shared `.ig-cmd--disabled` fades the whole row to 42 % opacity, so the label
 *   and the face both blend into the dark painted scene (FFX measured 1.98 to 2.25:1 on the same
 *   rule and took the "inverted slab" in round 10, `ffx-hud.css`); FFX-2 had no override;
 * - **selected, on the Change submenu**: the gate line (`GRANTS: …`) was pyre pink on the
 *   selected row's pyre-pink face, 1:1, invisible exactly on the row being chosen.
 *
 * Read from the sheets themselves; the live pixels are measured on a production build.
 * Game case: FFX-2 only (`ffx2-hud.css`; FFX's half is its own file).
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..', 'src', 'ui');
const HUD = readFileSync(join(ROOT, 'ffx2', 'ffx2-hud.css'), 'utf8');
const TOKENS = readFileSync(join(ROOT, 'inkgold', 'tokens.css'), 'utf8');

function token(name: string): string {
  const m = new RegExp(`${name}:\\s*(#[0-9a-fA-F]{6})`).exec(TOKENS);
  if (!m) throw new Error(`no token ${name}`);
  return m[1]!;
}

function lum(hex: string): number {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0]! + 0.7152 * c[1]! + 0.0722 * c[2]!;
}

function contrast(a: string, b: string): number {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x! + 0.05) / (y! + 0.05);
}

function block(selector: string): string {
  const esc = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const m = new RegExp(`(?:^|\\n|\\})\\s*${esc}\\s*\\{([^}]*)\\}`).exec(HUD);
  expect(m, selector).not.toBeNull();
  return m![1]!;
}

function hexIn(decls: string, prop: string): string {
  const m = new RegExp(`${prop}:\\s*(#[0-9a-fA-F]{6})`).exec(decls);
  expect(m, prop).not.toBeNull();
  return m![1]!;
}

describe('PR-0018 (FFX-2): command-row states at 4.5:1', () => {
  it('a disabled row is an opaque dark slab with a light label, never a 42 % fade', () => {
    const row = block('.ffx2hud .ig-cmd--disabled');
    expect(row).toMatch(/opacity:\s*1/);
    const bg = hexIn(row, 'background');
    const fg = hexIn(row, 'color');
    expect(contrast(fg, bg)).toBeGreaterThanOrEqual(4.5);
    const label = block('.ffx2hud .ig-cmd--disabled .ffx2cmd__label');
    expect(contrast(hexIn(label, 'color'), bg)).toBeGreaterThanOrEqual(4.5);
  });

  it("the selected row's gate line is ink on the pink face, not pink on pink", () => {
    const pink = token('--ig-pyre-pink');
    const grants = block('.ffx2hud .ig-cmd--selected .ffx2cmd__grants');
    expect(grants).toMatch(/color:\s*var\(--ig-ink\)/);
    expect(contrast(token('--ig-ink'), pink)).toBeGreaterThanOrEqual(4.5);
  });

  it('the Overdrive row keeps its pink gate line on its ink face', () => {
    const od = block('.ffx2hud .ig-cmd--overdrive .ffx2cmd__grants');
    expect(od).toMatch(/color:\s*var\(--ig-accent\)/);
    expect(contrast(token('--ig-pyre-pink'), token('--ig-ink'))).toBeGreaterThanOrEqual(4.5);
  });
});
