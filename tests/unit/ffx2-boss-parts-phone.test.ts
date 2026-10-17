// @vitest-environment jsdom
/**
 * F939-02 (r50; **FFX-2 only**): at 390 px Angra Mainyu's header printed TAWRICH over its SCAN label (the r49 focused review, polish; the `critic/reviews` note says "a seven-letter name in a half-width cell").
 *
 * The cause is the shared FFX-2 phone header, not the chapter: the part rows (`ui/ffx2/BossGauges.ts`) were a two-column grid in `ui/ffx2/phone-hud.css`, each cell 133 px, and a name and its figure that
 * need more than the 112 px a cell leaves them (TAWRICH 76 px and SCAN 53 px; Vegnagun's BULWARK 81 px and REDOUBT 80 px the same; a revealed figure is wider than SCAN) were squeezed by the flex row
 * (`min-width: 34px` let the name shrink below its text) and printed over each other. The rows are now a wrapping row: half the strip while name and figure fit, the whole strip when they do not, a name never
 * narrower than its longest word. Vegnagun's Nodes, which fit, are where they were to the pixel (measured in the browser: the same rectangles before and after).
 *
 * jsdom has no layout, so the geometry is proved in the browser (`docs/handoff/r50-rc.md`, frames in `docs/screenshots/r50-rc/`); this pins what the proof stands on: the markup the CSS styles (a name, a track
 * and a figure, in that order), the phone's four rules, the desktop's untouched rules, and that nothing here reaches FFX or the desktop layout.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { BattleState } from '../../src/battle/common/types.ts';
import { enemyGaugesHtml } from '../../src/ui/ffx2/BossGauges.ts';

const read = (rel: string): string => readFileSync(join(process.cwd(), rel), 'utf8');

const body = (id: string, name: string, extra: Record<string, unknown> = {}): Record<string, unknown> => ({
  id, name, side: 'enemy', alive: true, removed: false, hp: 5440, mp: 0, flags: {}, statuses: {}, stats: { maxHp: 5440, maxMp: 0 }, ...extra,
});

/** The Angra Mainyu strip: the fiend and its two arms, as the chapter's data names them. */
function angraState(): BattleState {
  const angra = body('x2-angra-mainyu', 'Angra Mainyu', { hp: 333444, stats: { maxHp: 333444, maxMp: 0 } });
  const tawrich = body('x2-tawrich', 'Tawrich', { flags: { isPart: true, partOf: 'x2-angra-mainyu' } });
  const zarich = body('x2-zarich', 'Zarich', { hp: 0, alive: false, flags: { isPart: true, partOf: 'x2-angra-mainyu' } });
  return { enemyIds: ['x2-angra-mainyu', 'x2-tawrich', 'x2-zarich'], combatants: { 'x2-angra-mainyu': angra, 'x2-tawrich': tawrich, 'x2-zarich': zarich } } as unknown as BattleState;
}

function strip(revealed: string[] = []): HTMLElement {
  const host = document.createElement('div');
  host.innerHTML = enemyGaugesHtml(angraState(), { bars: [] } as never, { revealed: new Set(revealed), charging: new Map() });
  return host;
}

describe('the part rows: the markup the phone stylesheet lays out', () => {
  it('is a name, a track and a figure, in that order, one row per part under its owner', () => {
    const rows = [...strip().querySelectorAll('.ffx2boss__parts > .ffx2boss__part')];
    expect(rows.map((r) => r.querySelector('.ffx2boss__partname')?.textContent)).toEqual(['Tawrich', 'Zarich']);
    expect(rows[0]!.children[0]!.className).toBe('ffx2boss__partname');
    expect(rows[0]!.children[1]!.className).toBe('ig-bosshp__track');
    expect(rows[0]!.children[2]!.className).toBe('ffx2boss__hint'); // SCAN while the HP is a secret
    expect(rows[0]!.children[2]!.textContent).toBe('SCAN');
  });

  it('keeps that order for the three figures a row can show: SCAN, the revealed numerals and DOWN', () => {
    const rows = [...strip(['x2-tawrich']).querySelectorAll('.ffx2boss__part')];
    expect([...rows[0]!.children].map((c) => c.className.split(' ')[0])).toEqual(['ffx2boss__partname', 'ig-bosshp__track', 'ffx2boss__num']);
    expect(rows[0]!.querySelector('.ffx2boss__num')?.textContent).toBe('5440/5440');
    expect([...rows[1]!.children].map((c) => c.className.split(' ')[0])).toEqual(['ffx2boss__partname', 'ig-bosshp__track', 'ffx2boss__down']);
    expect(rows[1]!.className).toContain('ffx2boss__part--down');
  });
});

describe('the phone stylesheet: wrapping rows that never print a name over its figure', () => {
  const phone = read('src/ui/ffx2/phone-hud.css');
  const rule = (selector: string): string => {
    const at = phone.indexOf(`${selector} {`);
    if (at < 0) throw new Error(`no rule for ${selector} in the FFX-2 phone stylesheet`);
    return phone.slice(at, phone.indexOf('}', at));
  };

  it('the parts are a wrapping flex row (the desktop rule\'s column is switched back), no longer a two-column grid', () => {
    const parts = rule("html[data-phone-battle='ffx2'] .ffx2boss__parts");
    expect(parts).toMatch(/display: flex;/);
    expect(parts).toMatch(/flex-direction: row;/);
    expect(parts).toMatch(/flex-wrap: wrap;/);
    expect(parts).toMatch(/gap: 4px 8px;/);
    expect(parts).not.toMatch(/grid/);
  });

  it('a row is half the strip, grows to the whole strip when alone on a line, and is never narrower than its content', () => {
    const row = rule("html[data-phone-battle='ffx2'] .ffx2boss__part");
    expect(row).toMatch(/flex: 1 1 calc\(50% - 4px\);/);
    expect(row).toMatch(/min-width: min-content;/);
    expect(rule("html[data-phone-battle='ffx2'] .ffx2boss__part:nth-child(odd):last-child")).toMatch(/max-width: calc\(50% - 4px\);/);
  });

  it('a name is never narrower than its longest word (the desktop\'s 34px floor let it shrink below its text)', () => {
    expect(rule("html[data-phone-battle='ffx2'] .ffx2boss__partname")).toMatch(/min-width: min-content;/);
  });

  it('the desktop rules stay as they were: a column of rows with a 34px name floor', () => {
    const desktop = read('src/ui/ffx2/ffx2-hud.css');
    expect(desktop).toMatch(/\.ffx2boss__parts \{\s*display: flex;\s*flex-direction: column;/);
    expect(desktop).toMatch(/\.ffx2boss__partname \{\s*min-width: 34px;/);
  });

  it('every selector this change adds is the FFX-2 phone\'s: nothing for FFX and nothing for the desktop layout', () => {
    const at = phone.indexOf('F939-02');
    const added = phone.slice(at, phone.indexOf('.ffx2boss__part > *', at));
    const selectors = added.split('\n').filter((l) => /\{$/.test(l.trim()) && !l.trim().startsWith('/*'));
    expect(selectors.length).toBeGreaterThanOrEqual(4);
    for (const s of selectors) expect(s.trim(), s).toMatch(/^html\[data-phone-battle='ffx2'\] /);
    expect(read('src/ui/ffx/phone-hud.css')).not.toContain('ffx2boss');
  });
});
