/**
 * **Re-parity, Chapter XII (2 of 2): the discs, when his affinity changes, the three-turn sequence and the counter** (FFX only).
 *
 * Rows of `research/re-ffx-ai-seymour.md` section 5 (5.2, 5.3, 5.4 and 5.5); the rows that differ from the old AI are D-24, D-25,
 * D-27 to D-30 and D-32 of the note's section 6. The first half is `parity-ffx-ai-omnis.test.ts`.
 */

import { describe, expect, it } from 'vitest';
import type { AbilityDef, Affinity, BattleEvent } from '../../src/battle/common/types.ts';
import { chooseAiCommand } from '../../src/battle/ffx/index.ts';
import { summonAeon } from '../../src/battle/ffx/aeons.ts';
import { runPreTurn } from '../../src/battle/ffx/ai/hooks.ts';
import { planOmnisVolley } from '../../src/battle/ffx/ai/seymour-omnis.ts';
import { DISC_RING, OMNIS_DISCS, OMNIS_HITS, OMNIS_LOW, OMNIS_RESET_CYCLE, OMNIS_STATE, type Element4, omnisDiscs, refreshOmnisAffinities } from '../../src/battle/ffx/ai/seymour-omnis-rules.ts';
import { gardenOfPainBuild } from '../../src/data/ffx/builds/garden-of-pain.ts';
import { ALL_ABILITIES } from '../../src/data/ffx/index.ts';
import { act, at, exactHit, idOf, realCtx, status, withRng } from './helpers/seymourParity.ts';

const OMNIS = 'seymour-omnis';
const ability = (id: string): AbilityDef => {
  const def = ALL_ABILITIES.find((a) => a.id === id);
  if (!def) throw new Error(`no ability ${id}`);
  return def;
};
const DISC = (n: number): string => `mortiphasm-${n}`;
const fresh = (seed = 1) => realCtx('seymour-omnis', seed, gardenOfPainBuild);
type TestCtx = ReturnType<typeof fresh>['ctx'];

const LETTER_TO_ELEMENT: Record<string, Element4> = { F: 'fire', I: 'ice', W: 'water', T: 'lightning' };
/** Put the four discs in a layout ('FIWT' = disc 1 Fire, disc 2 Ice, disc 3 Water, disc 4 Thunder) and refresh him. */
function setDiscs(ctx: TestCtx, layout: string): void {
  ctx.state.flags[OMNIS_DISCS] = [...layout].map((l) => LETTER_TO_ELEMENT[l]).join(',');
  refreshOmnisAffinities(ctx);
}

describe('what turns a disc (m106 onHit @0x113; the scenes @0x1842 to 0x1b28; D-25, D-32)', () => {
  const probe = (id: string, damageType: AbilityDef['damageType'], extra: Partial<AbilityDef> = {}): AbilityDef =>
    exactHit(id, 100, { damageType, ...extra });
  const spell = probe('spell', 'magical');
  const blow = probe('blow', 'physical');
  // A physical blow reaches a disc only from someone who reaches out of melee (Wakka, Valefor, Anima, Mindy: `targeting.ts`).
  const BLOWS = 'wakka';

  it('a magical hit turns a disc +1 on the ring Fire -> Ice -> Water -> Thunder -> Fire, a physical hit -1', () => {
    expect(DISC_RING).toEqual(['fire', 'ice', 'water', 'lightning']);
    const { ctx } = fresh();
    const seenUp: Element4[] = [];
    for (let i = 0; i < 5; i++) {
      act(ctx, 'tidus', spell, [DISC(1)]);
      seenUp.push(omnisDiscs(ctx.state)[0] as Element4);
    }
    expect(seenUp).toEqual(['ice', 'water', 'lightning', 'fire', 'ice']);
    const seenDown: Element4[] = [];
    for (let i = 0; i < 5; i++) {
      act(ctx, BLOWS, blow, [DISC(1)]);
      seenDown.push(omnisDiscs(ctx.state)[0] as Element4);
    }
    expect(seenDown).toEqual(['fire', 'lightning', 'water', 'ice', 'fire']);
  });

  it('a Fire disc hit by magic becomes Ice, and hit by a blow becomes Thunder (the old ring gave Thunder and Water)', () => {
    const a = fresh().ctx;
    act(a, 'tidus', spell, [DISC(2)]);
    expect(omnisDiscs(a.state)).toEqual(['fire', 'ice', 'fire', 'fire']);
    const b = fresh().ctx;
    act(b, BLOWS, blow, [DISC(3)]);
    expect(omnisDiscs(b.state)).toEqual(['fire', 'fire', 'lightning', 'fire']);
  });

  it('a blow from someone who cannot reach out of melee never reaches a disc (the authored reach rule stays): it falls on Seymour instead', () => {
    const { ctx } = fresh();
    act(ctx, 'tidus', blow, [DISC(1)]);
    expect(omnisDiscs(ctx.state)).toEqual(['fire', 'fire', 'fire', 'fire']);
    expect(ctx.state.flags[OMNIS_HITS]).toBe(1);
  });

  it('only the damage type decides: any other type does nothing, and neither does a hit on Seymour himself', () => {
    const { ctx } = fresh();
    act(ctx, 'tidus', probe('neither', 'other'), [DISC(1)]);
    act(ctx, 'tidus', probe('typeless', 'none' as AbilityDef['damageType']), [DISC(2)]);
    act(ctx, 'tidus', spell, [OMNIS]);
    expect(omnisDiscs(ctx.state)).toEqual(['fire', 'fire', 'fire', 'fire']);
  });

  it('not the target mode, the item or the spell: an all-target spell, a typed item and a multi-hit blow all turn a disc', () => {
    const all = fresh().ctx;
    act(all, 'tidus', probe('aoe-spell', 'magical', { targeting: 'all-enemies' }), [DISC(1), DISC(2), DISC(3), DISC(4)]);
    expect(omnisDiscs(all.state)).toEqual(['ice', 'ice', 'ice', 'ice']);

    const item = fresh().ctx;
    act(item, BLOWS, probe('grenade', 'physical', { category: 'item' }), [DISC(4)]);
    expect(omnisDiscs(item.state)).toEqual(['fire', 'fire', 'fire', 'lightning']);

    const two = fresh().ctx;
    act(two, BLOWS, probe('double-blow', 'physical', { hits: 2 }), [DISC(1)]);
    expect(omnisDiscs(two.state)).toEqual(['lightning', 'fire', 'fire', 'fire']); // one turn per action, not per hit
  });

  it('the first disc a member turns gets a line, once: Wakka\'s if it was his', () => {
    const a = fresh().ctx;
    const eventsA = act(a, 'tidus', spell, [DISC(1)]);
    const triggers = (events: readonly BattleEvent[]): string[] =>
      events.filter((e) => e.type === 'script-trigger').map((e) => (e as { name: string }).name);
    expect(triggers(eventsA)).toEqual(['omnis-disc-turned']);
    expect(triggers(act(a, 'tidus', spell, [DISC(2)]))).toEqual([]);
    const b = fresh().ctx;
    expect(triggers(act(b, 'wakka', spell, [DISC(1)]))).toEqual(['omnis-disc-turned-wakka']);
  });
});

describe('when his affinity changes (section 5.3, last paragraph; D-30)', () => {
  const spell = exactHit('spell', 100, { damageType: 'magical' });

  it('a disc turned in an action is seen at the next turn start, not inside the action: a Doublecast\'s second spell meets the old affinity', () => {
    const { ctx } = fresh();
    const omnis = at(ctx, OMNIS);
    act(ctx, 'tidus', spell, [DISC(1)]); // the first of the Doublecast's two spells turns Fire to Ice
    expect(omnisDiscs(ctx.state)).toEqual(['ice', 'fire', 'fire', 'fire']);
    expect(omnis.affinities.fire).toBe('absorb'); // the second spell still meets Absorb Fire / Weak Ice, not Resist Ice
    expect(omnis.affinities.ice).toBe('weak');
  });

  it('every actor\'s turn start refreshes it: a party member\'s and an aeon\'s, as the formation script\'s handlers do', () => {
    for (const actor of ['tidus', 'yuna', 'auron']) {
      const { ctx } = fresh();
      act(ctx, 'tidus', spell, [DISC(1)]);
      runPreTurn(ctx, at(ctx, actor));
      expect(at(ctx, OMNIS).affinities.fire, actor).toBe('absorb'); // three Fire and an Ice: Absorb Fire, Resist Ice
      expect(at(ctx, OMNIS).affinities.ice, actor).toBe('resist');
    }
    const { ctx } = fresh();
    summonAeon(ctx, 'yuna', 'shiva');
    act(ctx, 'tidus', spell, [DISC(1)]);
    runPreTurn(ctx, at(ctx, 'shiva'));
    expect(at(ctx, OMNIS).affinities.ice).toBe('resist');
  });

  it('his own copy stops outside his normal state (the glow, the Dispel, the Ultima, the reset), while a party member\'s does not', () => {
    for (const state of ['red', 'dispelled', 'reset-due']) {
      const { ctx } = fresh();
      act(ctx, 'tidus', spell, [DISC(1)]);
      ctx.state.flags[OMNIS_STATE] = state;
      runPreTurn(ctx, at(ctx, OMNIS));
      expect(at(ctx, OMNIS).affinities.ice, state).toBe('weak'); // unchanged
      runPreTurn(ctx, at(ctx, 'yuna'));
      expect(at(ctx, OMNIS).affinities.ice, state).toBe('resist');
    }
    const { ctx } = fresh();
    act(ctx, 'tidus', spell, [DISC(1)]);
    runPreTurn(ctx, at(ctx, OMNIS));
    expect(at(ctx, OMNIS).affinities.ice).toBe('resist'); // in the normal state his own copy refreshes too
  });

  it('the disc events name the layout the next refresh will write (the readout and the Sensor redraw from it)', () => {
    const { ctx } = fresh();
    const events = act(ctx, 'tidus', spell, [DISC(1)]);
    const change = events.find((e) => e.type === 'affinity-change');
    expect(change).toMatchObject({ targetId: OMNIS, cause: 'part-turn', partId: DISC(1), direction: 'right' });
    expect((change as { affinities: Record<string, Affinity> }).affinities.ice).toBe('resist');
  });
});

describe('his three-turn sequence (m131 @0x16cf to 0x1742, table 5.4) and the colours of the reset (D-24, D-27)', () => {
  /** Count `n` hits on him with a plain probe. */
  const strike = (ctx: TestCtx, n: number): void => {
    for (let i = 0; i < n; i++) act(ctx, 'tidus', exactHit('tap', 50), [OMNIS]);
  };

  it('glow -> Dispel (Defense 100) -> Ultima (Defense 150) -> a reset turn with no spells -> normal, and Defense is never restored', () => {
    const { ctx } = fresh();
    const omnis = at(ctx, OMNIS);
    strike(ctx, 6);
    expect(ctx.state.flags[OMNIS_STATE]).toBe('red');
    expect(idOf(chooseAiCommand(ctx, omnis))).toBe('omnis-dispel');
    expect([ctx.state.flags[OMNIS_STATE], omnis.stats.def]).toEqual(['dispelled', 100]);
    expect(idOf(chooseAiCommand(ctx, omnis))).toBe('omnis-ultima');
    expect([ctx.state.flags[OMNIS_STATE], omnis.stats.def]).toEqual(['reset-due', 150]);
    const rng = withRng(ctx, [1, 2, 3, 4]);
    expect(chooseAiCommand(ctx, omnis)).toBeNull(); // the reset turn is only the reset: no spell, no draw
    expect(rng.calls).toHaveLength(0);
    expect([ctx.state.flags[OMNIS_STATE], omnis.stats.def]).toEqual(['normal', 150]);
    expect(idOf(chooseAiCommand(ctx, omnis))).toBe('omnis-volley');
  });

  it('the reset turns every disc to one colour, in the order Ice, Water, Thunder, Fire, then Ice again', () => {
    expect(OMNIS_RESET_CYCLE[1]).toBe('ice');
    const { ctx } = fresh();
    const omnis = at(ctx, OMNIS);
    const seen: string[] = [];
    for (let i = 0; i < 6; i++) {
      ctx.state.flags[OMNIS_STATE] = 'reset-due';
      chooseAiCommand(ctx, omnis);
      const discs = omnisDiscs(ctx.state);
      expect(new Set(discs).size).toBe(1);
      seen.push(discs[0] as string);
    }
    expect(seen).toEqual(['ice', 'water', 'lightning', 'fire', 'ice', 'water']);
  });

  it('the reset overwrites any layout, and the next normal turn then casts the all-one-colour volley', () => {
    const { ctx } = fresh();
    setDiscs(ctx, 'FIWT');
    ctx.state.flags[OMNIS_STATE] = 'reset-due';
    chooseAiCommand(ctx, at(ctx, OMNIS));
    runPreTurn(ctx, at(ctx, 'tidus'));
    expect(omnisDiscs(ctx.state)).toEqual(['ice', 'ice', 'ice', 'ice']);
    expect(planOmnisVolley(ctx).map((c) => c.abilityId)).toEqual(Array(4).fill('omnis-blizzaga'));
    expect(at(ctx, OMNIS).affinities.ice).toBe('absorb');
    expect(at(ctx, OMNIS).affinities.fire).toBe('weak');
  });

  it('Dispel and Ultima are aimed at the whole front line', () => {
    const { ctx } = fresh();
    ctx.state.flags[OMNIS_STATE] = 'red';
    expect(chooseAiCommand(ctx, at(ctx, OMNIS))?.targets).toEqual([]);
    expect(chooseAiCommand(ctx, at(ctx, OMNIS))?.targets).toEqual([]);
  });
});

describe('his onHit (m131 @0x176a, section 5.5): the counter, the latch and the ignored hits (D-28, D-29)', () => {
  const tap = exactHit('tap', 50);
  const hits = (ctx: TestCtx): number => (ctx.state.flags[OMNIS_HITS] as number | undefined) ?? 0;

  it('the sixth action that reaches him lights the glow and zeroes the counter; the fifth does not', () => {
    const { ctx } = fresh();
    for (let i = 1; i <= 5; i++) {
      act(ctx, 'tidus', tap, [OMNIS]);
      expect([ctx.state.flags[OMNIS_STATE], hits(ctx)], `after ${i}`).toEqual(['normal', i]);
    }
    const events = act(ctx, 'tidus', tap, [OMNIS]);
    expect([ctx.state.flags[OMNIS_STATE], hits(ctx)]).toEqual(['red', 0]);
    expect(events.some((e) => e.type === 'message' && e.kind === 'telegraph')).toBe(true);
  });

  it('one event per action: a multi-hit action counts once; a miss, a heal and a status-only move count too', () => {
    const { ctx } = fresh();
    act(ctx, 'tidus', exactHit('five-hits', 50, { hits: 5 }), [OMNIS]);
    expect(hits(ctx)).toBe(1);
    // a miss: a Nul spell on him swallows the cast, and the refusal is still an event
    at(ctx, OMNIS).statuses['nulfrost'] = status('nulfrost');
    const refused = act(ctx, 'yuna', exactHit('ice-probe', 50, { element: ['ice'], damageType: 'magical' }), [OMNIS]);
    expect(refused.some((e) => e.type === 'miss' && e.reason === 'nullified' && e.targetId === OMNIS)).toBe(true);
    expect(hits(ctx)).toBe(2);
    // a heal on him
    const healed = act(ctx, 'yuna', ability('cure'), [OMNIS]);
    expect(healed.some((e) => e.type === 'damage' && e.targetId === OMNIS && e.amount < 0)).toBe(true);
    expect(hits(ctx)).toBe(3);
    // a status-only move
    act(ctx, 'yuna', ability('slow'), [OMNIS]);
    expect(hits(ctx)).toBe(4);
  });

  it('under 20,000 HP the threshold latches at 2: the third action glows, and healing him back never returns it to 5', () => {
    const { ctx } = fresh();
    const omnis = at(ctx, OMNIS);
    omnis.hp = 19_900;
    act(ctx, 'tidus', tap, [OMNIS]);
    expect(ctx.state.flags[OMNIS_LOW]).toBe(true);
    expect(hits(ctx)).toBe(1);
    act(ctx, 'tidus', tap, [OMNIS]);
    expect(ctx.state.flags[OMNIS_STATE]).toBe('normal');
    act(ctx, 'tidus', tap, [OMNIS]);
    expect(ctx.state.flags[OMNIS_STATE]).toBe('red'); // the third, not the sixth
    // healed to full and the sequence run: still three
    omnis.hp = 80_000;
    ctx.state.flags[OMNIS_STATE] = 'normal';
    act(ctx, 'tidus', tap, [OMNIS]);
    act(ctx, 'tidus', tap, [OMNIS]);
    expect(ctx.state.flags[OMNIS_STATE]).toBe('normal');
    act(ctx, 'tidus', tap, [OMNIS]);
    expect(ctx.state.flags[OMNIS_STATE]).toBe('red');
  });

  it('exactly 20,000 is not under a quarter; 19,950 is', () => {
    const a = fresh().ctx;
    at(a, OMNIS).hp = 20_050;
    act(a, 'tidus', tap, [OMNIS]);
    expect(at(a, OMNIS).hp).toBe(20_000);
    expect(a.state.flags[OMNIS_LOW]).toBe(false);
    act(a, 'tidus', tap, [OMNIS]);
    expect(at(a, OMNIS).hp).toBe(19_950);
    expect(a.state.flags[OMNIS_LOW]).toBe(true);
  });

  it('hits during the glow, the Dispel, the Ultima and the reset turn are ignored; counting restarts from 0 after the reset turn', () => {
    const { ctx } = fresh();
    const omnis = at(ctx, OMNIS);
    for (let i = 0; i < 6; i++) act(ctx, 'tidus', tap, [OMNIS]);
    for (const step of ['red', 'dispelled', 'reset-due']) {
      expect(ctx.state.flags[OMNIS_STATE]).toBe(step);
      act(ctx, 'tidus', tap, [OMNIS]);
      act(ctx, 'tidus', tap, [OMNIS]);
      expect(hits(ctx), `during ${step}`).toBe(0);
      chooseAiCommand(ctx, omnis);
    }
    expect(ctx.state.flags[OMNIS_STATE]).toBe('normal');
    expect(hits(ctx)).toBe(0);
    for (let i = 1; i <= 5; i++) act(ctx, 'tidus', tap, [OMNIS]);
    expect(ctx.state.flags[OMNIS_STATE]).toBe('normal');
    act(ctx, 'tidus', tap, [OMNIS]);
    expect(ctx.state.flags[OMNIS_STATE]).toBe('red');
  });
});
