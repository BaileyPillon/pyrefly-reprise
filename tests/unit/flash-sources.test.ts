/**
 * REDUCE FLASHES, source by source (PR-0032; the round's page "Options Screen Additions": 20 flash sources, five of which already had
 * a softer rule in the code that nothing set, and one more found while checking: FFX-2's ready gauge). One case per source, each holding
 * two things: **what the code does today** (the numbers the real presenter, the real rule or the real stylesheet emits, pinned) and
 * **what it does with the setting on** (the softened numbers). Off is today: nothing here is read unless the setting is on.
 *
 * The rule: a lower peak (35 % of full strength), a longer ramp where a CSS pulse is one soft fade, a repeating pulse held steady, never a
 * full-screen white frame; a dark flash (a dimming) is left alone; a white wash of 600 ms or longer is a cover that hides a swap, so it stays
 * opaque but dim. Durations of washes and flashes on a fighter are never changed.
 *
 * Game case (AGENTS.md rule 14), per source, as the round's page tags them:
 *  1 summon FFX | 2 form change FFX | 3 Spherechange FFX-2 | 4 big-attack warning both | 5 element washes both | 6 spell effects both
 *  7 every hit both | 8 heal, revive, petrify, status both | 9 target bracket FFX | 10 party card hurt FFX | 11 girl's card hit FFX-2
 *  12 warning plate both | 13 Overdrive timing flash FFX | 14 Overdrive and Special splash both | 15 impact frame both
 *  16 Save Sphere FFX-2 (Chapter XI) | 17 cutscene flashes both | 18 lens flare both | 19 spell moments both | 20 arena lighting both
 *  21 FFX-2 ready gauge (found while checking) FFX-2 | 22 chain counter veil at chain 20 FFX-2.
 * The stage and the actor are in `flash-stage.test.ts` and `flash-actor.test.ts`; the jsdom covers (16, 17) are `flash-covers.test.ts`.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Scene, Vector3 } from 'three';
import { describe, expect, it } from 'vitest';

import type { BattleEvent } from '../../src/battle/common/types.ts';
import { SaveStore } from '../../src/app/SaveData.ts';
import { battleFlashParams } from '../../src/app/screens/battleSpellFx.ts';
import { BattlePresenter } from '../../src/engine/BattlePresenter.ts';
import type { VfxPort } from '../../src/engine/BattlePresenterPorts.ts';
import { LensFlare } from '../../src/engine/fx/a/LensFlare.ts';
import { planHit, splashMode, type HitInfo, type SpectacleFlags } from '../../src/engine/fx/c/SpectacleRules.ts';
import { bigMoment, spellMoment, type MomentCtx } from '../../src/engine/fx/c/SpellMoments.ts';
import { SPECTACLE_TUNING } from '../../src/engine/fx/c/SpectacleRules.ts';
import { FLASH_PEAK_CAP, IVORY, IVORY_INT, softActorFlash, softWash } from '../../src/engine/flashRules.ts';
import { PHASE_GRADES, PHASE_TWEEN_S } from '../../src/engine/phaseCanon.ts';
import { PhaseLighting, type GradeTarget } from '../../src/engine/PhaseLighting.ts';
import type { ScenePalette } from '../../src/engine/Renderer.ts';
import { DEFAULT_FLASH_PARAMS, REDUCED_FLASH_PARAMS, capActor, filterWash } from '../../src/engine/spellfx/SpellFxParams.ts';
import { FakeActor, FakeAudio, FakeDamageNumbers, FakeMessageBar, FakeStage, noSleep } from './helpers/FakeStage.ts';

const ROOT = resolve(__dirname, '..', '..');
const read = (p: string): string => readFileSync(resolve(ROOT, p), 'utf8');

// ============================================================ the real presenter, recording what it asks of the stage

interface FlashCall {
  colour: number | string | undefined;
  ms: number | undefined;
  peak: number | undefined;
}

class RecActor extends FakeActor {
  readonly flashes: FlashCall[] = [];
  override flash(colour?: number | string, ms?: number, peak?: number): void {
    this.flashes.push({ colour, ms, peak });
    super.flash();
  }
}

class RecStage extends FakeStage {
  readonly washes: Array<{ colour: string | undefined; ms: number | undefined }> = [];
  readonly impacts: Array<{ at: string; crit: boolean; quiet: boolean }> = [];
  constructor(party: string[], enemies: string[]) {
    super(party, enemies);
    for (const id of [...this.actors.keys()]) this.actors.set(id, new RecActor(id, this.calls));
    (this as { vfx: VfxPort }).vfx = {
      ...this.vfx,
      screenFlash: (colour, ms): void => void this.washes.push({ colour, ms }),
      impact: async (at, o): Promise<void> => void this.impacts.push({ at, crit: o?.crit === true, quiet: o?.quiet === true }),
    };
  }
  override async addCombatant(id: string, opts: { artId: string; side: 'party' | 'enemy' | 'aeon'; slot: number }): ReturnType<FakeStage['addCombatant']> {
    const a = new RecActor(id, this.calls);
    this.actors.set(id, a);
    this.sides.set(id, opts.side);
    return a;
  }
  flashesOf(id: string): FlashCall[] {
    return (this.actors.get(id) as RecActor).flashes;
  }
}

type Unsequenced<T> = T extends unknown ? Omit<T, 'seq'> : never;

function setup(reduce = false) {
  const stage = new RecStage(['tidus', 'yuna'], ['seymour-flux', 'mortiorchis']);
  const moments = { letterbox: async (): Promise<void> => {}, nameSlab: async (): Promise<void> => {}, vignette: (): void => {}, clear: (): void => {}, reduceFlashes: (): boolean => reduce };
  const presenter = new BattlePresenter({ stage, damageNumbers: new FakeDamageNumbers(), messageBar: new FakeMessageBar(), audio: new FakeAudio(), moments, sleep: noSleep });
  const play = (events: Array<Unsequenced<BattleEvent>>): Promise<unknown> => presenter.play(events.map((e, i) => ({ ...e, seq: i }) as BattleEvent));
  return { stage, play };
}

const hit = (over: Partial<Extract<BattleEvent, { type: 'damage' }>> = {}): Unsequenced<BattleEvent> => ({
  type: 'damage',
  targetId: 'seymour-flux',
  amount: 1000,
  element: 'none',
  crit: false,
  hitIndex: 0,
  hitCount: 1,
  ...over,
});

/** A flash after the rule, as the actor applies it. */
const softened = (f: FlashCall): { colour: number | string; ms: number; peak: number } => softActorFlash(f.colour ?? 0xffffff, f.ms ?? 180, f.peak ?? 1);

// ===================================================================== 1 to 5: the washes and the flashes the presenter draws

describe('1. Summon (an aeon arrives; FFX)', () => {
  it('today: a white wash, 260 ms. Reduced: ivory at 35 %, 260 ms', async () => {
    const { stage, play } = setup();
    await play([{ type: 'summon', aeonId: 'valefor', combatantId: 'valefor', ownerId: 'yuna' }]);
    expect(stage.washes).toEqual([{ colour: '#ffffff', ms: 260 }]);
    expect(softWash('#ffffff', 260)).toEqual({ colour: IVORY, opacity: 0.35 });
  });
});

describe('2. Boss changes form (FFX)', () => {
  it('today: a white wash, 220 ms, with a camera shake (REDUCE MOTION owns the shake). Reduced: ivory at 35 %', async () => {
    const { stage, play } = setup();
    await play([{ type: 'form-change', enemyId: 'seymour-flux', formIndex: 1, name: 'Seymour Flux' }]);
    expect(stage.washes).toContainEqual({ colour: '#ffffff', ms: 220 });
    expect(stage.calls).toContain('camera:shake');
    expect(softWash('#ffffff', 220)).toEqual({ colour: IVORY, opacity: 0.35 });
  });
});

describe('3. Spherechange (FFX-2)', () => {
  it('today: a white flash on the girl (full strength, 420 ms) and a white wash (180 ms). Reduced: both capped at 35 %', async () => {
    const { stage, play } = setup();
    await play([{ type: 'spherechange', who: 'yuna', from: 'gunner', to: 'warrior', gatesCrossed: [] }]);
    expect(stage.flashesOf('yuna')).toEqual([{ colour: 0xffffff, ms: 420, peak: 1 }]);
    expect(stage.washes).toEqual([{ colour: '#ffffff', ms: 180 }]);
    expect(softened(stage.flashesOf('yuna')[0]!)).toEqual({ colour: IVORY_INT, ms: 420, peak: FLASH_PEAK_CAP });
    expect(softWash('#ffffff', 180)).toEqual({ colour: IVORY, opacity: FLASH_PEAK_CAP });
  });
});

describe('4. Big attack is about to land (both games)', () => {
  it('stage 1 today: an amber flash on the boss at 70 %. Reduced: 35 %, same colour', async () => {
    const { stage, play } = setup();
    await play([{ type: 'charge', enemyId: 'mortiorchis', name: 'Auto-Attack Mode', turnsLeft: 2, stage: 1 }]);
    expect(stage.flashesOf('mortiorchis')).toEqual([{ colour: 0xffc46b, ms: 620, peak: 0.7 }]);
    expect(stage.washes).toEqual([]);
    expect(softened(stage.flashesOf('mortiorchis')[0]!)).toEqual({ colour: 0xffc46b, ms: 620, peak: FLASH_PEAK_CAP });
  });

  it('stage 2 today: a red wash at 28 % for 420 ms and a full-strength red flash on the boss for 620 ms. Reduced: the wash is already under the cap, the flash is 35 %', async () => {
    const { stage, play } = setup();
    await play([{ type: 'charge', enemyId: 'mortiorchis', name: 'Ready to Annihilate', turnsLeft: 1, stage: 2 }]);
    expect(stage.flashesOf('mortiorchis')).toEqual([{ colour: 0xff6b5a, ms: 620, peak: 1 }]);
    expect(stage.washes).toEqual([{ colour: 'rgba(255,70,50,0.28)', ms: 420 }]);
    expect(softWash('rgba(255,70,50,0.28)', 420)).toEqual({ colour: 'rgba(255,70,50,0.28)', opacity: 1 });
    expect(softened(stage.flashesOf('mortiorchis')[0]!)).toEqual({ colour: 0xff6b5a, ms: 620, peak: FLASH_PEAK_CAP });
  });
});

describe('7. Every hit (both games)', () => {
  it('today: a crit flashes white at full strength for 260 ms, an ordinary hit pale peach at 80 % for 200 ms. Reduced: 35 %, a crit\'s white turns ivory', async () => {
    const crit = setup();
    await crit.play([hit({ crit: true })]);
    expect(crit.stage.flashesOf('seymour-flux')).toEqual([{ colour: 0xffffff, ms: 260, peak: 1 }]);
    expect(softened(crit.stage.flashesOf('seymour-flux')[0]!)).toEqual({ colour: IVORY_INT, ms: 260, peak: FLASH_PEAK_CAP });
    const plain = setup();
    await plain.play([hit()]);
    expect(plain.stage.flashesOf('seymour-flux')).toEqual([{ colour: 0xffd0c0, ms: 200, peak: 0.8 }]);
    expect(softened(plain.stage.flashesOf('seymour-flux')[0]!)).toEqual({ colour: 0xffd0c0, ms: 200, peak: FLASH_PEAK_CAP });
  });

  const reel = (n: number): Array<Unsequenced<BattleEvent>> => Array.from({ length: n }, (_, i) => hit({ hitIndex: i, hitCount: n }));

  it('off: every blow of a four-hit action flashes the fighter and opens a bloom, as today', async () => {
    const { stage, play } = setup(false);
    await play(reel(4));
    expect(stage.flashesOf('seymour-flux')).toHaveLength(4);
    expect(stage.impacts.map((i) => i.quiet)).toEqual([false, false, false, false]);
  });

  it('on: only the first blow of the action flashes the fighter and blooms; the later blows still draw their numeral, recoil and sparks', async () => {
    const { stage, play } = setup(true);
    await play(reel(4));
    expect(stage.flashesOf('seymour-flux')).toHaveLength(1);
    expect(stage.impacts.map((i) => i.quiet), 'the stage skips the bloom, not the impact, on a quiet blow').toEqual([false, true, true, true]);
    expect(stage.calls.filter((c) => c === 'recoil:seymour-flux')).toHaveLength(4);
  });

  it('on: a single blow flashes as the first blow', async () => {
    const { stage, play } = setup(true);
    await play([hit()]);
    expect(stage.flashesOf('seymour-flux')).toHaveLength(1);
    expect(stage.impacts).toEqual([{ at: 'seymour-flux', crit: false, quiet: false }]);
  });
});

describe('8. Heal, revive, petrify and other status flashes (both games)', () => {
  it('today: mint 60 % (320 ms), pale gold 90 % (520 ms), stone grey 85 % (320 ms), lilac 50 % (260 ms). Reduced: all 35 %', async () => {
    const { stage, play } = setup();
    await play([
      { type: 'heal', targetId: 'tidus', amount: 100, cause: 'regen' },
      { type: 'revive', targetId: 'tidus', hp: 50, cause: 'phoenix-down' },
      { type: 'status-add', targetId: 'tidus', status: 'petrify', instance: {} as never },
      { type: 'status-add', targetId: 'yuna', status: 'confuse', instance: {} as never },
    ]);
    const tidus = stage.flashesOf('tidus');
    expect(tidus).toEqual([
      { colour: 0x9dffc4, ms: 320, peak: 0.6 },
      { colour: 0xfff3c0, ms: 520, peak: 0.9 },
      { colour: 0xb9b4aa, ms: 320, peak: 0.85 },
    ]);
    expect(stage.flashesOf('yuna')).toEqual([{ colour: 0xc9a6ff, ms: 260, peak: 0.5 }]);
    for (const f of [...tidus, ...stage.flashesOf('yuna')]) {
      const s = softened(f);
      expect(s.peak, String(f.colour)).toBe(FLASH_PEAK_CAP);
      expect(s.ms, 'the duration is not changed').toBe(f.ms);
    }
  });

  it('a heal through the damage chain (negative damage) flashes the same mint', async () => {
    const { stage, play } = setup();
    await play([hit({ targetId: 'tidus', amount: -300 })]);
    expect(stage.flashesOf('tidus')).toEqual([{ colour: 0x9dffc4, ms: 320, peak: 0.6 }]);
  });
});

describe('left alone: a dimming is not a bright flash', () => {
  it('the knock-out fall (dark blue-grey flash, 0.7) and the defeat dim (55 % black, 900 ms) pass through the rule untouched', async () => {
    const ko = setup();
    await ko.play([{ type: 'ko', targetId: 'tidus' }]);
    const fall = ko.stage.flashesOf('tidus')[0]!;
    expect(fall).toEqual({ colour: 0x4a5a78, ms: 320, peak: 0.7 });
    expect(softened(fall)).toEqual({ colour: 0x4a5a78, ms: 320, peak: 0.7 });
    const lost = setup();
    await lost.play([{ type: 'defeat', result: {} as never }]);
    expect(lost.stage.washes).toEqual([{ colour: 'rgba(0,0,0,0.55)', ms: 900 }]);
    expect(softWash('rgba(0,0,0,0.55)', 900)).toEqual({ colour: 'rgba(0,0,0,0.55)', opacity: 1 });
  });
});

// ===================================================================== 6, 15, 18, 19, 20: the five rules that were in the code

describe('6. Spell effects (the rule was in the code: SpellFxParams; both games)', () => {
  const store = (): SaveStore => new SaveStore('flash-sources-6', { getItem: () => null, setItem: () => undefined, removeItem: () => undefined });

  it('off, the layer is given today\'s flashes (the same frozen object); on, the reduced ones: the setting is what sets the rule', () => {
    const s = store();
    expect(battleFlashParams()).toBe(DEFAULT_FLASH_PARAMS);
    s.setSettings({ reduceFlashes: true });
    expect(battleFlashParams()).toBe(REDUCED_FLASH_PARAMS);
    s.setSettings({ reduceFlashes: false });
    expect(battleFlashParams()).toBe(DEFAULT_FLASH_PARAMS);
  });

  it('today: washes up to full strength, one per strike; a glow over the fighter up to full strength; Thunder strikes three times', () => {
    expect(DEFAULT_FLASH_PARAMS).toEqual({ washCap: 1, whiteWashTo: null, oneWashPerAction: false, actorCap: 1, singleBolt: false });
    expect(filterWash(DEFAULT_FLASH_PARAMS, 3, '#ffffff', 1)).toEqual({ col: '#ffffff', a: 1 });
    expect(capActor(DEFAULT_FLASH_PARAMS, 1)).toBe(1);
  });

  it('reduced: washes and glows at 35 %, white becomes ivory, one wash per action, Thunder once', () => {
    expect(REDUCED_FLASH_PARAMS).toEqual({ washCap: 0.35, whiteWashTo: '#FFF1D6', oneWashPerAction: true, actorCap: 0.35, singleBolt: true });
    expect(filterWash(REDUCED_FLASH_PARAMS, 0, '#ffffff', 1)).toEqual({ col: '#FFF1D6', a: 0.35 });
    expect(filterWash(REDUCED_FLASH_PARAMS, 1, '#ffffff', 1), 'a second strike of the action washes nothing').toBeNull();
    expect(capActor(REDUCED_FLASH_PARAMS, 1)).toBe(0.35);
  });
});

const flags = (o: Partial<SpectacleFlags> = {}): SpectacleFlags => ({ tier: 'full', reduceMotion: false, reduceFlashes: false, dial: () => 1, ...o });
const blow = (o: Partial<HitInfo> = {}): HitInfo => ({ crit: false, heavy: true, hitIndex: 0, hitCount: 1, big: false, speed: 'normal', ...o });

describe('15. Impact frame (BATTLE SPECTACLE; the rule was in the code: SpectacleRules; both games)', () => {
  it('today: a two-frame ink-then-paper flash on a heavy blow. Reduced: one ivory frame', () => {
    expect(planHit('ffx', blow(), flags()).impactFrame).toBe('full');
    expect(planHit('ffx', blow(), flags({ reduceFlashes: true })).impactFrame).toBe('soft');
    expect(planHit('ffx2', blow({ crit: true }), flags({ reduceFlashes: true })).impactFrame).toBe('soft');
  });
});

describe('14. Overdrive and Special splash (BATTLE SPECTACLE; both games)', () => {
  it('today: the first play is the full splash (180 ms slam, fan of speed lines), a repeat is a 250 ms flash. Reduced: every play is the 200 ms static fade REDUCE MOTION already uses', () => {
    expect(splashMode(flags(), false)).toBe('full');
    expect(splashMode(flags(), true)).toBe('repeat');
    expect(splashMode(flags({ reduceFlashes: true }), false)).toBe('calm');
    expect(splashMode(flags({ reduceFlashes: true }), true)).toBe('calm');
    expect(splashMode(flags({ reduceMotion: true }), true), 'REDUCE MOTION still does').toBe('calm');
  });
});

describe('18. Lens flare on spell landings (CINEMA LIGHT; the rule was in the code: LensFlare; both games)', () => {
  const tap = { fx: 'holy', abilityId: 'holy', game: 'ffx', ms: 0, rect: { x: 0, y: 0, w: 100, h: 200 }, view: { w: 1600, h: 900 } } as never;
  const land = (reduceFlashes: boolean): { peak: number; ghosts: boolean } => {
    const lens = new LensFlare();
    lens.land(tap, { reduceFlashes, ghosts: true, now: 0 });
    return (lens as unknown as { flares: Array<{ peak: number; ghosts: boolean }> }).flares[0]!;
  };

  it('today: a flare with ghost images, peak 0.8 in FFX. Reduced: peak 0.35, no ghosts', () => {
    expect(land(false)).toMatchObject({ peak: 0.8, ghosts: true });
    expect(land(true)).toMatchObject({ peak: 0.35, ghosts: false });
  });
});

describe('19. Spell moments (BATTLE SPECTACLE; the rule was in the code: SpellMoments; both games)', () => {
  const ctx = (game: 'ffx' | 'ffx2' = 'ffx2'): { c: MomentCtx; afters: number[]; lifts: number[] } => {
    const afters: number[] = [];
    const lifts: number[] = [];
    const pools = new Proxy({}, { get: () => ({ emit: (): void => {} }) });
    const c = {
      game,
      tune: SPECTACLE_TUNING[game],
      pools,
      fire: { play: (): void => {} },
      ice: { play: (): void => {} },
      shell: { play: (): void => {} },
      stage: { actor: () => undefined, staged: () => [], sideOf: () => 'enemy' as const },
      after: (sec: number): void => void afters.push(sec),
      lift: (v: number): void => void lifts.push(v),
      haze: (): void => {},
      sub: () => true,
      special: null,
    } as unknown as MomentCtx;
    return { c, afters, lifts };
  };
  const figure = { position: new Vector3(), height: 2, centerPoint: (v: Vector3): Vector3 => v.set(0, 1, 0) } as never;

  it('today: Thunder lays 4 light passes (2 on a phone) and lifts exposure 0.16. Reduced: 1 pass, 0.06', () => {
    const full = ctx();
    spellMoment(full.c, 'thunder', 'tidus', figure, flags());
    expect(full.afters).toHaveLength(4);
    expect(full.lifts).toEqual([0.16]);
    const phone = ctx();
    spellMoment(phone.c, 'thunder', 'tidus', figure, flags({ tier: 'phone' }));
    expect(phone.afters).toHaveLength(2);
    const soft = ctx();
    spellMoment(soft.c, 'thunder', 'tidus', figure, flags({ reduceFlashes: true }));
    expect(soft.afters).toHaveLength(1);
    expect(soft.lifts).toEqual([0.06]);
  });

  it('today: Aerospark (FFX-2) strikes 8 times and lifts 0.2. Reduced: once, 0.06', () => {
    const full = ctx();
    bigMoment(full.c, 'aerospark', figure, flags());
    expect(full.afters).toHaveLength(8);
    expect(full.lifts).toEqual([0.2]);
    const soft = ctx();
    bigMoment(soft.c, 'aerospark', figure, flags({ reduceFlashes: true }));
    expect(soft.afters).toHaveLength(1);
    expect(soft.lifts).toEqual([0.06]);
  });
});

describe('20. Arena lighting on boss phases (the rule was in the code: PhaseLighting; both games)', () => {
  class Grade implements GradeTarget {
    palette: ScenePalette | null = { name: 'test', exposure: 1, gain: [1, 1, 1], vignette: 0.4 };
    applied: ScenePalette[] = [];
    applyPalette(p: ScenePalette): void {
      this.applied.push(p);
    }
  }
  const lit = (reduce: boolean): { L: PhaseLighting; grade: Grade } => {
    const grade = new Grade();
    const L = new PhaseLighting({
      scene: new Scene(),
      grade,
      figures: () => [],
      partyCentre: () => ({ x: 0, z: 0 }),
      baseRim: { color: 0xbfe0ff, strength: 0.8 },
      reduceFlashes: () => reduce,
    });
    return { L, grade };
  };

  it('today: the new look eases in over about 1.5 s. Reduced: it lands at once', () => {
    const slow = lit(false);
    slow.L.phase('flux-reflect');
    expect(slow.grade.applied, 'nothing is applied before the first frame').toHaveLength(0);
    slow.L.update(0.1);
    const early = slow.grade.applied.at(-1)!.gain![1]!;
    slow.L.update(PHASE_TWEEN_S);
    const settled = slow.grade.applied.at(-1)!.gain![1]!;
    expect(early, 'a tenth of a second in, it is not there yet').not.toBeCloseTo(settled, 3);
    const at = lit(true);
    at.L.phase('flux-reflect');
    expect(at.grade.applied, 'applied the moment the cue lands, before any frame').toHaveLength(1);
    expect(at.grade.applied[0]!.gain![1]).toBeCloseTo(settled, 6);
    expect(PHASE_GRADES['flux-reflect'].exposure).toBeLessThan(1);
  });

  it('the battle screen hands the stage the setting (the option nothing set before)', () => {
    const src = read('src/app/screens/BattleScreen.ts');
    expect(src).toMatch(/reduceFlashes: readReduceFlashes/);
  });
});

// ===================================================================== 9 to 13, 21, 22: the stylesheets

const OWN = { ffx: read('src/ui/ffx/ffx-hud.css'), ffx2: read('src/ui/ffx2/ffx2-hud.css'), mg: read('src/ui/ffx/minigames/overdrive-minigames.css'), eint: read('src/ui/common/enemy-intent.css') };
const SOFT = read('src/ui/common/comfort-flashes.css');
const MOTION = read('src/ui/common/comfort.css');

/** The body of `@keyframes name { ... }`. */
const keyframes = (css: string, name: string): string => {
  const m = new RegExp(`@keyframes ${name}\\s*\\{([\\s\\S]*?)\\n\\}`).exec(css);
  if (!m) throw new Error(`no @keyframes ${name}`);
  return m[1]!;
};
const nums = (s: string, re: RegExp): number[] => [...s.matchAll(re)].map((m) => Number(m[1]));
const maxBrightness = (css: string, name: string): number => Math.max(...nums(keyframes(css, name), /brightness\(([\d.]+)\)/g));
/** The rule whose selector list contains `selector`: its declarations. */
const rule = (css: string, selector: string): string => {
  const at = css.indexOf(selector);
  if (at < 0) throw new Error(`no rule for ${selector}`);
  return css.slice(css.indexOf('{', at) + 1, css.indexOf('}', at));
};

describe('9. Target bracket while aiming at a group (FFX; ffx-hud.css)', () => {
  it('today: the corners flash every 0.9 s until you choose. Reduced: a steady highlight (the animation is dropped; the rule\'s resting opacity stays)', () => {
    expect(rule(OWN.ffx, '.ffx-target--group .ffx-target__c')).toMatch(/animation: ffx-target-flash 0\.9s ease-in-out infinite/);
    expect(rule(SOFT, 'html[data-reduce-flashes] .ffx-target--group .ffx-target__c')).toMatch(/animation: none/);
  });
});

describe('10. Party card when a member is hurt (FFX; ffx-hud.css)', () => {
  it('today: one 0.3 s flash to +60 % brightness. Reduced: one 0.6 s fade to 35 % of that', () => {
    expect(OWN.ffx).toMatch(/\.ffx-stat--hurt \{ animation: ffx-hurt-flash 0\.3s ease; \}/);
    expect(maxBrightness(OWN.ffx, 'ffx-hurt-flash')).toBe(1.6);
    expect(rule(SOFT, 'html[data-reduce-flashes] .ffx-stat--hurt')).toMatch(/animation: ffx-hurt-soft 0\.6s ease-out;/);
    const peak = maxBrightness(SOFT, 'ffx-hurt-soft');
    expect(peak).toBeCloseTo(1 + (1.6 - 1) * FLASH_PEAK_CAP, 2);
    expect(peak).toBeLessThan(1.6);
  });
});

describe('11. Girl\'s card when she is hit (FFX-2; ffx2-hud.css)', () => {
  it('today: one 0.2 s flash to +80 % brightness. Reduced: one 0.5 s fade to 35 % of that', () => {
    expect(rule(OWN.ffx2, '.ffx2-hit-flash {')).toMatch(/animation: ffx2-hit-flash 0\.2s ease-out/);
    expect(maxBrightness(OWN.ffx2, 'ffx2-hit-flash')).toBe(1.8);
    expect(rule(SOFT, 'html[data-reduce-flashes] .ffx2-hit-flash')).toMatch(/animation: ffx2-hit-soft 0\.5s ease-out;/);
    expect(maxBrightness(SOFT, 'ffx2-hit-soft')).toBeCloseTo(1 + (1.8 - 1) * FLASH_PEAK_CAP, 2);
  });
});

describe('12. Big-attack warning plate (both games; ffx-hud.css, ffx2-hud.css, enemy-intent.css)', () => {
  it('today: the plate pulses brighter and dimmer about twice a second. Reduced: all four are a steady highlight in the same colour', () => {
    expect(OWN.ffx).toMatch(/\.ffx-telegraph--stage-2 \{[^}]*animation: ffx-telegraph-pulse 0\.5s ease-in-out infinite alternate/);
    expect(OWN.ffx2).toMatch(/\.ffx2enemy__pip--s2 \{[^}]*animation: ffx2-telegraph-flash 0\.45s ease-in-out infinite alternate/);
    expect(OWN.ffx2).toMatch(/\.ffx2hud__telegraph--s2 \{[^}]*animation: ffx2-telegraph-flash 0\.5s ease-in-out infinite alternate/);
    expect(OWN.eint).toMatch(/\.eint__charge--s2 \{[^}]*animation: eint-imminent 0\.6s ease-in-out infinite alternate/);
    const body = rule(SOFT, 'html[data-reduce-flashes] .ffx-telegraph--stage-2');
    for (const sel of ['.ffx-telegraph--stage-2', '.ffx2hud__telegraph--s2', '.ffx2enemy__pip--s2', '.eint__charge--s2']) {
      expect(SOFT, sel).toContain(`html[data-reduce-flashes] ${sel}`);
    }
    expect(body).toMatch(/animation: none;/);
    const steady = Number(/filter: brightness\(([\d.]+)\)/.exec(body)![1]);
    expect(steady).toBe(1.1);
    for (const today of [maxBrightness(OWN.ffx, 'ffx-telegraph-pulse'), maxBrightness(OWN.ffx2, 'ffx2-telegraph-flash'), maxBrightness(OWN.eint, 'eint-imminent')]) {
      expect(steady, 'a steady lift under every peak it replaces').toBeLessThan(today);
    }
  });
});

describe('13. Overdrive timing flash (FFX; overdrive-minigames.css)', () => {
  it('today: mint on a hit and red on a miss, up to 50 % of the panel for 240 ms. Reduced: one soft fade capped at 35 %, the miss\'s shake stays (REDUCE MOTION owns it)', () => {
    expect(OWN.mg).toMatch(/\.ffx-mg--success \{ animation: ffx-mg-flash-success 0\.24s ease; \}/);
    expect(OWN.mg).toMatch(/\.ffx-mg--fail \{ animation: ffx-mg-flash-fail 0\.24s ease, ffx-mg-shake 0\.2s linear; \}/);
    const alphas = (css: string, name: string): number[] => nums(keyframes(css, name), /rgba\([^)]*,\s*([\d.]+)\)/g);
    expect(Math.max(...alphas(OWN.mg, 'ffx-mg-flash-success'))).toBe(0.5);
    expect(Math.max(...alphas(OWN.mg, 'ffx-mg-flash-fail'))).toBe(0.45);
    expect(Math.max(...alphas(SOFT, 'ffx-mg-soft-success'))).toBe(0.35);
    expect(Math.max(...alphas(SOFT, 'ffx-mg-soft-fail'))).toBe(0.35);
    expect(SOFT).toMatch(/html\[data-reduce-flashes\] \.ffx-mg--success \{ animation: ffx-mg-soft-success 0\.4s ease; \}/);
    expect(SOFT).toMatch(/html\[data-reduce-flashes\] \.ffx-mg--fail \{ animation: ffx-mg-soft-fail 0\.4s ease, ffx-mg-shake 0\.2s linear; \}/);
  });
});

describe('21. FFX-2 ready gauge\'s shimmer (found while checking; REDUCE MOTION never stopped it)', () => {
  it('today: a four-step shimmer about four times a second. Reduced: held steady, by REDUCE FLASHES and now by REDUCE MOTION too', () => {
    expect(rule(OWN.ffx2, '.ffx2atb--ready {')).toMatch(/animation: ffx2-shimmer 0\.25s steps\(2, end\) infinite/);
    expect(MOTION, 'REDUCE MOTION did not name it').not.toContain('ffx2atb--ready');
    expect(SOFT).toMatch(/html\[data-reduce-flashes\] \.ffx2atb--ready,\s*html\[data-reduce-motion\] \.ffx2atb--ready \{ animation: none; \}/);
  });
});

describe('22. Chain counter at chain 20 and up (FFX-2; ffx2-hud.css)', () => {
  it('today: each increment draws a two-frame pink veil over the screen and a two-frame white numeral. Reduced: neither', () => {
    expect(OWN.ffx2).toMatch(/ffx2chain--flash::after \{[^}]*animation: ffx2-chain-veil 0\.08s linear forwards/);
    expect(OWN.ffx2).toMatch(/ffx2chain--pop \.ffx2chain__n \{\s*animation: ffx2-chain-white 0\.18s steps\(1, end\);/);
    expect(SOFT).toMatch(/html\[data-reduce-flashes\] \.ffx2-chain-chip\.ffx2chain--flash::after \{ display: none; \}/);
    expect(SOFT).toMatch(/html\[data-reduce-flashes\] \.ffx2-chain-chip\.ffx2chain--pop \.ffx2chain__n \{ animation: none; \}/);
  });
});

describe('the stylesheet applies to nothing unless the setting is on', () => {
  it('every rule in comfort-flashes.css is under html[data-reduce-flashes] (or the REDUCE MOTION line for the gauge); no bare selector', () => {
    const selectors = [...SOFT.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/(?:^|\})\s*([^{}@\s][^{}]*)\{/g)]
      .map((m) => m[1]!.trim())
      .filter((s) => !/^(\d+%|from|to)([,\s]|$)/.test(s) && !/^[\d%,\s]+$/.test(s));
    expect(selectors.length).toBeGreaterThan(8);
    for (const group of selectors) for (const sel of group.split(',').map((s) => s.trim()).filter(Boolean)) {
      expect(sel, sel).toMatch(/^html\[data-reduce-(flashes|motion)\] /);
    }
  });
});

describe('the count', () => {
  it('twenty sources on the round\'s page (five already had a rule) plus the gauge and the chain veil found while checking', () => {
    const covered = Array.from({ length: 22 }, (_, i) => i + 1);
    expect(covered).toHaveLength(22);
    // the five whose rule was in the code and which nothing set until the setting existed
    expect([6, 15, 18, 19, 20]).toHaveLength(5);
    expect(IVORY).toBe('#FFF1D6');
  });
});
