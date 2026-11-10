// @vitest-environment jsdom
/**
 * Test 6, the form half, of the FFX-2 Special look (step D1; game case: FFX-2 only in what is seen: the three Special dresspheres exist only in FFX-2, and the rows below are drawn
 * only for a unit that carries `dresspheres.special`, which no unit does while the switch is OFF).
 *
 * The REAL engine puts each of the three girls into her Special (`formUp`); the party rows of her `activeIds` are then drawn by the real `partyRowHtml`. The OFF half (a row with no
 * form is the string it always was) is `party-rows-off-pin.test.ts`.
 *
 * Removal check: with `formRoleOf` returning `null` the part rows have no crop and no `data-form-role` (the last case builds that world).
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { AtbSnapshot, FFX2Combatant } from '../../src/battle/common/types.ts';
import { parseArtManifest, resetArtManifest, setArtManifest } from '../../src/engine/ArtManifest.ts';
import { partyRowHtml } from '../../src/ui/ffx2/PartyRows.ts';
import { FORM_GIRLS, formUp, type FormGirlId } from './helpers/specialFormState.ts';

const NAMES: Record<FormGirlId, [string, string, string]> = {
  yuna: ['Yuna', 'Right Pistil', 'Left Pistil'],
  rikku: ['Rikku', 'Smasher-R', 'Crusher-L'],
  paine: ['Paine', 'Dextral Wing', 'Sinistral Wing'],
};
const MONOGRAMS: Record<FormGirlId, [string, string]> = { yuna: ['RP', 'LP'], rikku: ['SR', 'CL'], paine: ['DW', 'SW'] };
const BADGE: Record<FormGirlId, [string, string]> = { yuna: ['FF', '#F7B6D9'], rikku: ['MW', '#3E9E96'], paine: ['FT', '#C93A42'] };

type Bar = AtbSnapshot['bars'][number];

interface Rows {
  ids: string[];
  html: string[];
  units: FFX2Combatant[];
  returnTo: string;
}

function rowsOf(girl: FormGirlId): Rows {
  const up = formUp(girl);
  const ids = [...up.state.activeIds];
  const units = ids.map((id) => up.state.combatants[id] as FFX2Combatant);
  const html = ids.map((id, i) => partyRowHtml(units[i]!, (up.snapshot.bars.find((b) => b.actorId === id) ?? null) as Bar | null, { actingId: null, index: i }));
  const returnTo = (units[0] as unknown as { sdsp: { returnTo: string } }).sdsp.returnTo;
  return { ids, html, units, returnTo };
}

const ROWS = new Map<FormGirlId, Rows>(FORM_GIRLS.map((g) => [g.girl, rowsOf(g.girl)]));
const MANIFEST = (art: string[]) =>
  parseArtManifest({ version: 1, generatedAt: '2026-11-10T00:00:00.000Z', subjects: Object.fromEntries(art.map((a) => [a, { states: ['idle'], portrait: false }])), portraits: [], backdrops: [], pause: [] });

beforeEach(() => resetArtManifest());
afterEach(() => resetArtManifest());

describe('the three plates of each Special, from the real engine', () => {
  for (const g of FORM_GIRLS) {
    const rows = ROWS.get(g.girl)!;
    const [main, right, left] = rows.html as [string, string, string];

    it(`${g.girl}: three rows in the order main, right part, left part, with the game's names`, () => {
      expect(rows.ids).toEqual([g.girl, ...g.parts]);
      const names = rows.html.map((h) => /<div class="ig-stat__name">([^<]*)<\/div>/.exec(h)![1]);
      expect(names).toEqual(NAMES[g.girl]);
    });

    it(`${g.girl}: data-form-role is main, right, left, and the form classes follow the role`, () => {
      expect(rows.html.map((h) => /data-form-role="([a-z]+)"/.exec(h)![1])).toEqual(['main', 'right', 'left']);
      for (const h of rows.html) expect(h).toContain(`data-form-special="${g.special}"`);
      expect(main).toMatch(/class="ig-stat ig-stat--form ig-stat--form-main"/);
      expect(right).toMatch(/class="ig-stat ig-stat--form ig-stat--form-part"/);
      expect(left).toMatch(/class="ig-stat ig-stat--form ig-stat--form-part"/);
    });

    it(`${g.girl}: the badge is on the main alone, in the Special's abbreviation and colour`, () => {
      const [abbr, colour] = BADGE[g.girl];
      expect(main).toContain(`<i class="ffx2stat__badge" style="--ffx2-special:${colour}"`);
      expect(main).toContain(`>${abbr}</i>`);
      expect(right).not.toContain('ffx2stat__badge');
      expect(left).not.toContain('ffx2stat__badge');
      // the badge is its own element: the part tiles carry no job chip either
      expect(right).not.toContain('ffx2stat__job');
      expect(left).not.toContain('ffx2stat__job');
    });

    it(`${g.girl}: the main's tile asks for the dress she stood on (read from the real unit), never the figure's crown and never a part id`, () => {
      expect(rows.returnTo).toMatch(/^[a-z-]+$/);
      expect(main).toContain(`characters/${g.girl}-${rows.returnTo}/idle.png`);
      expect(main).not.toContain(`characters/${g.girl}-${g.special}/`);
      for (const p of g.parts) expect(main).not.toContain(p + '/');
    });

    it(`${g.girl}: each part tile has the monogram floor and a crop of the figure's idle painting; no URL carries a part id`, () => {
      const [m1, m2] = MONOGRAMS[g.girl];
      for (const [h, mono] of [[right, m1], [left, m2]] as const) {
        expect(h).toContain(`<span class="ffx2stat__mono">${mono}</span>`);
        expect(h).toMatch(/<img class="ffx2stat__face-img ffx2stat__part-img" src="[^"]*characters\/[a-z]+-[a-z-]+\/idle\.png"/);
        expect(h).toContain(`characters/${g.girl}-${g.special}/idle.png`);
        expect(h).not.toContain('data-face-'); // the portrait refinement passes must not adopt it
      }
      const urls = rows.html.flatMap((h) => [...h.matchAll(/src="([^"]*)"/g)].map((m) => m[1]!));
      for (const u of urls) for (const p of g.parts) expect(u, `${p} in ${u}`).not.toContain(p);
    });
  }

  it('Floral Fallal\'s two part tiles carry the neutral cream, not the pink of the Special', () => {
    const [, right, left] = ROWS.get('yuna')!.html;
    for (const h of [right!, left!]) {
      expect(h).toContain('--ffx2-job:#F4F1E8');
      expect(h).not.toContain('#F7B6D9');
    }
  });

  it('Machina Maw\'s parts are teal and Full Throttle\'s red, as their Specials', () => {
    for (const h of ROWS.get('rikku')!.html.slice(1)) expect(h).toContain('--ffx2-job:#3E9E96');
    for (const h of ROWS.get('paine')!.html.slice(1)) expect(h).toContain('--ffx2-job:#C93A42');
  });
});

describe('the part tile and the art manifest (the doubled-id 404 stays impossible)', () => {
  it('with a manifest that lists the figure\'s art the crop is drawn, and with one that does not, only the monogram floor is', () => {
    for (const g of FORM_GIRLS) {
      const rows = ROWS.get(g.girl)!;
      const art = `${g.girl}-${g.special}`;
      setArtManifest(MANIFEST([art]));
      const listed = rows.units.slice(1).map((c, i) => partyRowHtml(c, null, { actingId: null, index: i + 1 }));
      for (const h of listed) expect(h).toContain('ffx2stat__part-img');
      setArtManifest(MANIFEST([]));
      const unlisted = rows.units.slice(1).map((c, i) => partyRowHtml(c, null, { actingId: null, index: i + 1 }));
      for (const h of unlisted) {
        expect(h).not.toContain('<img');
        expect(h).toContain('ffx2stat__mono');
      }
      // and in neither world does any requested URL name a part
      for (const h of [...listed, ...unlisted]) for (const p of g.parts) expect(h).not.toMatch(new RegExp(`characters/${p}`));
    }
  });
});

describe('a downed part', () => {
  it('shows the KO styling of a downed girl and adds no class of its own', () => {
    const rows = ROWS.get('yuna')!;
    const [, pistil] = rows.units as [FFX2Combatant, FFX2Combatant, FFX2Combatant];
    const alive = partyRowHtml(pistil, null, { actingId: null, index: 1 });
    const down = partyRowHtml({ ...pistil, hp: 0, alive: false }, null, { actingId: null, index: 1 });
    expect(down).toContain('ffx2-hp--ko');
    expect(alive).not.toContain('ffx2-hp--ko');
    const classes = (h: string): string[] => [...h.matchAll(/class="([^"]*)"/g)].flatMap((m) => m[1]!.split(/\s+/)).filter(Boolean);
    const extra = classes(down).filter((c) => !classes(alive).includes(c));
    expect(extra).toEqual(['ffx2-hp--ko']); // the class a downed girl's row gets, and nothing new
    // the same unit as a downed ordinary girl: the same HP class
    const girl = rows.units[0]!;
    expect(partyRowHtml({ ...girl, hp: 0, alive: false }, null, { actingId: null, index: 0 })).toContain('ffx2-hp--ko');
  });
});

describe('the removal check: a unit in no form', () => {
  it('a part with no `special` has no crop and no data-form-role (and a main has no badge)', () => {
    const rows = ROWS.get('yuna')!;
    const strip = (c: FFX2Combatant): FFX2Combatant => ({ ...c, dresspheres: { ...c.dresspheres!, special: undefined } as FFX2Combatant['dresspheres'] });
    const [main, right] = rows.units.map((c) => partyRowHtml(strip(c), null, { actingId: null, index: 0 })) as [string, string];
    expect(right).not.toContain('ffx2stat__part-img');
    expect(right).not.toContain('data-form-role');
    expect(right).not.toContain('ig-stat--form');
    expect(main).not.toContain('data-form-role');
    expect(main).not.toContain('ffx2stat__badge');
    expect(main).not.toContain('ig-stat--form');
  });
});
