/**
 * Step 3 of the new spell effects (motion pass, lane "fx"): how the bosses' attacks, the charge, the Overdrive's aura and the dress change reach the spell layer. No GPU: the layer is driven through
 * `land`, `update` and `drawList`. Everything is inert with the switch off. The presenter's half is `fx-boss-presenter.test.ts`.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { bossFxFor, drawnOnStatus, PSEUDO_FX } from '../../src/engine/spellfx/BossFx.ts';
import { fxShare } from '../../src/engine/spellfx/FxPerfGuard.ts';
import { setFxChapter, setFxMode } from '../../src/engine/spellfx/FxSwitch.ts';
import { SpellFxLayer } from '../../src/engine/spellfx/SpellFxLayer.ts';
import { SPELL_HOLD_CAP_MS } from '../../src/engine/spellfx/SpellFxSpecials.ts';

afterEach(() => {
  setFxMode(null);
  setFxChapter(undefined);
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

describe('the ids: which effect a boss move draws, per game, and only with the new effects on', () => {
  it('Seymour Flux\'s and Mortiorchis\'s moves resolve in FFX, and not in FFX-2', () => {
    const expected: Record<string, string> = {
      'lance-of-atrophy': 'atrophy',
      'full-life': 'fulllife',
      'cross-cleave': 'cleave',
      'total-annihilation': 'annihilate',
      'flare-self': 'flare',
      banish: 'banish',
      'slowga-counter': 'slowga',
      mortibsorption: 'drain',
      jump: 'jump',
      'mighty-guard': 'protect',
    };
    for (const [ability, fx] of Object.entries(expected)) {
      expect(bossFxFor(ability, 'ffx'), ability).toBe(fx);
      expect(bossFxFor(ability, 'ffx2'), `${ability} in FFX-2`).toBeNull();
    }
  });

  it('Bahamut\'s moves resolve under both of the ids the engine can use, in FFX-2 only', () => {
    for (const [ability, fx] of [['bahamut-curse', 'curse'], ['x2-bahamut-curse', 'curse'], ['impulse', 'impulse'], ['x2-bahamut-impulse', 'impulse'], ['bahamut-countdown', 'gather'], ['x2-dark-knight-darkness', 'darkness']] as const) {
      expect(bossFxFor(ability, 'ffx2'), ability).toBe(fx);
      expect(bossFxFor(ability, 'ffx'), `${ability} in FFX`).toBeNull();
    }
    // Mega Flare keeps its D-233 special: not in this table at all
    expect(bossFxFor('mega-flare', 'ffx2')).toBeNull();
    expect(bossFxFor('x2-bahamut-mega-flare', 'ffx2')).toBeNull();
  });

  it('the pseudo ids of the beats that are not abilities belong to the games that have the beat', () => {
    expect(bossFxFor(PSEUDO_FX.odaura, 'ffx')).toBe('odaura');
    expect(bossFxFor(PSEUDO_FX.odaura, 'ffx2')).toBeNull(); // FFX-2 has no Overdrive
    expect(bossFxFor(PSEUDO_FX.dress, 'ffx2')).toBe('dress');
    expect(bossFxFor(PSEUDO_FX.dress, 'ffx')).toBeNull(); // FFX has no spherechange
    expect(bossFxFor(PSEUDO_FX.gather, 'ffx')).toBe('gather');
    expect(bossFxFor(PSEUDO_FX.gather, 'ffx2')).toBe('gather');
    expect(bossFxFor(PSEUDO_FX.gather, 'ff7')).toBeNull();
  });

  it('the effects drawn on a status are exactly the moves that deal no damage', () => {
    for (const fx of ['haste', 'shell', 'protect', 'reflect', 'dispel', 'banish', 'slowga', 'curse']) expect(drawnOnStatus(fx), fx).toBe(true);
    for (const fx of ['hit', 'cure', 'fire', 'atrophy', 'annihilate', 'impulse', 'drain', 'megaflare', 'bloom', 'gather']) expect(drawnOnStatus(fx), fx).toBe(false);
  });
});

describe('the layer: off, the new table is never consulted', () => {
  it('resolves every boss move as it always did (the slash for the lance, the cure for Full-Life, the bloom for the rest) and starts nothing', () => {
    setFxMode('today');
    setFxChapter('seymour-flux');
    const layer = layerFor('ffx');
    expect(layer.resolve({ abilityId: 'lance-of-atrophy' })).toBe('hit');
    expect(layer.resolve({ abilityId: 'full-life', heal: true })).toBe('cure');
    expect(layer.resolve({ abilityId: 'total-annihilation' })).toBe('bloom');
    expect(layer.land('tidus', { abilityId: PSEUDO_FX.gather, deco: true, level: 3 })).toBe(0);
    expect(layer.land('tidus', { abilityId: 'haste', status: true, action: 1, targets: ['tidus'] })).toBe(0);
    expect(layer.snapshot().running).toHaveLength(0);
  });

  it('in a chapter that is not a demo chapter the switch does nothing either', () => {
    setFxMode('new');
    setFxChapter('evrae');
    const layer = layerFor('ffx');
    expect(layer.resolve({ abilityId: 'total-annihilation' })).toBe('bloom');
    expect(layer.land('tidus', { abilityId: PSEUDO_FX.odaura, deco: true, variant: 'tidus' })).toBe(0);
    expect(layer.snapshot().running).toHaveLength(0);
  });
});

describe('the layer with the new effects on', () => {
  it('Chapter I: each boss move resolves to its own effect, and a skill shot is not flown on top of it', () => {
    demo('seymour-flux');
    const layer = layerFor('ffx');
    expect(layer.resolve({ abilityId: 'lance-of-atrophy' })).toBe('atrophy');
    expect(layer.resolve({ abilityId: 'full-life', heal: true })).toBe('fulllife');
    expect(layer.resolve({ abilityId: 'cross-cleave' })).toBe('cleave');
    expect(layer.resolve({ abilityId: 'total-annihilation' })).toBe('annihilate');
    expect(layer.resolve({ abilityId: 'flare-self' })).toBe('flare');
    expect(layer.resolve({ abilityId: 'cure', heal: true })).toBe('cure'); // untouched
    expect(layer.resolve({ abilityId: 'spiral-cut' })).toBe('spiral'); // D-233 stays
    for (const a of ['lance-of-atrophy', 'total-annihilation', 'flare-self', 'jump']) expect(layer.canFly(a, 'seymour-flux'), a).toBe(false);
    expect(layer.canFly('fire', 'tidus')).toBe(true); // an ordinary spell still flies
  });

  it('a status-only landing starts the effect that has no damage event (Haste) and refuses the ones a damage event owns (the slash)', () => {
    demo('seymour-flux');
    const layer = layerFor('ffx');
    const ms = layer.land('tidus', { abilityId: 'haste', status: true, action: 7, targets: ['tidus', 'kimahri'], hitIndex: 0 });
    expect(ms).toBeGreaterThan(0);
    expect(ms).toBeLessThanOrEqual(SPELL_HOLD_CAP_MS);
    expect(layer.snapshot().running.map((r) => `${r.id}:${r.target}`).sort()).toEqual(['haste:kimahri', 'haste:tidus']);
    // the same status again (a second status of the same move) finds the copies already playing
    layer.land('kimahri', { abilityId: 'haste', status: true, action: 7, targets: ['tidus', 'kimahri'], hitIndex: 0 });
    expect(layer.snapshot().running).toHaveLength(2);
    // a physical move with a status rider would draw a second slash: refused
    expect(layer.land('tidus', { abilityId: 'attack', status: true, action: 8, hitIndex: 0 })).toBe(0);
    expect(layer.snapshot().running).toHaveLength(2);
  });

  it('Total Annihilation: one copy per party member, five marks each, the numeral of each hit waits for its own mark', () => {
    demo('seymour-flux');
    const layer = layerFor('ffx');
    const targets = ['tidus', 'yuna', 'kimahri'];
    const first = layer.land('tidus', { abilityId: 'total-annihilation', action: 3, targets, hitIndex: 0, sourceId: 'mortiorchis' });
    expect(first).toBeGreaterThan(0);
    expect(layer.snapshot().running.map((r) => r.id)).toEqual(['annihilate', 'annihilate', 'annihilate']);
    const waits = [0, 1, 2, 3, 4].map((k) => layer.land('tidus', { abilityId: 'total-annihilation', action: 3, targets, hitIndex: k, sourceId: 'mortiorchis' }));
    expect(waits.every((w) => w <= SPELL_HOLD_CAP_MS)).toBe(true);
    // later marks are further out
    for (let k = 1; k < 5; k++) expect(waits[k]!).toBeGreaterThan(waits[k - 1]!);
    layer.update(0.5);
    expect(layer.land('tidus', { abilityId: 'total-annihilation', action: 3, targets, hitIndex: 2, sourceId: 'mortiorchis' })).toBeLessThan(waits[2]!);
  });

  it('Chapter IV: Impulse and Darkness are group effects drawn from their caster; Curse is one copy on the girl it names', () => {
    demo('ffx2-bahamut');
    const layer = layerFor('ffx2');
    const girls = ['yuna', 'rikku', 'paine'];
    layer.land('yuna', { abilityId: 'impulse', action: 4, targets: girls, hitIndex: 0, sourceId: 'bahamut' });
    layer.land('rikku', { abilityId: 'impulse', action: 4, targets: girls, hitIndex: 0, sourceId: 'bahamut' });
    expect(layer.snapshot().running.map((r) => `${r.id}:${r.target}`)).toEqual(['impulse:bahamut']);
    layer.land('bahamut', { abilityId: 'x2-dark-knight-darkness', action: 5, targets: ['bahamut'], hitIndex: 0, sourceId: 'rikku' });
    expect(layer.snapshot().running.map((r) => `${r.id}:${r.target}`)).toEqual(['impulse:bahamut', 'darkness:rikku']);
    layer.land('paine', { abilityId: 'bahamut-curse', action: 6, targets: ['paine'], hitIndex: 0, sourceId: 'bahamut', status: true });
    expect(layer.snapshot().running.map((r) => `${r.id}:${r.target}`)).toContain('curse:paine');
    layer.update(0.5);
    expect(layer.drawList()!.count).toBeGreaterThan(0);
  });

  it('decoration is started and never waited for, and covers no blow: the charge carries its level, the aura and the dress their owner', () => {
    demo('ffx2-bahamut');
    const layer = layerFor('ffx2');
    expect(layer.land('bahamut', { abilityId: PSEUDO_FX.gather, deco: true, level: 4 })).toBe(0);
    expect(layer.land('yuna', { abilityId: PSEUDO_FX.dress, deco: true, variant: 'yuna' })).toBe(0);
    expect(layer.land('yuna', { abilityId: PSEUDO_FX.odaura, deco: true, variant: 'tidus' })).toBe(0); // FFX-2 has no aura
    const run = layer.snapshot().running;
    expect(run.map((r) => `${r.id}:${r.target}:${r.variant}`)).toEqual(['gather:bahamut:4', 'dress:yuna:yuna']);
    expect(layer.covers('bahamut')).toBe(false);
    expect(layer.covers('yuna')).toBe(false);
    // two charges close together are two copies (private action numbers)
    layer.land('bahamut', { abilityId: PSEUDO_FX.gather, deco: true, level: 5 });
    expect(layer.snapshot().running.filter((r) => r.id === 'gather')).toHaveLength(2);
  });

  it('the charge level is clamped 1 to 5 and the aura\'s variant is whatever the presenter named', () => {
    demo('seymour-flux');
    const layer = layerFor('ffx');
    layer.land('mortiorchis', { abilityId: PSEUDO_FX.gather, deco: true, level: 99 });
    layer.land('tidus', { abilityId: PSEUDO_FX.odaura, deco: true, variant: 'tidus' });
    expect(layer.snapshot().running.map((r) => `${r.id}:${r.variant}`)).toEqual(['gather:5', 'odaura:tidus']);
  });

  it('the low tier draws the bloom for all of it', () => {
    demo('seymour-flux');
    const layer = layerFor('ffx');
    layer.qualityOverride = 'low';
    expect(layer.resolve({ abilityId: 'total-annihilation' })).toBe('bloom');
    expect(layer.land('tidus', { abilityId: PSEUDO_FX.odaura, deco: true, variant: 'tidus' })).toBe(0);
    expect(layer.snapshot().running).toHaveLength(0);
  });
});
