/**
 * Step 3 of the new spell effects (motion pass, lane "fx"): the pieces Bailey can take one at a time (`?fxoff=bosses,openings,banner,slab,status`). Each piece turns off alone and leaves the others as they
 * were; with the new effects off, nothing is on at all.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { BattlePresenter } from '../../src/engine/BattlePresenter.ts';
import { OD_CALM_MS } from '../../src/engine/BattlePresenterBossFx.ts';
import type { BattleEvent } from '../../src/battle/common/types.ts';
import { PSEUDO_FX } from '../../src/engine/spellfx/BossFx.ts';
import { FX_PIECES, fxOffFromSearch, fxPieceOn, setFxChapter, setFxMode, setFxPiece } from '../../src/engine/spellfx/FxSwitch.ts';
import { SpellFxLayer } from '../../src/engine/spellfx/SpellFxLayer.ts';
import { AbilityNameSlab } from '../../src/ui/ffx2/NameSlab.ts';
import { FakeDamageNumbers, FakeMessageBar, FakeStage } from './helpers/FakeStage.ts';

afterEach(() => {
  setFxPiece(null);
  setFxMode(null);
  setFxChapter(undefined);
});

const demo = (chapter = 'seymour-flux'): void => {
  setFxMode('new');
  setFxChapter(chapter);
};

const RECTS: Record<string, { x: number; y: number; w: number; h: number }> = {
  tidus: { x: 300, y: 380, w: 160, h: 280 },
  yuna: { x: 480, y: 420, w: 150, h: 270 },
  mortiorchis: { x: 960, y: 260, w: 380, h: 420 },
};
const layer = (game: 'ffx' | 'ffx2' = 'ffx'): SpellFxLayer => new SpellFxLayer({ game, rectOf: (id) => RECTS[id] ?? null, view: () => ({ w: 1600, h: 900 }), quality: () => 'full' });

describe('the address', () => {
  it('names the pieces to turn off: a comma list, unknown words ignored, nothing by default', () => {
    expect(fxOffFromSearch('?pack=demo&fxoff=banner,slab,nonsense')).toEqual(['banner', 'slab']);
    expect(fxOffFromSearch('?fxoff=STATUS, Bosses')).toEqual(['bosses', 'status']);
    expect(fxOffFromSearch('?pack=demo')).toEqual([]);
    expect(fxOffFromSearch(undefined)).toEqual([]);
    expect(FX_PIECES).toEqual(['bosses', 'openings', 'banner', 'slab', 'status']);
  });

  it('every piece is on with the new effects on in a demo chapter, off when they are off or the chapter is not a demo chapter', () => {
    for (const p of FX_PIECES) expect(fxPieceOn(p), `${p} with the switch off`).toBe(false);
    demo();
    for (const p of FX_PIECES) expect(fxPieceOn(p), p).toBe(true);
    setFxChapter('evrae');
    for (const p of FX_PIECES) expect(fxPieceOn(p), `${p} elsewhere`).toBe(false);
  });

  it('a piece turns off alone', () => {
    demo();
    setFxPiece('banner', false);
    expect(FX_PIECES.filter((p) => !fxPieceOn(p))).toEqual(['banner']);
    setFxPiece('banner', true);
    expect(FX_PIECES.every((p) => fxPieceOn(p))).toBe(true);
  });
});

describe('each piece, alone', () => {
  it('bosses off: a boss move resolves as it always did (the lance is the slash), and the openings still draw', () => {
    demo();
    setFxPiece('bosses', false);
    const l = layer();
    expect(l.resolve({ abilityId: 'lance-of-atrophy' })).toBe('hit');
    expect(l.resolve({ abilityId: 'total-annihilation' })).toBe('bloom');
    expect(l.canFly('total-annihilation', 'mortiorchis')).toBe(true); // today's rule: a spell flies
    l.land('tidus', { abilityId: PSEUDO_FX.gather, deco: true, level: 2 });
    expect(l.snapshot().running.map((r) => r.id)).toEqual(['gather']);
  });

  it('openings off: the charge, the aura and the dress change draw nothing, and the boss moves still do', () => {
    demo();
    setFxPiece('openings', false);
    const l = layer();
    l.land('mortiorchis', { abilityId: PSEUDO_FX.gather, deco: true, level: 2 });
    l.land('tidus', { abilityId: PSEUDO_FX.odaura, deco: true, variant: 'tidus' });
    expect(l.snapshot().running).toHaveLength(0);
    expect(l.resolve({ abilityId: 'cross-cleave' })).toBe('cleave');
  });

  it('openings off: the Overdrive opens as it always did, with no aura and no calm beat', async () => {
    demo();
    setFxPiece('openings', false);
    const stage = new FakeStage(['tidus'], ['mortiorchis']);
    const lands: string[] = [];
    stage.vfx.land = (_at, o) => {
      lands.push(String(o.abilityId));
      return 0;
    };
    const sleeps: number[] = [];
    const presenter = new BattlePresenter({ stage, damageNumbers: new FakeDamageNumbers(), messageBar: new FakeMessageBar(), sleep: (ms) => (sleeps.push(ms), Promise.resolve()) });
    await presenter.play([
      { type: 'action-start', actorId: 'tidus', command: { kind: 'overdrive' } as never, abilityId: 'spiral-cut', abilityName: 'Spiral Cut', targets: ['mortiorchis'], seq: 0 },
      { type: 'action-end', actorId: 'tidus', seq: 1 },
    ] as BattleEvent[]);
    expect(lands).toEqual([]);
    expect(sleeps).not.toContain(OD_CALM_MS);
  });

  it('status off: a move with no damage event goes back to drawing nothing from its status', async () => {
    demo();
    setFxPiece('status', false);
    const stage = new FakeStage(['tidus', 'yuna'], ['mortiorchis']);
    const lands: string[] = [];
    stage.vfx.land = (_at, o) => {
      lands.push(String(o.abilityId));
      return 300;
    };
    const presenter = new BattlePresenter({ stage, damageNumbers: new FakeDamageNumbers(), messageBar: new FakeMessageBar(), sleep: () => Promise.resolve() });
    await presenter.play([
      { type: 'action-start', actorId: 'yuna', command: { kind: 'ability' } as never, abilityId: 'haste', abilityName: 'Haste', targets: ['tidus'], seq: 0 },
      { type: 'status-add', targetId: 'tidus', status: 'haste', instance: {} as never, seq: 1 },
      { type: 'action-end', actorId: 'yuna', seq: 2 },
    ] as BattleEvent[]);
    expect(lands).toEqual([]);
  });

  it('slab off: no name over the girl\'s head; banner off: the Ink and Gold slab and the letterbox as they were', () => {
    demo('ffx2-bahamut');
    setFxPiece('slab', false);
    const made: unknown[] = [];
    const overlay = { ownerDocument: { createElement: () => ({ className: '', dataset: {}, style: { setProperty: () => undefined }, remove: () => undefined }) }, appendChild: (el: unknown) => void made.push(el) } as unknown as HTMLElement;
    const slab = new AbilityNameSlab({ overlay: () => overlay, scale: () => 1, head: () => ({ x: 1, y: 100 }) });
    slab.start({ type: 'action-start', actorId: 'rikku', abilityName: 'Darkness', command: { kind: 'ability' }, targets: [], seq: 0 } as never);
    expect(made).toHaveLength(0);
    setFxPiece('slab', true);
    slab.start({ type: 'action-start', actorId: 'rikku', abilityName: 'Darkness', command: { kind: 'ability' }, targets: [], seq: 0 } as never);
    expect(made).toHaveLength(1);
    expect(fxPieceOn('banner')).toBe(true);
    setFxPiece('banner', false);
    expect(fxPieceOn('banner')).toBe(false);
    expect(fxPieceOn('slab')).toBe(true);
  });
});
