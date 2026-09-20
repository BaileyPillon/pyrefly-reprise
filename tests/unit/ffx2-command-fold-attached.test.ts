/**
 * FFX-2 command menu, gate major (builda1 brief): "the command column runs
 * off the bottom of the frame ... and its scroll chevron is parked at the
 * far right edge, detached from the list."
 *
 * Live measurement (GPU-mode Playwright, 1280x720, seed 1, Chapter 5, Yuna's
 * White Magic — 16 rows, the exact repro the brief names), before this fix:
 * every row's own right edge sat at real-viewport x=1047.6, while
 * `.ffx2cmd__fold--down` (the "more below" chevron `CommandMenu.markFold()`
 * inserts) sat at x=1228-1256 — floating alone ~180 real px to the right of
 * the list, a `docs/screenshots/builda1/boot-and-menus/white-magic-1280x720
 * .png` capture shows isolated in empty space. The column itself never ran
 * past the visible frame (`.ffx2hud__command`'s own bottom, 487, was well
 * inside the 720px-tall stage) — the fold detachment was the real defect.
 *
 * Root cause: `.ig-cmd-stack` (`src/ui/inkgold/slabs.css`, shared with FFX's
 * own command menu) sets no `align-items`, so every fixed-width `.ig-cmd`
 * row renders left-aligned regardless of its own `margin-right` cascade step
 * — the margin only reserves unused trailing space, it never shifts a row.
 * `.ffx2hud__command` had no explicit `width`, so its shrink-to-fit box
 * still counted that unused margin (up to 15 * 7.11 grid px on a 16-row
 * list) toward its own width, growing far wider than any row actually
 * renders. `.ffx2cmd__fold` right-aligns to *that* box (`margin-left: auto`)
 * and so drifted into the resulting dead space.
 *
 * Fix, scoped to this track's owned files only: pin `.ffx2hud__command`'s
 * width to one `.ig-cmd` row's own width (129.78px, `slabs.css`), which
 * removes the dead space the fold was drifting into. `.ig-cmd-stack`'s
 * missing `align-items` is untouched — introducing a cascade that has never
 * been visible before is a new look, not a bugfix, and needs an end-state
 * pick this track was not asked to bring (AGENTS.md rule 9); FFX's own
 * command menu (`ffx-hud.css`, a different container class) never uses this
 * selector and is unaffected either way.
 *
 * After: same live measurement, rows' right edge x=1260.9 (a `.ig-cmd`
 * `transform: skewX()` shifts its own AABB by a few px — present before this
 * fix too, just dwarfed by the ~180px gap), `.ffx2cmd__fold--down` at
 * x=1228-1256 — now sitting flush against the list's own corner, not
 * floating in empty space (`docs/screenshots/builda1/boot-and-menus
 * /white-magic-1280x720-after.png`).
 *
 * jsdom lays nothing out (this file's sibling `ui-ffx2-command-menu.test.ts`
 * notes the same limit for `scrollAffordance`), so the geometry itself is
 * pinned as arithmetic against the stylesheet's own declared numbers, the
 * same technique `pause-compact-and-retina.test.ts` uses for a property-
 * choice defect; the live numbers above are the record of the real repro.
 * Case: FFX-2 only (FFX's command menu is a different component and
 * container class; AGENTS.md rule 14).
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const HUD_CSS = readFileSync(join(process.cwd(), 'src', 'ui', 'ffx2', 'ffx2-hud.css'), 'utf8');
const SLABS_CSS = readFileSync(join(process.cwd(), 'src', 'ui', 'inkgold', 'slabs.css'), 'utf8');

/** The declaration block for one selector (mirrors `pause-compact-and-retina.test.ts`'s `mediaBlock`). */
function ruleBody(sheet: string, selector: string): string {
  const at = sheet.indexOf(`${selector} {`);
  expect(at, `selector "${selector}" is gone`).toBeGreaterThan(-1);
  const from = sheet.indexOf('{', at);
  let depth = 0;
  for (let i = from; i < sheet.length; i++) {
    if (sheet[i] === '{') depth++;
    else if (sheet[i] === '}' && --depth === 0) return sheet.slice(from + 1, i);
  }
  throw new Error(`unterminated block for "${selector}"`);
}

function pxOf(body: string, prop: string): number {
  const match = body.match(new RegExp(`(?:^|;|\\s)${prop}:\\s*([\\d.]+)px`));
  expect(match, `no "${prop}: ...px" in "${body.slice(0, 60)}…"`).not.toBeNull();
  return Number.parseFloat(match![1]!);
}

describe('the FFX-2 command column width matches its own rows (fold attachment)', () => {
  it('.ffx2hud__command is pinned to one .ig-cmd row width, not left to shrink-to-fit', () => {
    const commandWidth = pxOf(ruleBody(HUD_CSS, '.ffx2hud__command'), 'width');
    const rowWidth = pxOf(ruleBody(SLABS_CSS, '.ig-cmd'), 'width');
    expect(commandWidth).toBeCloseTo(rowWidth, 2);
  });

  it('the fold mark still right-aligns to that (now row-matched) box', () => {
    const body = ruleBody(HUD_CSS, '.ffx2cmd__fold');
    expect(body).toMatch(/margin-left:\s*auto/);
  });

  it('stays a live repro, not a stale one: .ig-cmd-stack still has no align-items for the fix comment to explain', () => {
    // If a future change gives `.ig-cmd-stack` an explicit `align-items`
    // (making the cascade margin actually shift rows), the width pin above
    // should be re-measured against the real per-row extent rather than a
    // flat `.ig-cmd` width — that is a design change (a cascade nobody has
    // ever seen) and needs its own end-state pick (AGENTS.md rule 9), not a
    // silent side effect of this test going stale.
    const body = ruleBody(SLABS_CSS, '.ig-cmd-stack');
    expect(body).not.toMatch(/align-items/);
  });
});
