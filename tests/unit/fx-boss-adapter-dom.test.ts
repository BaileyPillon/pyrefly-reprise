/**
 * Step 3 of the new spell effects (motion pass, lane "fx"): the adapter to the other lanes' motion hooks (Bailey's numbers for hit-stop, punch and rumble), the FFX-2 ability name slab's timing and
 * DOM behaviour (a minimal fake document), the ids in the tables against the game data (rule 6: nothing here names an ability the data does not have), and the retail Overdrive banner's CSS.
 */
import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it } from 'vitest';
import { defaultAbilities as FFX2_FALLBACK } from '../../src/battle/ffx2/abilities.ts';
import { ABILITIES as FFX_ABILITIES } from '../../src/data/ffx/index.ts';
import { ABILITIES as FFX2_ABILITIES } from '../../src/data/ffx2/index.ts';
import { SEYMOUR_FLUX_ABILITIES } from '../../src/data/ffx/enemies/seymour-flux-abilities.ts';
import { BOSS_FX_TABLE, OD_AURA_OF, PSEUDO_FX } from '../../src/engine/spellfx/BossFx.ts';
import { FX_BEATS, fxBeat, fxMotionHooks, setFxMotionHooks } from '../../src/engine/spellfx/FxMotionAdapter.ts';
import { setFxChapter, setFxMode } from '../../src/engine/spellfx/FxSwitch.ts';
import { AbilityNameSlab, MAX_HOLD_MS, MIN_HOLD_MS, OUT_MS, SLAB_COMMANDS, slabState } from '../../src/ui/ffx2/NameSlab.ts';

afterEach(() => {
  setFxMotionHooks({});
  setFxMode(null);
  setFxChapter(undefined);
});

describe('the ids in the tables are the data\'s own', () => {
  it('every FFX id names an ability the game data has (Seymour Flux\'s rows, Kimahri\'s Overdrives), every FFX-2 id one of Bahamut\'s, the engine\'s fallbacks or the Dark Knight\'s', () => {
    for (const id of Object.keys(BOSS_FX_TABLE.ffx)) {
      if (id.startsWith('fx:')) continue;
      const known = id in SEYMOUR_FLUX_ABILITIES || id in FFX_ABILITIES;
      expect(known, `ffx ${id}`).toBe(true);
    }
    for (const id of Object.keys(BOSS_FX_TABLE.ffx2)) {
      if (id.startsWith('fx:')) continue;
      const known = id in FFX2_ABILITIES || FFX2_FALLBACK.get(id) !== undefined;
      expect(known, `ffx2 ${id}`).toBe(true);
    }
  });

  it('the pseudo ids are not abilities: neither game\'s data has them', () => {
    for (const id of Object.values(PSEUDO_FX)) {
      expect(id in FFX_ABILITIES || id in FFX2_ABILITIES || FFX2_FALLBACK.get(id) !== undefined).toBe(false);
    }
  });

  it('the game of each ability\'s row matches the table it is in (rule 14: an FFX move is never an FFX-2 one)', () => {
    for (const id of Object.keys(BOSS_FX_TABLE.ffx)) {
      const row = SEYMOUR_FLUX_ABILITIES[id] ?? FFX_ABILITIES[id];
      if (row) expect(row.game, id).toBe('ffx');
    }
    for (const id of Object.keys(BOSS_FX_TABLE.ffx2)) {
      const row = FFX2_ABILITIES[id] ?? FFX2_FALLBACK.get(id);
      if (row) expect(row.game, id).toBe('ffx2');
    }
  });

  it('Total Annihilation is five hits and the effect has five marks; Impulse and Darkness hit more than one target', () => {
    expect(SEYMOUR_FLUX_ABILITIES['total-annihilation']!.hits).toBe(5);
    expect(FFX2_ABILITIES['x2-bahamut-impulse']!.targeting).toBe('all-enemies');
    expect(FFX2_ABILITIES['x2-dark-knight-darkness']!.targeting).toBe('all-enemies');
  });

  it('only Tidus and Auron have an aura of their own (the footage shows those two); the rest is neutral', () => {
    expect(Object.keys(OD_AURA_OF).sort()).toEqual(['auron', 'tidus']);
  });
});

describe('the adapter to the other lanes\' hooks', () => {
  it('Bailey\'s numbers: hit-stop 3 to 4 frames on big moments, punch 2 to 3 percent, rumble light', () => {
    for (const [kind, n] of Object.entries(FX_BEATS)) {
      if (n.hitStop > 0) expect(n.hitStop, kind).toBeGreaterThanOrEqual(3);
      expect(n.hitStop, kind).toBeLessThanOrEqual(4);
      if (n.punch > 0) {
        expect(n.punch, kind).toBeGreaterThanOrEqual(0.02);
        expect(n.punch, kind).toBeLessThanOrEqual(0.03);
      }
      expect(n.rumble, kind).toBeLessThanOrEqual(0.6);
    }
    expect(FX_BEATS['od-open'].hitStop).toBe(0); // the opening is quiet; the strike stops
    expect(FX_BEATS['od-strike'].hitStop).toBeGreaterThan(0);
  });

  it('is inert with nothing registered: the beat answers with an empty log', () => {
    expect(fxMotionHooks()).toEqual({});
    expect(fxBeat('od-open', 'tidus').called).toEqual([]);
    expect(fxBeat('boss-big', 'mortiorchis').called).toEqual([]);
  });

  it('calls only the hooks a beat asks for, with the numbers of the table', () => {
    const got: string[] = [];
    setFxMotionHooks({
      anticipate: (id, ms) => got.push(`anticipate ${id} ${ms}`),
      smear: (id) => got.push(`smear ${id}`),
      hitStop: (f) => got.push(`hitStop ${f}`),
      punch: (a) => got.push(`punch ${a}`),
      rumble: (s, ms) => got.push(`rumble ${s} ${ms}`),
    });
    expect(fxBeat('od-open', 'tidus', { ms: 1200 }).called).toEqual(['anticipate', 'smear', 'rumble']);
    expect(fxBeat('od-strike', 'tidus').called).toEqual(['hitStop', 'punch', 'rumble']);
    expect(got).toEqual(['anticipate tidus 1200', 'smear tidus', 'rumble 0.2 260', 'hitStop 4', 'punch 0.025', 'rumble 0.5 320']);
  });

  it('REDUCE MOTION turns off shake, punch, freeze and rumble only: characters still wind up and smear', () => {
    const got: string[] = [];
    setFxMotionHooks({ anticipate: () => got.push('a'), smear: () => got.push('s'), hitStop: () => got.push('h'), punch: () => got.push('p'), rumble: () => got.push('r') });
    expect(fxBeat('od-open', 'tidus', { calm: true }).called).toEqual(['anticipate', 'smear']);
    expect(fxBeat('boss-big', 'mortiorchis', { calm: true }).called).toEqual([]);
    expect(got).toEqual(['a', 's']);
  });

  it('a hook set can be replaced and cleared', () => {
    setFxMotionHooks({ rumble: () => undefined });
    expect(fxBeat('boss-charge', 'bahamut').called).toEqual(['rumble']);
    setFxMotionHooks({});
    expect(fxBeat('boss-charge', 'bahamut').called).toEqual([]);
  });
});

describe('the FFX-2 ability name slab', () => {
  it('its life: in, held at least 1.4 s and at most 3.2 s, out for 240 ms, gone', () => {
    expect(slabState(0, null)).toBe('in');
    expect(slabState(300, null)).toBe('hold');
    expect(slabState(MAX_HOLD_MS - 1, null)).toBe('hold'); // an action that never ends still lets go
    expect(slabState(MAX_HOLD_MS + 10, null)).toBe('out');
    expect(slabState(MAX_HOLD_MS + OUT_MS + 1, null)).toBe('gone');
    // an action that ended early still gets the minimum
    expect(slabState(MIN_HOLD_MS - 50, 400)).toBe('hold');
    expect(slabState(MIN_HOLD_MS + 50, 400)).toBe('out');
    // an action that ended late holds until then
    expect(slabState(2000, 2400)).toBe('hold');
    expect(slabState(2500, 2400)).toBe('out');
  });

  it('names the commands that carry a name: an ability, an Overdrive, a summon, a trigger; not an attack, an item, a defend or a dress change', () => {
    for (const k of ['ability', 'overdrive', 'summon', 'trigger']) expect(SLAB_COMMANDS.has(k), k).toBe(true);
    for (const k of ['attack', 'item', 'defend', 'spherechange', 'escape', 'switch']) expect(SLAB_COMMANDS.has(k), k).toBe(false);
  });

  /** Just enough of a document: elements with a class, a dataset, a style, a parent. */
  function fakeOverlay(): { overlay: HTMLElement; kids: FakeEl[] } {
    const kids: FakeEl[] = [];
    class FakeEl {
      className = '';
      dataset: Record<string, string> = {};
      textContent = '';
      style = { props: {} as Record<string, string>, left: '', top: '', setProperty(k: string, v: string) { this.props[k] = v; } };
      remove(): void {
        const i = kids.indexOf(this);
        if (i >= 0) kids.splice(i, 1);
      }
    }
    const overlay = { ownerDocument: { createElement: () => new FakeEl() }, appendChild: (el: FakeEl) => void kids.push(el) } as unknown as HTMLElement;
    return { overlay, kids };
  }
  type FakeEl = { className: string; dataset: Record<string, string>; textContent: string; style: { left: string; top: string; props: Record<string, string> } };

  const startEvent = (actorId: string, name: string, kind = 'ability'): never => ({ type: 'action-start', actorId, abilityName: name, command: { kind }, targets: [], seq: 0 }) as never;

  it('draws nothing with the new effects off', () => {
    const { overlay, kids } = fakeOverlay();
    const slab = new AbilityNameSlab({ overlay: () => overlay, scale: () => 1, head: () => ({ x: 100, y: 200 }) });
    slab.start(startEvent('rikku', 'Darkness'));
    expect(kids).toHaveLength(0);
    expect(slab.count).toBe(0);
  });

  it('with them on, raises one over the girl\'s head, follows her, lets go after the action, and removes itself', () => {
    setFxMode('new');
    setFxChapter('ffx2-bahamut');
    const { overlay, kids } = fakeOverlay();
    let head = { x: 100, y: 200 };
    const slab = new AbilityNameSlab({ overlay: () => overlay, scale: () => 2, head: () => head });
    slab.start(startEvent('rikku', 'Darkness'));
    expect(kids).toHaveLength(1);
    const el = kids[0]! as unknown as FakeEl;
    expect(el.textContent).toBe('Darkness');
    expect(el.style.left).toBe('100px');
    expect(Number.parseFloat(el.style.top)).toBeLessThan(200); // above the head
    expect(el.style.props['--ns-scale']).toBe('2');
    head = { x: 140, y: 190 };
    slab.update(0.016);
    expect(el.style.left).toBe('140px');
    slab.end('rikku');
    slab.update(1.5);
    expect(el.dataset['state']).toBe('out');
    slab.update(0.3);
    expect(kids).toHaveLength(0);
    expect(slab.count).toBe(0);
  });

  it('skips a plain attack, and a move with no name, and a girl who is not on the field is left where she was put', () => {
    setFxMode('new');
    setFxChapter('ffx2-bahamut');
    const { overlay, kids } = fakeOverlay();
    const slab = new AbilityNameSlab({ overlay: () => overlay, scale: () => 1, head: () => null });
    slab.start(startEvent('rikku', 'Attack', 'attack'));
    slab.start(startEvent('rikku', '', 'ability'));
    expect(kids).toHaveLength(0);
    slab.start(startEvent('rikku', 'Darkness'));
    expect(kids).toHaveLength(1);
    slab.dispose();
    expect(kids).toHaveLength(0);
  });

  it('a second move of the same girl retires her last slab', () => {
    setFxMode('new');
    setFxChapter('ffx2-bahamut');
    const { overlay, kids } = fakeOverlay();
    const slab = new AbilityNameSlab({ overlay: () => overlay, scale: () => 1, head: () => ({ x: 1, y: 100 }) });
    slab.start(startEvent('yuna', 'Cure'));
    slab.update(2);
    slab.start(startEvent('yuna', 'Cura'));
    slab.update(0.3);
    expect(kids.map((k) => (k as unknown as FakeEl).textContent)).toEqual(['Cura']);
  });
});

describe('the retail Overdrive banner and the slab: the CSS says what the notes say', () => {
  const css = readFileSync(new URL('../../src/ui/common/transitions/od-retail.css', import.meta.url), 'utf8');
  const nameCss = readFileSync(new URL('../../src/ui/ffx2/name-slab.css', import.meta.url), 'utf8');

  it('the banner sits at the very top, full width, dark violet, with an orange label tab', () => {
    expect(css).toContain('.pf-mom__slab--odretail');
    expect(css).toMatch(/top:\s*0/);
    expect(css).toMatch(/width:\s*100%/);
    expect(css).toMatch(/rgba\(38, 18, 82/); // dark violet
    expect(css).toMatch(/#e8861e/); // the orange OVERDRIVE tab
  });

  it('the slab has the gold border and the dark ground', () => {
    expect(nameCss).toMatch(/border:\s*1px solid #e3b94a/);
    expect(nameCss).toMatch(/rgba\(9, 8, 18/);
  });
});
