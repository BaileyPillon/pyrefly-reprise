/**
 * THE AUDIO PASS AT THE PRESENTER (conference demo sound pass, 2026-10-22; decision 184), after the review of branch audio-pass: what `playCue` hands the mixer with the pass on and off.
 *
 *  - **M2.** FFX-2's ATB overlaps actions, and the first `action-end` of a burst clears the action on screen; the blows of the other actors that follow found no action and played a bare tick (34 of
 *    Chapter IV's 52 blows, measured). With the pass on a blow whose own striker's action has not ended resolves by it; off, it is the tick, exactly as today.
 *  - **M4.** A spell's landing starts on its first audible sample (the plan carries `baseSkip`), and waits for the effect's mark when the effect is not there yet.
 *  - **Minor 2.** A critical's dip is timed from the swing (`attackBeat`), a boss's headline blow's from the landing wait (`landingBeat`), and Mega Flare's is on its LAST blow, Total Annihilation's on its FIRST.
 *  - The victory sting is dropped for the results cue only with the pass on (`passEarlyVictory`).
 * What any of it sounds like is Bailey's to judge (AGENTS.md rule 13).
 */
import { afterEach, describe, expect, it } from 'vitest';
import { sfxVoiceFor } from '../../src/app/screens/battleSfxVoice.ts';
import type { BattleEvent, BattleState } from '../../src/battle/common/types.ts';
import { noteSfxEvent, playCue } from '../../src/engine/BattlePresenterSfx.ts';
import { beginSpellAction } from '../../src/engine/BattlePresenterSpellFx.ts';
import type { EventCtx } from '../../src/engine/BattlePresenterEvents.ts';
import { attackBeat, landedNow, landingBeat, passEarlyVictory } from '../../src/engine/PassBeats.ts';
import { awaitSpellLanding } from '../../src/engine/BattlePresenterSpellFx.ts';
import { setAudioNew, setPassAddress, setPassChapter } from '../../src/audio/pass/passSwitch.ts';
import { setPassVictoryCue } from '../../src/audio/pass/passResults.ts';
import { DIPS } from '../../src/audio/pass/passRecipes.ts';
import { passLogGet, passNow } from '../../src/audio/pass/passLog.ts';
import { blowNear, resetBlows } from '../../src/audio/pass/passMask.ts';
import type { PassPlan } from '../../src/audio/pass/passTypes.ts';

interface Played {
  key: string;
  volume?: number;
  pass?: PassPlan;
}

function fakeCtx(game: 'ffx' | 'ffx2', state: BattleState, markIn?: () => number): { ctx: EventCtx; played: Played[]; dips: { aheadMs: number; plan: unknown }[]; music: { cue: string; fade?: number }[] } {
  const played: Played[] = [];
  const dips: { aheadMs: number; plan: unknown }[] = [];
  const music: { cue: string; fade?: number }[] = [];
  const audio = {
    playSfx: (key: string, o?: { volume?: number; pass?: PassPlan }) => played.push({ key, ...(o?.volume !== undefined ? { volume: o.volume } : {}), ...(o?.pass ? { pass: o.pass } : {}) }),
    playMusic: (cue: string, o?: { fade?: number }) => {
      music.push({ cue, ...(o?.fade !== undefined ? { fade: o.fade } : {}) });
      return Promise.resolve();
    },
    stopMusic: () => undefined,
    musicDip: (aheadMs: number, plan: unknown) => dips.push({ aheadMs, plan }),
  };
  const ctx = {
    deps: { audio, sfxVoice: sfxVoiceFor(game, () => state) },
    actingId: null,
    stage: { vfx: markIn ? { markIn } : {} },
    sleep: () => Promise.resolve(),
  } as unknown as EventCtx;
  return { ctx, played, dips, music };
}

const state = {
  combatants: {
    yuna: { side: 'party', dresspheres: { current: 'gunner' } },
    rikku: { side: 'party', dresspheres: { current: 'thief' } },
    paine: { side: 'party', dresspheres: { current: 'warrior' } },
    bahamut: { side: 'enemy' },
  },
} as unknown as BattleState;

const start = (actorId: string, abilityId?: string): BattleEvent => ({ type: 'action-start', actorId, command: { kind: 'attack', targets: [] }, targets: ['bahamut'], ...(abilityId ? { abilityId } : {}) }) as unknown as BattleEvent;
const end = (actorId: string): BattleEvent => ({ type: 'action-end', actorId }) as unknown as BattleEvent;
const hit = (sourceId: string, over: Record<string, unknown> = {}): BattleEvent => ({ type: 'damage', targetId: 'bahamut', sourceId, amount: 100, element: 'none', crit: false, hitIndex: 0, hitCount: 1, ...over }) as unknown as BattleEvent;

afterEach(() => {
  setAudioNew(null);
  setPassAddress(undefined);
  setPassChapter(undefined);
  setPassVictoryCue(null);
  resetBlows();
  passLogGet(true);
});

describe("overlapped actions (FFX-2's ATB): a blow resolves by its striker's own action", () => {
  // Rikku and Yuna start together; Yuna's action ends first and clears the action on screen; Rikku's blow then arrives, and so does a late blow of Yuna's own.
  const burst = (ctx: EventCtx): void => {
    noteSfxEvent(ctx, start('rikku'));
    noteSfxEvent(ctx, start('yuna'));
    noteSfxEvent(ctx, end('yuna'));
  };

  it('plays the weapon hit with its layers for the blow that outlived the first action-end, with the pass on', () => {
    setPassAddress('?pack=demo');
    setPassChapter('ffx2-bahamut');
    const { ctx, played } = fakeCtx('ffx2', state);
    burst(ctx);
    noteSfxEvent(ctx, hit('rikku'));
    playCue(ctx, 'damage');
    expect(played).toHaveLength(1);
    expect(played[0]!.key).toBe('v2:hit-dagger');
    expect(played[0]!.pass?.baseSkip).toBe(true);
    expect(played[0]!.pass?.layers.map((l) => l.role)).toEqual(['body', 'character']);
  });

  it("still gives a tick to a blow whose striker's action has ended, and to one nothing names", () => {
    setPassAddress('?pack=demo');
    setPassChapter('ffx2-bahamut');
    const { ctx, played } = fakeCtx('ffx2', state);
    burst(ctx);
    noteSfxEvent(ctx, hit('yuna')); // Yuna's own action-end already played
    playCue(ctx, 'damage');
    noteSfxEvent(ctx, { type: 'damage', targetId: 'rikku', amount: 5, element: 'none', crit: false } as unknown as BattleEvent); // a poison tick: no source
    playCue(ctx, 'damage');
    expect(played.map((p) => p.key)).toEqual(['v2:hit-2', 'v2:hit-2']);
    expect(played.every((p) => p.volume === 0.6 && p.pass === undefined)).toBe(true);
  });

  it("is today's tick with the pass off: the same overlapped blow, nothing new", () => {
    setPassAddress('?pack=off');
    setPassChapter('ffx2-bahamut');
    const { ctx, played } = fakeCtx('ffx2', state);
    burst(ctx);
    noteSfxEvent(ctx, hit('rikku'));
    playCue(ctx, 'damage');
    expect(played).toHaveLength(1);
    expect(played[0]!.key).not.toBe('v2:hit-dagger');
    expect(played[0]!.volume).toBe(0.6);
    expect(played[0]!.pass).toBeUndefined();
  });
});

describe("a spell's landing", () => {
  const fireState = { combatants: { lulu: { side: 'party' }, flux: { side: 'enemy' } } } as unknown as BattleState;
  const cast = (ctx: EventCtx): void => {
    const e = { type: 'action-start', actorId: 'lulu', abilityId: 'fire', command: { kind: 'ability', targets: [] }, targets: ['flux'] } as unknown as BattleEvent;
    noteSfxEvent(ctx, e);
    beginSpellAction(ctx, e as Extract<BattleEvent, { type: 'action-start' }>);
    noteSfxEvent(ctx, { type: 'damage', targetId: 'flux', sourceId: 'lulu', amount: 100, element: 'fire', crit: false, hitIndex: 0, hitCount: 1 } as unknown as BattleEvent);
  };

  it("starts on its first audible sample even when the effect is already at its mark (the cue's lead-in sat after the mark)", () => {
    setPassAddress('?pack=demo');
    setPassChapter('seymour-flux');
    const { ctx, played } = fakeCtx('ffx', fireState, () => 0);
    cast(ctx);
    playCue(ctx, 'damage');
    expect(played[0]!.key).toBe('v2:fire');
    expect(played[0]!.pass).toEqual({ layers: [], baseSkip: true });
  });

  it('also waits for the effect when it is not at its mark yet', () => {
    setPassAddress('?pack=demo');
    setPassChapter('seymour-flux');
    const { ctx, played } = fakeCtx('ffx', fireState, () => 240);
    cast(ctx);
    playCue(ctx, 'damage');
    expect(played[0]!.pass).toEqual({ layers: [], baseSkip: true, landingMs: 240 });
  });

  it('is the cue as it always played with the pass off', () => {
    setPassAddress('?pack=off');
    setPassChapter('seymour-flux');
    const { ctx, played } = fakeCtx('ffx', fireState, () => 240);
    cast(ctx);
    playCue(ctx, 'damage');
    expect(played[0]!.key).toBe('v2:fire');
    expect(played[0]!.pass).toBeUndefined();
  });
});

describe("the dip before a big blow", () => {
  const ctxWith = (events: BattleEvent[]): ReturnType<typeof fakeCtx> => {
    setPassAddress('?pack=demo');
    setPassChapter('seymour-flux');
    const f = fakeCtx('ffx', state);
    (f.ctx as unknown as { burst: unknown }).burst = { events, at: 0 };
    return f;
  };

  it("dips for a critical from the swing: the music goes down `lead` before the strike's contact", () => {
    const { ctx, dips } = ctxWith([start('tidus'), hit('tidus', { crit: true }), end('tidus')]);
    attackBeat(ctx, 400);
    expect(dips).toEqual([{ aheadMs: 400, plan: DIPS.crit }]);
    expect(passLogGet().filter((e) => e.kind === 'dip')[0]).toMatchObject({ big: 'crit', why: 'attack' });
  });

  it('does not dip for a plain blow, or when the burst is not known', () => {
    const plain = ctxWith([start('tidus'), hit('tidus'), end('tidus')]);
    attackBeat(plain.ctx, 400);
    expect(plain.dips).toEqual([]);
    const none = fakeCtx('ffx', state);
    setPassAddress('?pack=demo');
    setPassChapter('seymour-flux');
    attackBeat(none.ctx, 400);
    expect(none.dips).toEqual([]);
  });

  const mark = (move: string, hitIndex: number, hitCount: number): { n: number } => {
    const f = fakeCtx('ffx2', state);
    setPassAddress('?pack=demo');
    setPassChapter('ffx2-bahamut');
    const a = { serial: 1, actorId: 'bahamut', abilityId: move, targets: ['yuna', 'rikku', 'paine'] };
    landingBeat(f.ctx, hit('bahamut', { hitIndex, hitCount }) as Extract<BattleEvent, { type: 'damage' }>, a, 50);
    return { n: f.dips.length };
  };

  it("puts Mega Flare's dip on its first landing, the only one with a lead, and Total Annihilation's on its first, where feel stops it", () => {
    expect(mark('mega-flare', 0, 3).n).toBe(1);
    expect(mark('mega-flare', 1, 3).n).toBe(0);
    expect(mark('mega-flare', 2, 3).n).toBe(0);
    expect(mark('total-annihilation', 0, 5).n).toBe(1);
    expect(mark('total-annihilation', 4, 5).n).toBe(0);
    expect(mark('cross-cleave', 0, 1).n).toBe(1);
  });
});

describe('the motion sounds on a blow that lands with no wait ahead of it', () => {
  it('keeps them off the blow with the pass on, and does nothing with it off', () => {
    setPassAddress('?pack=off');
    setPassChapter('seymour-flux');
    const f = fakeCtx('ffx', state);
    const hit = { type: 'damage', targetId: 'bahamut', sourceId: 'yuna', amount: 50, element: 'fire', crit: false, hitIndex: 1, hitCount: 5 } as Extract<BattleEvent, { type: 'damage' }>;
    landedNow(f.ctx, hit);
    expect(blowNear(passNow())).toBe(false);
    setPassAddress('?pack=demo');
    landedNow(f.ctx, hit);
    expect(blowNear(passNow())).toBe(true);
    // the next hit of a five-hit move is due one pacing step on: a zip asked just ahead of it is kept off it (and the last hit has no next)
    expect(blowNear(passNow() + 190 - 20)).toBe(true);
    resetBlows();
    landedNow(f.ctx, { ...hit, hitIndex: 4 });
    expect(blowNear(passNow() + 400)).toBe(false);
  });

  it("reads the next blow from the burst, not from the hit's index (Fire's fifth hit lands on the second target before its second)", () => {
    setPassAddress('?pack=demo');
    setPassChapter('seymour-flux');
    const f = fakeCtx('ffx', state);
    const dmg = (hitIndex: number, over: Record<string, unknown> = {}): BattleEvent => ({ type: 'damage', targetId: 'bahamut', sourceId: 'yuna', amount: 50, element: 'fire', crit: false, hitIndex, hitCount: 5, ...over }) as unknown as BattleEvent;
    const events = [dmg(0), dmg(4), dmg(1), dmg(2), dmg(3), end('yuna'), dmg(0, { sourceId: 'tidus' })];
    const at = (i: number): void => {
      (f.ctx as unknown as { burst: unknown }).burst = { events, at: i };
      landedNow(f.ctx, events[i] as Extract<BattleEvent, { type: 'damage' }>);
    };
    resetBlows();
    at(1); // the fifth hit, second on screen: three more follow
    expect(blowNear(passNow() + 190 - 20)).toBe(true);
    resetBlows();
    at(4); // the last hit on screen: the action ends, and another actor's blow after it is not this move's
    expect(blowNear(passNow() + 400)).toBe(false);
    expect(blowNear(passNow() + 190)).toBe(false);
  });

  const land = (ms: number, heal: boolean): Promise<void> => {
    const f = fakeCtx('ffx', state);
    (f.ctx as unknown as { stage: unknown }).stage = { vfx: { land: () => ms }, actor: () => undefined };
    const event = { type: 'damage', targetId: 'bahamut', sourceId: 'yuna', amount: heal ? -50 : 50, element: 'none', crit: false, hitIndex: 0, hitCount: 1 } as Extract<BattleEvent, { type: 'damage' }>;
    return awaitSpellLanding(f.ctx, event, heal);
  };

  it("is asked for by the spell wait when the mark has already passed, for a blow and not for a heal", async () => {
    setPassAddress('?pack=demo');
    setPassChapter('ffx2-bahamut');
    await land(0, true);
    expect(blowNear(passNow())).toBe(false); // a heal landing is not a blow
    await land(0, false);
    expect(blowNear(passNow())).toBe(true);
  });
});

describe("Chapter I's one fanfare", () => {
  it('starts the results cue at the last blow and says the sting is dropped, only with the pass on', () => {
    setPassVictoryCue('victory-ffx');
    setPassAddress('?pack=off');
    setPassChapter('seymour-flux');
    const off = fakeCtx('ffx', state);
    expect(passEarlyVictory(off.ctx, 0.3)).toBe(false);
    expect(off.music).toEqual([]);
    setPassAddress('?pack=demo');
    const on = fakeCtx('ffx', state);
    expect(passEarlyVictory(on.ctx, 0.3)).toBe(true);
    expect(on.music).toEqual([{ cue: 'victory-ffx', fade: 0.3 }]);
    setPassVictoryCue(null);
    expect(passEarlyVictory(fakeCtx('ffx', state).ctx, 0.3)).toBe(false); // a chapter with no cue keeps its sting
  });
});
