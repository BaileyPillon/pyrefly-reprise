/**
 * Step 3 of the new spell effects (motion pass, lane "fx"): what the presenter does about the bosses' attacks, the charge, the Overdrive's aura and the dress change (against the fake stage), and the
 * spell light. Everything is inert with the switch off. The layer's half is `fx-boss-layer.test.ts`.
 */
import { afterEach, describe, expect, it } from 'vitest';
import type { BattleEvent } from '../../src/battle/common/types.ts';
import { BattlePresenter } from '../../src/engine/BattlePresenter.ts';
import { chargeLevel, CURSE_BRIGHTNESS, OD_CALM_MS, STATUS_WAIT_MS } from '../../src/engine/BattlePresenterBossFx.ts';
import { lightKindOf, PSEUDO_FX } from '../../src/engine/spellfx/BossFx.ts';
import { landListeners } from '../../src/engine/fx/spellTaps.ts';
import { setFxMotionHooks } from '../../src/engine/spellfx/FxMotionAdapter.ts';
import { fxShare } from '../../src/engine/spellfx/FxPerfGuard.ts';
import { setFxChapter, setFxMode } from '../../src/engine/spellfx/FxSwitch.ts';
import { SpellFxLayer } from '../../src/engine/spellfx/SpellFxLayer.ts';
import { SPELL_HOLD_CAP_MS } from '../../src/engine/spellfx/SpellFxSpecials.ts';
import { FakeDamageNumbers, FakeMessageBar, FakeStage } from './helpers/FakeStage.ts';

afterEach(() => {
  setFxMode(null);
  setFxChapter(undefined);
  setFxMotionHooks({});
  fxShare.particles = fxShare.trails = 1;
});

const demo = (chapter: string): void => {
  setFxMode('new');
  setFxChapter(chapter);
};

const RECTS: Record<string, { x: number; y: number; w: number; h: number }> = {
  tidus: { x: 300, y: 380, w: 160, h: 280 },
  yuna: { x: 480, y: 420, w: 150, h: 270 },
  kimahri: { x: 220, y: 450, w: 170, h: 290 },
  rikku: { x: 300, y: 430, w: 150, h: 270 },
  paine: { x: 150, y: 470, w: 150, h: 270 },
  'seymour-flux': { x: 1000, y: 200, w: 300, h: 420 },
  mortiorchis: { x: 960, y: 260, w: 380, h: 420 },
  bahamut: { x: 980, y: 160, w: 360, h: 460 },
};

function layerFor(game: 'ffx' | 'ffx2'): SpellFxLayer {
  return new SpellFxLayer({ game, rectOf: (id) => RECTS[id] ?? null, view: () => ({ w: 1600, h: 900 }), quality: () => 'full' });
}

// ---------------------------------------------------------------------------------------------------- the presenter

type Unsequenced<T> = T extends unknown ? Omit<T, 'seq'> : never;

function setup(landMs = 400) {
  const stage = new FakeStage(['tidus', 'yuna', 'kimahri'], ['seymour-flux', 'mortiorchis']);
  const lands: Array<{ at: string; o: Record<string, unknown> }> = [];
  stage.vfx.land = (at, o) => {
    lands.push({ at, o: { ...o } });
    return o.deco ? 0 : landMs;
  };
  const sleeps: number[] = [];
  const presenter = new BattlePresenter({
    stage,
    damageNumbers: new FakeDamageNumbers(),
    messageBar: new FakeMessageBar(),
    sleep: (ms) => {
      sleeps.push(ms);
      return Promise.resolve();
    },
  });
  const play = (events: Array<Unsequenced<BattleEvent>>): Promise<unknown> => presenter.play(events.map((e, i) => ({ ...e, seq: i }) as BattleEvent));
  return { stage, lands, sleeps, play };
}

const hasteCast: Array<Unsequenced<BattleEvent>> = [
  { type: 'action-start', actorId: 'yuna', command: { kind: 'ability' } as never, abilityId: 'haste', abilityName: 'Haste', targets: ['tidus'] },
  { type: 'status-add', targetId: 'tidus', status: 'haste', instance: {} as never },
  { type: 'action-end', actorId: 'yuna' },
];

describe('the presenter: off, nothing new is asked of the stage', () => {
  it('a Haste cast asks for no landing, a Mortiorchis charge none, an Overdrive none and plays no calm beat', async () => {
    setFxMode('today');
    setFxChapter('seymour-flux');
    const { lands, sleeps, play } = setup();
    await play(hasteCast);
    await play([{ type: 'charge', enemyId: 'mortiorchis', name: 'Auto-Attack Mode', turnsLeft: 2, stage: 1 }]);
    await play([
      { type: 'action-start', actorId: 'tidus', command: { kind: 'overdrive' } as never, abilityId: 'spiral-cut', abilityName: 'Spiral Cut', targets: ['seymour-flux'] },
      { type: 'action-end', actorId: 'tidus' },
    ]);
    expect(lands).toHaveLength(0);
    expect(sleeps).not.toContain(OD_CALM_MS);
  });
});

describe('the presenter with the new effects on', () => {
  it('a status event lands the move\'s effect and waits for its mark, no longer than the cap', async () => {
    demo('seymour-flux');
    const { lands, sleeps, play } = setup(200);
    await play(hasteCast);
    expect(lands).toHaveLength(1);
    expect(lands[0]).toMatchObject({ at: 'tidus', o: { abilityId: 'haste', status: true, hitIndex: 0, targets: ['tidus'] } });
    expect(sleeps).toContain(200); // the mark is soon: wait for it
    const long = setup(450);
    await long.play(hasteCast);
    expect(long.sleeps).toContain(STATUS_WAIT_MS); // there is no numeral to hold: wait only to see it start
    expect(long.sleeps).not.toContain(450);
    const capped = setup(5000);
    await capped.play(hasteCast);
    expect(capped.sleeps).toContain(STATUS_WAIT_MS);
    expect(capped.sleeps).not.toContain(5000);
    expect(STATUS_WAIT_MS).toBeLessThanOrEqual(SPELL_HOLD_CAP_MS);
  });

  it('a Dispel (status removed, reason dispelled) lands its effect; an expiry does not', async () => {
    demo('seymour-flux');
    const { lands, play } = setup();
    await play([
      { type: 'action-start', actorId: 'seymour-flux', command: { kind: 'ability' } as never, abilityId: 'dispel', abilityName: 'Dispel', targets: ['tidus'] },
      { type: 'status-remove', targetId: 'tidus', status: 'haste', reason: 'dispelled' },
      { type: 'status-remove', targetId: 'tidus', status: 'shell', reason: 'expired' },
      { type: 'action-end', actorId: 'seymour-flux' },
    ]);
    expect(lands).toHaveLength(1);
    expect(lands[0]).toMatchObject({ at: 'tidus', o: { abilityId: 'dispel', status: true } });
  });

  it('a status outside any action (an expiry between turns) asks for nothing', async () => {
    demo('seymour-flux');
    const { lands, play } = setup();
    await play([{ type: 'status-add', targetId: 'tidus', status: 'haste', instance: {} as never }]);
    expect(lands).toHaveLength(0);
  });

  it('a boss charge draws the gather at the level its count says: FFX-2 counts 5 down, FFX climbs a ladder', async () => {
    demo('seymour-flux');
    const { lands, play } = setup();
    await play([
      { type: 'charge', enemyId: 'mortiorchis', name: 'Auto-Attack Mode', turnsLeft: 2, stage: 1 },
      { type: 'charge', enemyId: 'mortiorchis', name: 'Ready To Annihilate', turnsLeft: 1, stage: 2 },
      { type: 'charge', enemyId: 'mortiorchis', name: '5', turnsLeft: 4, stage: 1 },
      { type: 'charge', enemyId: 'mortiorchis', name: '2', turnsLeft: 1, stage: 2 },
      { type: 'charge', enemyId: 'mortiorchis', name: '1', turnsLeft: 0, stage: 2 },
    ]);
    expect(lands.map((l) => (l.o['level'] as number))).toEqual([2, 4, 1, 4, 5]);
    expect(lands.every((l) => l.o['abilityId'] === PSEUDO_FX.gather && l.o['deco'] === true)).toBe(true);
    expect(chargeLevel({ type: 'charge', enemyId: 'x', name: 'Memento Mori', turnsLeft: 0, stage: 2, seq: 0 } as never)).toBe(4);
    expect(chargeLevel({ type: 'charge', enemyId: 'x', name: '9', turnsLeft: 0, stage: 1, seq: 0 } as never)).toBe(2);
  });

  it('an Overdrive opens with the aura on the actor under the banner, the other lanes\' wind-up hook, and a calm beat before the strike', async () => {
    demo('seymour-flux');
    const calls: string[] = [];
    setFxMotionHooks({ anticipate: (id, ms) => calls.push(`anticipate:${id}:${ms}`), smear: (id) => calls.push(`smear:${id}`), hitStop: () => calls.push('hitStop'), punch: () => calls.push('punch'), rumble: () => calls.push('rumble') });
    const { lands, sleeps, play } = setup();
    await play([
      { type: 'action-start', actorId: 'tidus', command: { kind: 'overdrive' } as never, abilityId: 'spiral-cut', abilityName: 'Spiral Cut', targets: ['seymour-flux'] },
      { type: 'action-end', actorId: 'tidus' },
    ]);
    expect(lands).toHaveLength(1);
    expect(lands[0]).toMatchObject({ at: 'tidus', o: { abilityId: PSEUDO_FX.odaura, variant: 'tidus', deco: true } });
    expect(sleeps).toContain(OD_CALM_MS);
    expect(calls).toEqual(['anticipate:tidus:1200', 'smear:tidus', 'rumble']); // movement and a light rumble; hit-stop and punch belong to the strike
  });

  it('under REDUCE MOTION the Overdrive still moves and smears but does not rumble', async () => {
    demo('seymour-flux');
    const calls: string[] = [];
    setFxMotionHooks({ anticipate: () => calls.push('anticipate'), smear: () => calls.push('smear'), rumble: () => calls.push('rumble'), punch: () => calls.push('punch') });
    const stage = new FakeStage(['tidus'], ['seymour-flux']);
    const presenter = new BattlePresenter({ stage, damageNumbers: new FakeDamageNumbers(), messageBar: new FakeMessageBar(), sleep: () => Promise.resolve(), moments: { reduceMotion: () => true, letterbox: () => Promise.resolve(), nameSlab: () => Promise.resolve(), vignette: () => undefined } as never });
    await presenter.play([
      { type: 'action-start', actorId: 'tidus', command: { kind: 'overdrive' } as never, abilityId: 'spiral-cut', abilityName: 'Spiral Cut', targets: ['seymour-flux'], seq: 0 },
      { type: 'action-end', actorId: 'tidus', seq: 1 },
    ] as BattleEvent[]);
    expect(calls).toEqual(['anticipate', 'smear']);
  });

  it('a dress change asks for the painted burst on that girl', async () => {
    demo('ffx2-bahamut');
    const { lands, play } = setup();
    await play([{ type: 'spherechange', who: 'yuna', from: 'white-mage', to: 'warrior', gatesCrossed: [] }]);
    expect(lands).toHaveLength(1);
    expect(lands[0]).toMatchObject({ at: 'yuna', o: { abilityId: PSEUDO_FX.dress, variant: 'yuna', deco: true } });
  });

  it('Curse darkens the girl until it ends (Bahamut\'s Curse only)', async () => {
    demo('ffx2-bahamut');
    const { stage, play } = setup();
    const seen: number[] = [];
    (stage.actors.get('yuna') as unknown as { setBrightness(v: number): void }).setBrightness = (v: number): void => void seen.push(v);
    await play([
      { type: 'action-start', actorId: 'mortiorchis', command: { kind: 'ability' } as never, abilityId: 'bahamut-curse', abilityName: 'Curse', targets: ['yuna'] },
      { type: 'status-add', targetId: 'yuna', status: 'curse', instance: {} as never },
      { type: 'action-end', actorId: 'mortiorchis' },
      { type: 'status-remove', targetId: 'yuna', status: 'curse', reason: 'cured' },
    ]);
    expect(seen).toEqual([CURSE_BRIGHTNESS, 1]);
    // a Curse from anyone else (no Bahamut ability on screen) is left alone
    const other = setup();
    const seen2: number[] = [];
    (other.stage.actors.get('yuna') as unknown as { setBrightness(v: number): void }).setBrightness = (v: number): void => void seen2.push(v);
    await other.play([
      { type: 'action-start', actorId: 'mortiorchis', command: { kind: 'ability' } as never, abilityId: 'something-else', abilityName: 'Else', targets: ['yuna'] },
      { type: 'status-add', targetId: 'yuna', status: 'curse', instance: {} as never },
    ]);
    expect(seen2).toEqual([]);
  });

  it("an Overdrive's first blow tells the strike hooks once; a boss's big blow (Total Annihilation's fifth hit, Cross Cleave) tells them once per action, not once per target", async () => {
    demo('seymour-flux');
    const calls: string[] = [];
    setFxMotionHooks({ anticipate: () => undefined, smear: () => undefined, hitStop: (f) => calls.push(`hitStop${f}`), punch: () => calls.push('punch'), rumble: () => calls.push('rumble') });
    const { play } = setup(300);
    const dmg = (target: string, hit: number, count: number, source: string): Unsequenced<BattleEvent> => ({ type: 'damage', targetId: target, sourceId: source, amount: 500, element: 'none', crit: false, hitIndex: hit, hitCount: count });
    await play([
      { type: 'action-start', actorId: 'tidus', command: { kind: 'overdrive' } as never, abilityId: 'spiral-cut', abilityName: 'Spiral Cut', targets: ['seymour-flux'] },
      dmg('seymour-flux', 0, 3, 'tidus'),
      dmg('seymour-flux', 1, 3, 'tidus'),
      dmg('seymour-flux', 2, 3, 'tidus'),
      { type: 'action-end', actorId: 'tidus' },
    ]);
    expect(calls).toEqual(['rumble' /* od-open */, 'hitStop4', 'punch', 'rumble']);
    calls.length = 0;
    const boss: Array<Unsequenced<BattleEvent>> = [{ type: 'action-start', actorId: 'mortiorchis', command: { kind: 'ability' } as never, abilityId: 'total-annihilation', abilityName: 'Total Annihilation', targets: ['tidus', 'yuna'] }];
    for (let k = 0; k < 5; k++) for (const t of ['tidus', 'yuna']) boss.push(dmg(t, k, 5, 'mortiorchis'));
    boss.push({ type: 'action-end', actorId: 'mortiorchis' });
    const { play: play2 } = setup(300);
    await play2(boss);
    expect(calls).toEqual(['hitStop4', 'punch', 'rumble']); // once: the fifth hit of the first target to get there
    calls.length = 0;
    const { play: play3 } = setup(300);
    await play3([
      { type: 'action-start', actorId: 'mortiorchis', command: { kind: 'ability' } as never, abilityId: 'cross-cleave', abilityName: 'Cross Cleave', targets: ['tidus', 'yuna', 'kimahri'] },
      dmg('tidus', 0, 1, 'mortiorchis'),
      dmg('yuna', 0, 1, 'mortiorchis'),
      dmg('kimahri', 0, 1, 'mortiorchis'),
      { type: 'action-end', actorId: 'mortiorchis' },
    ]);
    expect(calls).toEqual(['hitStop4', 'punch', 'rumble']);
  });

  it('an ordinary blow tells the hooks nothing, and nothing is told with the switch off', async () => {
    const calls: string[] = [];
    setFxMotionHooks({ hitStop: () => calls.push('h'), punch: () => calls.push('p'), rumble: () => calls.push('r') });
    const dmg: Unsequenced<BattleEvent> = { type: 'damage', targetId: 'seymour-flux', sourceId: 'yuna', amount: 800, element: 'fire', crit: false, hitIndex: 0, hitCount: 1 };
    const start: Unsequenced<BattleEvent> = { type: 'action-start', actorId: 'yuna', command: { kind: 'ability' } as never, abilityId: 'fire', abilityName: 'Fire', targets: ['seymour-flux'] };
    demo('seymour-flux');
    await setup(300).play([start, dmg]);
    expect(calls).toEqual([]);
    setFxMode('today');
    setFxChapter('seymour-flux');
    await setup(300).play([{ ...start, abilityId: 'total-annihilation', actorId: 'mortiorchis' } as never, { ...dmg, hitIndex: 4, hitCount: 5 }]);
    expect(calls).toEqual([]);
  });
});

describe('the spell light the demo look throws on the figures near an effect', () => {
  it('each new effect is lit as the existing kind nearest to it (never the warm white bloom a stranger id gets), and decoration throws none', () => {
    demo('seymour-flux');
    const seen: string[] = [];
    const listener = (tap: { fx: string }): void => void seen.push(tap.fx);
    landListeners.add(listener);
    try {
      const layer = layerFor('ffx');
      layer.land('yuna', { abilityId: 'lance-of-atrophy', action: 1, hitIndex: 0, sourceId: 'seymour-flux' });
      layer.land('kimahri', { abilityId: 'flare-self', action: 2, hitIndex: 0, sourceId: 'seymour-flux' });
      layer.land('kimahri', { abilityId: 'banish', action: 3, hitIndex: 0, status: true });
      layer.land('tidus', { abilityId: PSEUDO_FX.odaura, deco: true, variant: 'tidus' });
      layer.land('mortiorchis', { abilityId: PSEUDO_FX.gather, deco: true, level: 3 });
      layer.play('odaura', 'tidus', 0.5, [], 'tidus');
      layer.play('gather', 'mortiorchis', 0.5, [], '3');
      layer.play('cleave', 'tidus', 0.3);
      expect(seen).toEqual(['hit', 'fire', 'holy', 'hit']);
      expect(lightKindOf('hit')).toBe('hit'); // today's ids are not touched
      expect(lightKindOf('megaflare')).toBe('megaflare');
    } finally {
      landListeners.delete(listener);
    }
  });
});
