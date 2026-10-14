// @vitest-environment jsdom
/**
 * COLOUR VISION (PR-0032; `src/ui/common/colourVision.ts`): OFF, RED-GREEN, BLUE-YELLOW, changing ONLY the four groups that collapse under a
 * simulation of colour blindness, each with a second cue besides colour. One block per group, and one for the table:
 *
 *   tints     FFX only    Berserk and Curse tint on the painted fighter        second cue: B or C over the head
 *   target    both games  targeting bracket and plate: ally and self           second cue: a diamond, a plus or a ring on the corners
 *                         (the round's page tagged it FFX; FFX-2's HUD draws the same corners, plate and pool, so it is both)
 *   numerals  both games  the heal and MP damage numbers                       second cue: "+" on a heal (printed today), "MP" on an MP numeral
 *   gates     FFX-2 only  the Garment Grid gates                               second cue: the gate's letter R, G, B or Y
 *
 * The table is scored with the round's own simulation (`helpers/cvdSim.ts`, the page's arithmetic): every group's closest pair, today and in
 * the mode that is meant to fix it. The numbers asserted are the page's (`cvd-modes.json`). OFF is today: no attribute, no variable, no mark,
 * no changed colour. `access-off-is-today.test.ts` pins that across the build.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

import { SaveStore } from '../../src/app/SaveData.ts';
import { ACCENT, TargetHighlight } from '../../src/engine/TargetHighlight.ts';
import { applyComfort } from '../../src/app/applyComfort.ts';
import { COLOUR_VISION_MODES, type ColourVision } from '../../src/app/saveAccess.ts';
import { DamageNumbers } from '../../src/ui/common/DamageNumbers.ts';
import { textFor } from '../../src/ui/common/damageLadder.ts';
import {
  CVD_GAME,
  CVD_OVERRIDES,
  CVD_TODAY,
  cvdColour,
  cvdInitial,
  cvdOr,
  cvdTint,
  cvdVars,
  gateLetter,
  hexToInt,
  type CvdGroup,
  type CvdMode,
} from '../../src/ui/common/colourVision.ts';
import { StatusFigureTint, paintLookOf, type TintField, type TintFigure } from '../../src/ui/common/statusFigureTint.ts';
import { StatusMarks, marksFor } from '../../src/ui/common/statusMarks.ts';
import { openSpherechangeWheel, type GarmentGridDef } from '../../src/ui/ffx2/SpherechangeWheel.ts';
import { minPair, simulate, type Kind } from './helpers/cvdSim.ts';

const read = (p: string): string => readFileSync(resolve(__dirname, '..', '..', p), 'utf8');
const mem = (): Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> => {
  const m = new Map<string, string>();
  return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => void m.set(k, String(v)), removeItem: (k) => void m.delete(k) };
};
const html = (): HTMLElement => document.documentElement;

afterEach(() => {
  applyComfort({});
  document.body.innerHTML = '';
});

// ===================================================================== the table, scored

/** The members of each group the round scored together (the colours that must be told apart inside one context). */
const ITEMS: Record<CvdGroup, string[]> = {
  tints: ['zombie', 'berserk', 'curse'],
  target: ['enemy', 'ally', 'self'],
  numerals: ['damage', 'crit', 'heal', 'mp', 'miss'],
  gates: ['red', 'green', 'blue', 'yellow'],
};
const GROUPS = Object.keys(ITEMS) as CvdGroup[];
const KINDS: Record<CvdMode, Kind[]> = { 'red-green': ['protan', 'deutan'], 'blue-yellow': ['tritan'] };

function items(group: CvdGroup, mode: ColourVision): Record<string, string> {
  return Object.fromEntries(ITEMS[group].map((k) => [k, cvdColour(group, k as never, mode)]));
}
const closest = (group: CvdGroup, mode: ColourVision, kind: Kind): number => minPair(items(group, mode), kind).de;

describe('the table, scored with the round\'s simulation', () => {
  /** What the page recorded for today's colours, per group, worst pair per kind of colour blindness (`cvd-modes.json`, "today"). */
  const TODAY: Record<CvdGroup, Partial<Record<Kind, number>>> = {
    tints: { protan: 2.9, deutan: 3.7, tritan: 10.1 },
    target: { protan: 17.9, deutan: 20.1, tritan: 6.2 },
    numerals: { protan: 12.3, deutan: 14.9, tritan: 8.2 },
    gates: { protan: 8.9, deutan: 10.9, tritan: 15.3 },
  };
  /** What the page recorded for each mode, for the kinds it is for. */
  const CLAIM: Partial<Record<CvdGroup, Partial<Record<CvdMode, Partial<Record<Kind, number>>>>>> = {
    tints: { 'red-green': { protan: 33.1, deutan: 32.4 }, 'blue-yellow': { tritan: 38.1 } },
    target: { 'red-green': { protan: 27.5, deutan: 26.6 }, 'blue-yellow': { tritan: 21.6 } },
    numerals: { 'blue-yellow': { tritan: 14.4 } }, // RED-GREEN leaves the numerals as they are (the page: "Unchanged")
    gates: { 'red-green': { protan: 18.2, deutan: 20.5 }, 'blue-yellow': { tritan: 28.4 } },
  };

  it.each(GROUPS)('%s: today\'s closest pair is the round\'s number', (group) => {
    for (const [kind, want] of Object.entries(TODAY[group]) as Array<[Kind, number]>) {
      expect(closest(group, 'off', kind), `${group} ${kind}`).toBeCloseTo(want, 1);
    }
  });

  it('the four groups are the ones that fall under 12 today; nothing else is claimed', () => {
    const under = GROUPS.filter((g) => (['protan', 'deutan', 'tritan'] as const).some((k) => closest(g, 'off', k) < 12));
    expect(under.sort()).toEqual(['gates', 'numerals', 'target', 'tints']);
  });

  it.each(GROUPS.flatMap((g) => (Object.keys(CLAIM[g] ?? {}) as CvdMode[]).map((m) => [g, m] as const)))('%s under %s: the closest pair is the page\'s number, and clear of 12', (group, mode) => {
    for (const [kind, want] of Object.entries(CLAIM[group]![mode]!) as Array<[Kind, number]>) {
      const got = closest(group, mode, kind);
      expect(got, `${group} ${mode} ${kind}`).toBeCloseTo(want, 1);
      expect(got, `${group} ${mode} ${kind} is clear of the confusable band`).toBeGreaterThan(12);
    }
  });

  it.each(GROUPS)('%s: each mode is better than today for the kinds it is for, or leaves the group exactly as it was', (group) => {
    for (const mode of COLOUR_VISION_MODES.filter((m): m is CvdMode => m !== 'off')) {
      const moved = Object.keys(CVD_OVERRIDES[mode][group] ?? {}).length > 0;
      for (const kind of KINDS[mode]) {
        if (!moved) expect(closest(group, mode, kind), `${group} ${mode} ${kind} unchanged`).toBeCloseTo(closest(group, 'off', kind), 6);
        else expect(closest(group, mode, kind), `${group} ${mode} ${kind}`).toBeGreaterThanOrEqual(closest(group, 'off', kind));
      }
    }
  });

  it('every colour a mode moves is one of the four groups, and only the colours the round named', () => {
    expect(Object.keys(CVD_TODAY).sort()).toEqual([...GROUPS].sort());
    for (const mode of Object.keys(CVD_OVERRIDES) as CvdMode[]) {
      for (const [group, moved] of Object.entries(CVD_OVERRIDES[mode]) as Array<[CvdGroup, Record<string, string>]>) {
        expect(GROUPS, group).toContain(group);
        for (const key of Object.keys(moved)) expect(Object.keys(CVD_TODAY[group]), `${group}.${key} exists today`).toContain(key);
      }
    }
    // the colours that stay, by name: enemy gold, Zombie green, every damage and crit and miss numeral, HEAL's green
    for (const mode of ['red-green', 'blue-yellow'] as const) {
      expect(cvdColour('target', 'enemy', mode)).toBe(CVD_TODAY.target.enemy);
      expect(cvdColour('tints', 'zombie', mode)).toBe(CVD_TODAY.tints.zombie);
      for (const k of ['damage', 'crit', 'heal', 'miss'] as const) expect(cvdColour('numerals', k, mode), k).toBe(CVD_TODAY.numerals[k]);
    }
  });

  it('the games: tints FFX, target and numerals both, gates FFX-2 (AGENTS.md rule 14)', () => {
    expect(CVD_GAME).toEqual({ tints: 'ffx', target: 'both', numerals: 'both', gates: 'ffx2' });
  });

  it('simulate: the round\'s own check that a hue really does collapse (Berserk red against Curse brown under protan)', () => {
    expect(simulate('#ff9a86', 'protan')).not.toBe('#ff9a86');
    expect(simulate('#abcdef', 'normal')).toBe('#abcdef');
  });
});

describe('cvdColour, cvdOr, cvdVars', () => {
  it('OFF is today: nothing is moved, no variable is written', () => {
    for (const g of GROUPS) for (const k of ITEMS[g]) expect(cvdColour(g, k as never, 'off'), `${g}.${k}`).toBe((CVD_TODAY[g] as Record<string, string>)[k]);
    expect(cvdVars('off')).toEqual({});
    expect(cvdOr('gates', 'red', 'off', '#D0343C'), 'a caller\'s own constant comes back untouched, in its own case').toBe('#D0343C');
  });

  it('a mode moves exactly what its table names', () => {
    expect(cvdColour('target', 'ally', 'red-green')).toBe('#56b4e9');
    expect(cvdColour('target', 'self', 'red-green')).toBe('#f4f1e8');
    expect(cvdColour('target', 'ally', 'blue-yellow'), 'BLUE-YELLOW keeps the ally mint').toBe(CVD_TODAY.target.ally);
    expect(cvdColour('target', 'self', 'blue-yellow')).toBe('#f4f1e8');
    expect(cvdColour('numerals', 'mp', 'blue-yellow')).toBe('#b48cf0');
    expect(cvdColour('numerals', 'mp', 'red-green'), 'RED-GREEN leaves MP').toBe(CVD_TODAY.numerals.mp);
    expect(cvdColour('gates', 'red', 'red-green')).toBe('#d55e00');
    expect(cvdColour('gates', 'green', 'blue-yellow')).toBe('#00a6a6');
    expect(cvdColour('gates', 'red', 'blue-yellow'), 'BLUE-YELLOW keeps the gate red').toBe(CVD_TODAY.gates.red);
    expect(cvdOr('gates', 'blue', 'blue-yellow', '#3A78BE')).toBe('#7a4fd0');
  });

  it('a mode writes every variable colour-vision.css reads, so no rule needs a fallback', () => {
    const css = read('src/ui/common/colour-vision.css');
    const used = new Set([...css.matchAll(/var\((--cvd-[a-z-]+)\)/g)].map((m) => m[1]!));
    for (const mode of ['red-green', 'blue-yellow'] as const) {
      const vars = cvdVars(mode);
      for (const name of used) expect(vars, `${mode} ${name}`).toHaveProperty(name);
      for (const v of Object.values(vars)) expect(v).toMatch(/^#[0-9a-f]{6}$/);
    }
    expect(used.size).toBeGreaterThanOrEqual(8);
  });

  it('applyComfort puts the mode on <html>, writes the variables, and OFF takes every one of them away', () => {
    applyComfort({ colourVision: 'red-green' });
    expect(html().dataset['colourVision']).toBe('red-green');
    expect(html().style.getPropertyValue('--cvd-target-ally')).toBe('#56b4e9');
    expect(html().style.getPropertyValue('--cvd-gate-r')).toBe('#d55e00');
    applyComfort({ colourVision: 'blue-yellow' });
    expect(html().dataset['colourVision']).toBe('blue-yellow');
    expect(html().style.getPropertyValue('--cvd-target-ally'), 'ally mint stays under BLUE-YELLOW').toBe('#7ee8b0');
    expect(html().style.getPropertyValue('--cvd-mp-lo')).toBe('#b48cf0');
    applyComfort({ colourVision: 'off' });
    expect(html().hasAttribute('data-colour-vision')).toBe(false);
    for (const name of Object.keys(cvdVars('red-green'))) expect(html().style.getPropertyValue(name), name).toBe('');
    applyComfort({ colourVision: 'puce' as never });
    expect(html().hasAttribute('data-colour-vision'), 'an unknown value reads as OFF').toBe(false);
  });
});

// ===================================================================== tints (FFX only)

describe('tints: Berserk and Curse on the painted fighter (FFX only)', () => {
  const ON = { berserk: {}, curse: {} };

  it('OFF is today: the red hue 0xff9a86 and the murky brown 0xc9a77c, Zombie\'s green', () => {
    expect(paintLookOf('ffx', { berserk: {} }).tint).toBe(0xff9a86);
    expect(paintLookOf('ffx', { curse: {} }).tint).toBe(0xc9a77c);
    expect(paintLookOf('ffx', { zombie: {} }).tint).toBe(0xa6e39a);
    expect(paintLookOf('ffx', { berserk: {} }, 'off')).toEqual(paintLookOf('ffx', { berserk: {} }));
  });

  it('RED-GREEN moves both: magenta Berserk, dark umber Curse; Zombie stays', () => {
    expect(paintLookOf('ffx', { berserk: {} }, 'red-green').tint).toBe(0xc46bb5);
    expect(paintLookOf('ffx', { curse: {} }, 'red-green').tint).toBe(0x5e5648);
    expect(paintLookOf('ffx', { zombie: {} }, 'red-green').tint).toBe(0xa6e39a);
  });

  it('BLUE-YELLOW moves Curse only', () => {
    expect(paintLookOf('ffx', { berserk: {} }, 'blue-yellow').tint).toBe(0xff9a86);
    expect(paintLookOf('ffx', { curse: {} }, 'blue-yellow').tint).toBe(0x5e5648);
  });

  it('FFX-2 never changes: its Curse is a grey darkening, it has no Berserk look, and the tint helper is not asked about them', () => {
    expect(paintLookOf('ffx2', { curse: {} }, 'red-green').tint).toBe(0x9e9e9e);
    expect(paintLookOf('ffx2', { curse: {} }, 'blue-yellow').tint).toBe(0x9e9e9e);
    expect(paintLookOf('ffx2', { berserk: {} }, 'red-green').tint).toBeNull();
    expect(cvdTint('zombie', 'red-green')).toBeUndefined();
    expect(cvdTint('berserk', 'red-green')).toBe(hexToInt('#c46bb5'));
  });

  it('the second cue: a B over a Berserk fighter and a C over a Curse one, in either mode, in FFX only; none with OFF', () => {
    expect(marksFor('ffx', { berserk: {} })).toEqual([]);
    for (const mode of ['red-green', 'blue-yellow'] as const) {
      expect(marksFor('ffx', { berserk: {} }, mode)).toEqual(['initial-b']);
      expect(marksFor('ffx', { curse: {} }, mode)).toEqual(['initial-c']);
      expect(marksFor('ffx', ON, mode)).toEqual(['initial-b', 'initial-c']);
      expect(marksFor('ffx2', ON, mode), 'FFX-2 draws none').toEqual([]);
      expect(marksFor('ffx', { zombie: {}, poison: {} }, mode), 'Zombie keeps its smoke and nothing more').toEqual(['smoke', 'bubbles']);
    }
    expect(cvdInitial('berserk')).toBe('B');
    expect(cvdInitial('curse')).toBe('C');
    expect(cvdInitial('zombie')).toBeNull();
  });

  const state = (statuses: Record<string, unknown>): never =>
    ({ combatants: { kimahri: { alive: true, removed: false, flags: {}, statuses } }, result: null }) as never;

  it('the status layer draws the letter, and follows a change of mode on resume without waiting for an event', () => {
    let mode: ColourVision = 'off';
    const marks = new StatusMarks('ffx', () => mode);
    marks.sync(state({ berserk: {} }));
    expect(marks.snapshot()).toEqual({});
    mode = 'red-green';
    marks.update(0.016, null);
    expect(marks.snapshot()).toEqual({ kimahri: 'initial-b' });
    const letter = marks.el.querySelector('.stm--initial-b i');
    expect(letter?.textContent).toBe('B');
    mode = 'off';
    marks.update(0.016, null);
    expect(marks.snapshot(), 'OFF takes the letter away again').toEqual({});
    marks.dispose();
  });

  it('the painted-figure tint follows a change of mode, too', () => {
    const set: number[] = [];
    const fig: TintFigure = { setTint: (c) => void set.push(Number(c)), update: () => undefined, traverse: () => undefined };
    const field: TintField = { actor: () => fig };
    let mode: ColourVision = 'off';
    const tint = new StatusFigureTint('ffx', () => field, () => mode);
    tint.sync(state({ berserk: {} }));
    expect(set.at(-1)).toBe(0xff9a86);
    mode = 'red-green';
    tint.update(0.016);
    expect(set.at(-1)).toBe(0xc46bb5);
    mode = 'off';
    tint.update(0.016);
    expect(set.at(-1)).toBe(0xff9a86);
    tint.dispose();
  });
});

// ===================================================================== target (both games)

describe('target: the bracket, plate and label of who the cursor is on (both games)', () => {
  const css = read('src/ui/common/colour-vision.css');
  const today = read('src/ui/ffx/ffx-hud.css');

  it('today: ally mint, enemy gold, self sky, in the bracket, the plate and the ALL label', () => {
    expect(today).toMatch(/\.ffx-target--ally \{ --ffx-mark: #7ee8b0; \}/);
    expect(today).toMatch(/\.ffx-target--enemy \{ --ffx-mark: #f2c21e; \}/);
    expect(today).toMatch(/\.ffx-target--self \{ --ffx-mark: #8fd0f0; \}/);
    expect(today).toMatch(/\.ffx-target__plate--ally \{ --ffx-plate-mark: #7ee8b0; \}/);
    expect(today).toMatch(/\.ffx-target__plate--self \{ --ffx-plate-mark: #8fd0f0; \}/);
    expect(today).toMatch(/\.ffx-target__all--ally \{ --ffx-all-mark: #7ee8b0; \}/);
    expect(CVD_TODAY.target).toEqual({ enemy: '#f2c21e', ally: '#7ee8b0', self: '#8fd0f0' });
  });

  it('under a mode the ally and self marks take the mode\'s colours (bracket, plate, ALL label); enemy is not recoloured', () => {
    expect(css).toMatch(/html\[data-colour-vision\] :is\(\.ffxhud, \.ffx2hud\) \.ffx-target--ally \{ --ffx-mark: var\(--cvd-target-ally\); \}/);
    expect(css).toMatch(/html\[data-colour-vision\] :is\(\.ffxhud, \.ffx2hud\) \.ffx-target--self \{ --ffx-mark: var\(--cvd-target-self\); \}/);
    expect(css).toMatch(/\.ffx-target__plate--ally \{ --ffx-plate-mark: var\(--cvd-target-ally\); \}/);
    expect(css).toMatch(/\.ffx-target__plate--self \{ --ffx-plate-mark: var\(--cvd-target-self\); \}/);
    expect(css).toMatch(/\.ffx-target__all--ally \{ --ffx-all-mark: var\(--cvd-target-ally\); \}/);
    expect(css).not.toMatch(/\.ffx-target--enemy \{ --ffx-mark/);
  });

  it('the second cue: a diamond on an enemy\'s corners, a plus on an ally\'s, a ring on yourself\'s, inside the L, in the bracket\'s colour', () => {
    expect(css).toMatch(/\.ffx-target--enemy \.ffx-target__c::after \{[^}]*background: var\(--ffx-mark\);[^}]*rotate\(45deg\)/);
    expect(css).toMatch(/\.ffx-target--ally \.ffx-target__c::after \{[^}]*linear-gradient\(var\(--ffx-mark\), var\(--ffx-mark\)\) center \/ 100% 2px[^}]*center \/ 2px 100%/);
    expect(css).toMatch(/\.ffx-target--self \.ffx-target__c::after \{[^}]*border: 2px solid var\(--ffx-mark\);[^}]*border-radius: 50%/);
    for (const corner of ['tl', 'tr', 'bl', 'br']) expect(css, corner).toContain(`.ffx-target__c--${corner}::after`);
  });

  it('the accent pool under the figure takes the same colour as the bracket: the FFX HUD declares it, the highlight paints it', () => {
    const painted: Array<number | null> = [];
    const actor = { setSelectAccent: (c: number | null): void => void painted.push(c), setDim: (): void => undefined };
    const field = { actor: () => actor as never, staged: () => ['kimahri'] };
    const light = new TargetHighlight(field);
    light.apply({ ids: ['kimahri'], mode: 'single', side: null, accent: 'ally' });
    expect(painted.at(-1), 'no colour: the accent as it has always been').toBe(ACCENT.ally);
    light.apply({ ids: ['kimahri'], mode: 'single', side: null, accent: 'ally', colour: hexToInt(cvdColour('target', 'ally', 'red-green')) });
    expect(painted.at(-1)).toBe(0x56b4e9);
    light.apply({ ids: ['kimahri'], mode: 'single', side: null, accent: 'self', colour: hexToInt(cvdColour('target', 'self', 'blue-yellow')) });
    expect(painted.at(-1)).toBe(0xf4f1e8);
    const hud = read('src/ui/ffx/FFXBattleHud.ts');
    expect(hud, 'the FFX HUD declares the colour').toMatch(/colour: hexToInt\(cvdColour\('target', kind, cvd\)\)/);
    expect(read('src/ui/ffx2/FFX2BattleHud.ts'), 'and so does FFX-2\'s, except for its own pink accent').toMatch(/accent === 'ffx2' \? \{\} : \{ colour: hexToInt\(cvdColour\('target', accent, cvd\)\) \}/);
  });

  it('every rule is under html[data-colour-vision] and one of the two HUDs: FFX-2\'s own pink flower reticle and TARGET plate are not touched, OFF matches nothing', () => {
    expect(css).not.toContain('ffx2-tplate');
    expect(css).not.toContain('ffx-target__flower');
    const selectors = [...css.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/(?:^|\})\s*([^{}@\s][^{}]*)\{/g)].map((m) => m[1]!.trim()).filter((s) => s.includes('ffx-target'));
    expect(selectors.length).toBeGreaterThan(8);
    for (const s of selectors) expect(s, s).toMatch(/^html\[data-colour-vision\] :is\(\.ffxhud, \.ffx2hud\) /);
  });
});

// ===================================================================== numerals (both games)

describe('numerals: the heal and MP damage numbers (both games)', () => {
  it('the second cue: a heal already prints "+" (OFF and ON), an MP numeral prints "MP" under a mode; damage, a crit and a miss never change', () => {
    expect(textFor('heal', 120)).toBe('+120');
    expect(textFor('heal', 120, true)).toBe('+120');
    expect(textFor('mp', 40)).toBe('40');
    expect(textFor('mp', 40, true)).toBe('40 MP');
    expect(textFor('damage', 880, true)).toBe('880');
    expect(textFor('critical', 880, true)).toBe('880');
    expect(textFor('miss', undefined, true)).toBe('MISS');
  });

  const spawn = (mode: ColourVision, event: Record<string, unknown>): string => {
    const store = new SaveStore('cvd-numerals-' + mode, mem());
    store.setSettings({ colourVision: mode });
    const root = document.createElement('div');
    document.body.appendChild(root);
    const n = new DamageNumbers({ root, project: () => ({ x: 100, y: 100 }), scale: () => 1 });
    return n.spawnEvent(event as never)!.textContent ?? '';
  };

  it('the real numerals layer: an MP numeral reads "40 MP" only under a mode, and a heal reads "+120" always', () => {
    expect(spawn('off', { type: 'mp-damage', targetId: 'yuna', amount: 40 })).toBe('40');
    expect(spawn('red-green', { type: 'mp-damage', targetId: 'yuna', amount: 40 })).toBe('40 MP');
    expect(spawn('blue-yellow', { type: 'mp-heal', targetId: 'yuna', amount: 40 })).toBe('40 MP');
    expect(spawn('off', { type: 'heal', targetId: 'yuna', amount: 120 })).toBe('+120');
    expect(spawn('blue-yellow', { type: 'heal', targetId: 'yuna', amount: 120 })).toBe('+120');
    expect(spawn('blue-yellow', { type: 'damage', targetId: 'yuna', amount: 120 })).toBe('120');
  });

  it('the stylesheet: today\'s MP is sky blue (#8fd0f0 to #3a8fd0); under a mode it reads the variables, which carry violet under BLUE-YELLOW and today\'s blue under RED-GREEN', () => {
    expect(read('src/ui/common/damage-numbers.css')).toMatch(/\.dnum--mp \{\s*background: linear-gradient\(180deg, #8fd0f0 0%, #3a8fd0 100%\);/);
    expect(read('src/ui/common/colour-vision.css')).toMatch(/html\[data-colour-vision\] \.dnum--mp \{\s*background: linear-gradient\(180deg, var\(--cvd-mp-hi\) 0%, var\(--cvd-mp-lo\) 100%\);/);
    expect(cvdVars('red-green')['--cvd-mp-hi']).toBe('#8fd0f0');
    expect(cvdVars('red-green')['--cvd-mp-lo']).toBe('#3a8fd0');
    expect(cvdVars('blue-yellow')['--cvd-mp-hi']).toBe('#d9c6f8');
    expect(cvdVars('blue-yellow')['--cvd-mp-lo']).toBe('#b48cf0');
  });
});

// ===================================================================== gates (FFX-2 only)

describe('gates: the Garment Grid\'s gates (FFX-2 only)', () => {
  const GRID: GarmentGridDef = {
    id: 'triangle',
    name: 'Triangle Grid',
    nodes: [{ dressphereId: 'gunner' }, { dressphereId: 'thief' }, { dressphereId: 'warrior' }, { dressphereId: 'white-mage' }],
    links: [
      { from: 0, to: 1, gate: 'red', gateEffectLabel: 'Firestrike (this battle)' },
      { from: 1, to: 2, gate: 'green' },
      { from: 2, to: 3, gate: 'blue' },
      { from: 3, to: 0, gate: 'yellow' },
    ],
  };
  const wheel = (mode: ColourVision): HTMLElement => {
    new SaveStore('cvd-gates-' + mode, mem()).setSettings({ colourVision: mode });
    const root = document.createElement('div');
    document.body.appendChild(root);
    void openSpherechangeWheel({ root, grid: GRID, state: { id: 'triangle', nodePosition: 0, passedGates: [], wornThisBattle: [] }, actorName: 'Yuna', onCancel: () => undefined });
    return root;
  };
  const fills = (root: HTMLElement): string[] => [...root.querySelectorAll<SVGElement>('.ffx2sc__gate')].map((c) => c.getAttribute('fill') ?? '');
  const letters = (root: HTMLElement): string[] => [...root.querySelectorAll('.ffx2sc__gate-letter')].map((t) => t.textContent ?? '');

  it('OFF is today: the four gate orbs in §4.5.2\'s colours, no letter', () => {
    const root = wheel('off');
    expect(fills(root)).toEqual(['#D0343C', '#4FB05E', '#3A78BE', '#E3B94A']);
    expect(letters(root)).toEqual([]);
  });

  it('RED-GREEN: the Okabe-Ito four, each orb printing its letter', () => {
    const root = wheel('red-green');
    expect(fills(root)).toEqual(['#d55e00', '#009e73', '#0072b2', '#f0e442']);
    expect(letters(root)).toEqual(['R', 'G', 'B', 'Y']);
  });

  it('BLUE-YELLOW: green becomes cyan and blue becomes violet; red and yellow stay; the letters print', () => {
    const root = wheel('blue-yellow');
    expect(fills(root)).toEqual(['#D0343C', '#00a6a6', '#7a4fd0', '#E3B94A']);
    expect(letters(root)).toEqual(['R', 'G', 'B', 'Y']);
  });

  it('the gate line under the picked node takes the mode\'s colour too, and still says GRANTS with the effect', () => {
    const line = (root: HTMLElement): HTMLElement => root.querySelector<HTMLElement>('.ffx2sc__gate-line')!;
    expect(line(wheel('off')).style.color).toMatch(/^(#d0343c|rgb\(208, 52, 60\))/i);
    document.body.innerHTML = '';
    const rg = wheel('red-green');
    expect(line(rg).style.color).toMatch(/^(#d55e00|rgb\(213, 94, 0\))/i);
    expect(line(rg).textContent).toContain('GRANTS: Firestrike (this battle)');
  });

  it('the party-prep grid pips carry the gate\'s letter and take the mode\'s colours; the letter shows only under a mode', () => {
    expect(['red', 'green', 'blue', 'yellow'].map(gateLetter)).toEqual(['R', 'G', 'B', 'Y']);
    expect(read('src/ui/ffx2/party-prep/panels.ts')).toMatch(/data-gate="\$\{gateLetter\(c\)\}"/);
    const css = read('src/ui/common/colour-vision.css');
    expect(css).toMatch(/html\[data-colour-vision\] \.x2prep-gate--red \{ background: var\(--cvd-gate-r\); \}/);
    expect(css).toMatch(/html\[data-colour-vision\] \.x2prep-gate::after \{\s*content: attr\(data-gate\);/);
    expect(read('src/ui/ffx2/party-prep/party-prep.css'), 'today\'s pip has no letter').not.toContain('attr(data-gate)');
  });

  it('SpherechangeFlourish takes the mode\'s gate colour through the same table', () => {
    const src = read('src/ui/ffx2/SpherechangeFlourish.ts');
    expect(src).toContain("cvdOr('gates', lastGate, readColourVision(), GATE_HEX[lastGate] ?? colour)");
  });
});
