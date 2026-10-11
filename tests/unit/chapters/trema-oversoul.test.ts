/**
 * Chapter XIII option 1 (TR7 b): **Oversoul Paragon**, shipped. The stat block and the rows of `research/ffx2-trema.md` §12.2, and the
 * script's place in the engine. Run against the shipped records and the real engine [hard rule 3]. **FFX-2 only.**
 *
 * Re-parity AI-FFX2-b (reason "game-script parity"): the AI is the game's own script `o152` now (`research/re-ffx2-ai-fallen-trema.md` 6); its
 * decision table is `tests/unit/parity-ffx2-ai-oversoul.test.ts`. The first build's script blocks that stood here (SinirothX's dump with a
 * named estimate for every gap: answers at once, any cast waking the Demi loop, a 20 s idle limit as the only clock) are replaced by it.
 */

import { afterEach, describe, expect, it } from 'vitest';
import type { AbilityDef, Command } from '../../../src/battle/common/types.ts';
import { STEPS_PER_SECOND } from '../../../src/battle/ffx2/clock.ts';
import { hitPercent } from '../../../src/battle/ffx2/hit.ts';
import { resolveAbility } from '../../../src/battle/ffx2/resolve.ts';
import { abilityPerformedBy } from '../../../src/battle/ffx2/execute.ts';
import type { Ffx2Unit } from '../../../src/battle/ffx2/internal.ts';
import { OVERSOUL_ESTIMATES, paragonOversoulScript } from '../../../src/battle/ffx2/ai/paragon-oversoul.ts';
import * as data from '../../../src/data/ffx2/index.ts';
import { paragon } from '../../../src/data/ffx2/enemies/paragon.ts';
import { paragonOversoul } from '../../../src/data/ffx2/enemies/paragon-oversoul.ts';
import { CLOISTER_PARAGON_OVERSOUL, cloisterParagonOversoulGroup } from '../../../src/data/ffx2/enemies/trema-options.ts';
import { CLOISTER_TREMA } from '../../../src/data/ffx2/enemies/trema.ts';
import { tremaBuildFor } from '../../../src/data/ffx2/builds/via-infinito-kit.ts';
import { driveChapter, driveParagon, LINES } from '../helpers/tremaDrive.ts';
import { board } from '../helpers/tremaUnits.ts';

const idOf = (c: Command | null): string | null => (c && 'id' in c ? (c as { id: string }).id : null);
const ab = (id: string): AbilityDef => data.ABILITIES[id] as AbilityDef;
const fresh = (seed = 1) => board('paragon', seed, CLOISTER_PARAGON_OVERSOUL);
const DEFAULTS = { ...OVERSOUL_ESTIMATES };
afterEach(() => { Object.assign(OVERSOUL_ESTIMATES, DEFAULTS); });

describe('the Oversoul block and rows (§12.2)', () => {
  it('SinirothX: HP 210,000, Str / Mag 244, Def 88, MDef 89, Agi 244, Luck 16, Eva 0; the normal form\'s immunities', () => {
    expect(paragonOversoul.stats).toEqual({
      // Re-parity W3 (FFX-2 only; reason "game-code parity"): acc is 95, the game's monster row (SinirothX lists none, so the data carried 0).
      hp: 210000, mp: 9999, maxHp: 210000, maxMp: 9999, str: 244, mag: 244, def: 88, mdef: 89, agi: 244, eva: 0, luck: 16, acc: 95,
    });
    expect(paragonOversoul.immunities).toEqual(paragon.immunities);
    expect(paragonOversoul.rewards).toMatchObject({ exp: 13000, ap: 2, gil: 8000 });
    expect(paragonOversoul.aiScriptId).toBe('paragon-oversoul');
    for (const id of paragonOversoul.abilityIds) expect(data.ABILITIES[id], id).toBeDefined();
    expect(cloisterParagonOversoulGroup.nextGroupId).toBe(CLOISTER_TREMA);
  });

  it('the values that remain parameters are at their declared defaults (the game answered the rest)', () => {
    // Re-parity AI-FFX2-b (FFX-2 only): finalImpactReducible is true (the row has the physical bit) and attackItchy false (the row has no
    // status); answerTiming and attackBWakesOn are gone (the answer is made on the next poll, and only a heal that lands on him wakes the
    // Demi loop). idleSeconds (structural) and lowHpActsEveryTurn (D-151, "it waits to be hit") stay as the owner left them.
    expect(OVERSOUL_ESTIMATES).toMatchObject({
      physicalHitPercent: 50, idleSeconds: 20, magicBelow: 0.4, finalBelow: 0.1, finalImpactHits: 14,
      finalImpactReducible: true, agaOnAll: true, attackItchy: false, lowHpActsEveryTurn: false, thinkingPeriod: 0,
    });
  });

  it('its physicals roll the game\'s accuracy formula 2 (its Accuracy and Luck against the girl\'s Luck and Evasion), and cause nothing else; its magic never misses', () => {
    const b = fresh();
    const attack = ab('paragon-os-attack');
    expect(attack.canMiss).not.toBe(false); // hard rule 5: it rolls
    // Re-parity W3 (FFX-2 only; reason "game-code parity"). It used to roll the flat estimate (OVERSOUL_ESTIMATES.physicalHitPercent, 50 %)
    // whatever the girl's stats; the game's row (0x41da) carries accuracy formula 2, so the race is `LCK_a + ACC_a - LCK_t - EVA_t` against
    // a draw of 0..100. Against the Rabite's Foot builds of this board (Luck 111 or 112) that is below zero: it never lands, which is
    // the "luck dodges it" the build was made for. The flat estimate is now unread (listed for Bailey in the W3 handoff).
    const p = b.unit('paragon');
    const race = (luck: number, eva: number): number => (100 * Math.max(0, Math.min(101, p.stats.luck + p.stats.acc - luck - eva))) / 101;
    for (const girl of ['yuna', 'rikku', 'paine']) {
      const g = b.unit(girl);
      expect(hitPercent(p, g, attack)).toBeCloseTo(race(g.stats.luck, g.stats.eva), 6);
      expect(hitPercent(p, g, attack)).toBe(0);
    }
    const bare = b.unit('yuna');
    bare.stats.luck = 11; // a girl without the Rabite's Foot
    expect(hitPercent(p, bare, attack)).toBeCloseTo(race(11, bare.stats.eva), 6);
    expect(hitPercent(p, bare, attack)).toBeGreaterThan(90);
    expect(attack.statusEffects).toEqual([]); // the game's row 0x41da carries no status (AI-FFX2-b, O11; the FAQ's Itchy was one wiki line)
    for (const id of ['paragon-os-judgement', 'paragon-os-holy', 'paragon-os-firaga', 'paragon-os-ultima', 'paragon-os-demi']) {
      expect(ab(id).canMiss, id).toBe(false);
    }
    expect(ab('paragon-os-firaga')).toMatchObject({ power: 21, targeting: 'all-enemies', element: ['fire'] });
    expect(ab('paragon-os-holy')).toMatchObject({ power: 12, hits: 8 });
  });

  it('Final Impact: 14 hits on random girls, each 1/8 of her max HP and 1/8 of her max MP', () => {
    const b = fresh();
    const girls = ['yuna', 'rikku', 'paine'].map(b.unit);
    for (const g of girls) { g.stats.maxHp = 80000; g.hp = 80000; } // survive all 14, to count them
    resolveAbility(b.resolveCtx(), b.unit('paragon'), ab('paragon-os-final-impact'), []);
    const hits = b.events.filter((e) => e.type === 'damage' && e.sourceId === 'paragon');
    // Re-parity W3 (FFX-2 only; reason "game-code parity"): fourteen hits are planned (the first event says so), but the game plans the
    // targets before any damage and a girl who falls mid-action drops her remaining hits (they are not re-aimed), and the hits of one
    // action stack the target's chain (x1.45, x1.5, ... on the same girl), so 80,000 HP does not always outlast the spread. Every hit
    // that lands is still at least 1/8 of her max HP.
    expect(Number(hits[0]!['hitCount'])).toBe(14);
    expect(hits.length).toBeGreaterThanOrEqual(10);
    expect(hits.length).toBeLessThanOrEqual(14);
    // 80,000 / 8 = 10,000 before the randomiser (240 to 271 / 256): past the 9,999 cap, which it breaks.
    for (const h of hits) expect(Number(h.amount)).toBeGreaterThanOrEqual(9375);
    expect(hits.some((h) => Number(h.amount) > 9999)).toBe(true);
    const mp = b.events.filter((e) => e.type === 'mp-damage');
    expect(mp.length).toBeGreaterThan(0);
    for (const m of mp) {
      const g = b.unit(m.targetId as string);
      expect(m.amount).toBeLessThanOrEqual(Math.floor(g.stats.maxMp / 8));
    }
  });
});

describe('its script in the engine (the decision table is parity-ffx2-ai-oversoul.test.ts)', () => {
  it('waits while nobody touches it, and plays the Oversoul line on its first poll', () => {
    const b = fresh();
    expect(paragonOversoulScript.decide(b.ctx('paragon'))).toBeNull();
    expect(b.events.some((e) => e.type === 'message' && /oversouls/.test(String(e.text)))).toBe(true);
    expect(paragonOversoulScript.decide(b.ctx('paragon'))).toBeNull();
    expect(paragonOversoulScript.counter).toBeUndefined(); // no Big Bang counter in this form
    expect(paragonOversoulScript.onPartyAction).toBeUndefined(); // it answers on its next poll, from the reaction entry
  });

  it('left alone for the idle time: Judgement, Genesis or Big Bang; Dispel if anyone is Reflected', () => {
    const b = fresh();
    paragonOversoulScript.decide(b.ctx('paragon'));
    const state = b.engine.state() as { ticks: number };
    // Re-parity W4 (FFX-2 only): the engine's clock is the logic step (29.97 a second), not 3,000 ticks a second.
    const idle = OVERSOUL_ESTIMATES.idleSeconds * STEPS_PER_SECOND;
    const quiet = state.ticks;
    state.ticks = quiet + idle - 1;
    expect(paragonOversoulScript.decide(b.ctx('paragon'))).toBeNull();
    state.ticks = quiet + idle;
    expect(['paragon-os-judgement', 'paragon-genesis', 'paragon-big-bang']).toContain(idOf(paragonOversoulScript.decide(b.ctx('paragon'))));
    state.ticks += idle;
    b.unit('rikku').statuses.reflect = { ticksRemaining: null } as never;
    expect(idOf(paragonOversoulScript.decide(b.ctx('paragon')))).toBe('paragon-os-dispel');
  });
});

describe('Oversoul Paragon through the engine', () => {
  it('learns the ability of a charged party action (Darkness charges; its action-start is in an earlier slice)', () => {
    const r = driveParagon(LINES.kitDarknessOnParagon, 2, { build: tremaBuildFor('sourced-kit'), paragonGroup: CLOISTER_PARAGON_OVERSOUL });
    const i = r.log.findIndex((e) => e.type === 'action-start' && (e as { abilityId?: string }).abilityId === 'x2-dark-knight-darkness');
    expect(i).toBeGreaterThanOrEqual(0);
    expect(r.log.some((e) => e.type === 'counter' && (e as { abilityId?: string }).abilityId === 'paragon-big-bang')).toBe(false);
    // Re-parity AI-FFX2-b (reason "game-script parity"): it answers on its NEXT POLL, as an ordinary action of its own (the first build answered at
    // once, as a counter): after the Darkness, a Normal Attack at a uniform girl.
    expect(r.log.some((e) => e.type === 'counter')).toBe(false);
    const answer = r.log.findIndex((e, j) => j > i && e.type === 'action-start' && (e as { actorId?: string }).actorId === 'paragon');
    expect(answer).toBeGreaterThan(i);
    expect((r.log[answer] as { abilityId?: string }).abilityId).toBe('paragon-os-attack');
    const b = fresh();
    expect(abilityPerformedBy(b.unit('yuna') as Ffx2Unit)).toBeUndefined();
  });

  it('never acts before the party does, and every run ends, alone and as the chapter\'s first link', () => {
    for (const seed of [1, 2, 3]) {
      const r = driveParagon(LINES.kitIntended, seed, { build: tremaBuildFor('sourced-kit'), paragonGroup: CLOISTER_PARAGON_OVERSOUL });
      expect(['victory', 'defeat']).toContain(r.outcome);
      const first = r.log.find((e) => e.type === 'action-start');
      expect(first && (first as { actorId: string }).actorId).not.toBe('paragon');
      const c = driveChapter(LINES.kitIntended, seed, { build: tremaBuildFor('sourced-kit'), paragonGroup: CLOISTER_PARAGON_OVERSOUL });
      expect(['victory', 'defeat']).toContain(c.outcome);
    }
  });
});
