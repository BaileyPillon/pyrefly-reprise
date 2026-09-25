/**
 * Chapter VII's party-layout options (`src/scenes/macalania-temple-layout.ts`), Bailey's open pick 3.
 *
 * **Game case: FFX only** [AGENTS.md rule 14]: the FFX command stack over Macalania's party.
 *
 * Pins that every option on the sheet is built exactly as measured, that the scene stands on the
 * option in force, that the pick is one constant which cannot land half-way (the constant and the
 * open-pick list agree), and that the chapter cannot be unlocked while the layout is still today's.
 * The command stack itself is DOM and is measured in the browser
 * (`docs/concepts/chapters/macalania/unlock/party-layout/built/`).
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { PerspectiveCamera, Vector3 } from 'three';
import { describe, expect, it } from 'vitest';

import {
  MACALANIA_PARTY_LAYOUT,
  MACALANIA_PARTY_LAYOUTS,
  macalaniaPartyLayout,
  type MacalaniaPartyLayoutId,
} from '../../../src/scenes/macalania-temple-layout.ts';
import {
  MACALANIA_ENEMY_SLOT,
  MACALANIA_TEMPLE_RIGS,
  MACALANIA_TEMPLE_SLOTS,
} from '../../../src/scenes/macalania-temple.ts';
import { MACALANIA_OPEN_PICKS } from '../../../src/data/chapter-macalania-ship.ts';
import { LOCKED_CHAPTER_IDS } from '../../../src/app/screens/frontend/comingChapters.ts';

const REPO = fileURLToPath(new URL('../../..', import.meta.url));
const IDS: MacalaniaPartyLayoutId[] = ['current', 'a', 'b', 'c'];
const FFX_HUD_RAIL = 0.79;

function idleCam(): PerspectiveCamera {
  const r = MACALANIA_TEMPLE_RIGS.idle!;
  const cam = new PerspectiveCamera(r.fov ?? 32, 16 / 9, 0.1, 200);
  const [px, py, pz] = r.position as [number, number, number];
  const [lx, ly, lz] = r.lookAt as [number, number, number];
  cam.position.set(px, py, pz);
  cam.lookAt(new Vector3(lx, ly, lz));
  cam.updateMatrixWorld();
  cam.updateProjectionMatrix();
  return cam;
}

const screenX = (cam: PerspectiveCamera, s: readonly number[]): number =>
  (new Vector3(s[0], (s[1] ?? 0) + 0.9, s[2]).project(cam).x + 1) / 2;

describe('Chapter VII party layout — the options, as the sheet measured them', () => {
  it('builds exactly the sheet\'s four options (layouts.json)', () => {
    const sheet = JSON.parse(
      readFileSync(join(REPO, 'docs/concepts/chapters/macalania/unlock/party-layout/layouts.json'), 'utf8'),
    ) as Array<{ name: MacalaniaPartyLayoutId; pos?: Record<string, number[]> }>;
    expect(sheet.map((l) => l.name).sort()).toEqual([...IDS].sort());
    for (const l of sheet) {
      const built = MACALANIA_PARTY_LAYOUTS[l.name];
      if (!l.pos) continue; // 'current' is staged by the relaxation, not by the sheet
      expect(built.party, l.name).toEqual([l.pos.tidus, l.pos.yuna, l.pos.rikku]);
      const fiends = Object.entries(l.pos).filter(([id]) => !['tidus', 'yuna', 'rikku'].includes(id));
      expect(Object.entries(built.staging.enemySpots ?? {}).sort(), l.name).toEqual(fiends.sort());
    }
  });

  it("today's layout is untouched (not held); every re-laid option holds the party (the D-041 recipe)", () => {
    expect(MACALANIA_PARTY_LAYOUTS.current.party).toEqual([
      [-1.55, 0, 1.55],
      [-2.95, 0, 0.25],
      [-1.05, 0, -1.05],
    ]);
    expect(MACALANIA_PARTY_LAYOUTS.current.staging).toEqual({});
    for (const id of ['a', 'b', 'c'] as const) expect(MACALANIA_PARTY_LAYOUTS[id].staging.holdParty, id).toBe(true);
  });

  it("B pins only the three ground fiends, by their formation ids; Anima's rise stays the scene's", () => {
    const pins = Object.keys(MACALANIA_PARTY_LAYOUTS.b.staging.enemySpots ?? {}).sort();
    expect(pins).toEqual(['guado-guardian-a', 'guado-guardian-b', 'seymour-macalania']);
    for (const id of pins) expect(id in MACALANIA_ENEMY_SLOT).toBe(true);
  });

  it('keeps every figure of every option on screen and left of the FFX HUD rail at idle (16:9)', () => {
    const cam = idleCam();
    for (const id of IDS) {
      const L = MACALANIA_PARTY_LAYOUTS[id];
      for (const s of [...L.party, ...Object.values(L.staging.enemySpots ?? {})]) {
        const x = screenX(cam, s);
        expect(x, `${id} ${s.join(',')}`).toBeGreaterThan(0.02);
        expect(x, `${id} ${s.join(',')}`).toBeLessThan(FFX_HUD_RAIL);
      }
    }
  });
});

describe('Chapter VII party layout — the pick is one constant', () => {
  it('the scene stands on the option in force (slots and staging switches)', () => {
    const L = macalaniaPartyLayout();
    expect(MACALANIA_TEMPLE_SLOTS.party).toEqual(L.party.map((s) => [...s]));
    expect(MACALANIA_TEMPLE_SLOTS.holdParty).toBe(L.staging.holdParty);
    expect(MACALANIA_TEMPLE_SLOTS.enemySpots).toEqual(L.staging.enemySpots);
  });

  it("the constant and the open-pick list agree: 'current' exactly while the pick is open", () => {
    const open = MACALANIA_OPEN_PICKS.some((p) => p.id === 'party-layout');
    expect(MACALANIA_PARTY_LAYOUT === 'current').toBe(open);
  });

  it("refuses the unlock while the party still stands under the command stack ('current')", () => {
    if (!LOCKED_CHAPTER_IDS.has('seymour-anima-macalania')) expect(MACALANIA_PARTY_LAYOUT).not.toBe('current');
  });
});
