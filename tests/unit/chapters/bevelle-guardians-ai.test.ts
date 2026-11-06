/**
 * The three Bevelle guardians (Georapella and the Precepts Guard on floor 3, the first Baralai on floor 7; the hidden chapter): the three scripts, poll by poll, on a stub context with exact draws.
 * **FFX-2 only** [AGENTS.md rule 14].
 *
 * `src/battle/ffx2/ai/bevelle-guardians.ts` is the game's own order (`m262`, `m263`, `m175`; `research/re-ffx2-bevelle-underground.md` §6.2 to §6.4). What this file pins, each fact tagged `[RE]`:
 *
 * 1. **Georapella** [RE §6.2]: one start draw `mod 4` stores the counter; every poll after it is the next spell of the ring Thundaga, Waterga, Firaga, Blizzaga on the whole party, with no further draw; the Osmose line is a dead
 *    branch (MP below 25).
 * 2. **The Precepts Guard** [RE §6.3]: `mod 3` = 0 is Demi (a third of the polls); else `mod 5`: 0 Bio (when some girl lacks Poison) then Drain, 1 Slow, 2 Death, 3 Osmose, 4 Drain; the Reflect gates; every poll's EXACT draw
 *    count, discarded searches included (the chapter lane's reading of the source, which the note's prose does not state); the second command of a two-command poll comes at the next poll.
 * 3. **Baralai** [RE §6.4]: the seven-poll cycle, the Chain Attack's fixed girls and fall-backs, Looming Glacier's target, the low-HP Absorb at one roll in four, the hit count and the Drill Shot at TEN (the shade's is 8), its
 *    target (the latest attacker if alive), the count's reset, and the one callout at nine.
 * 4. **The draws**: `random() mod n` is stream 2 (0 to 0xFFFF), a target search is stream 4 (0 to 0x7FFFFFFF) and draws only with two or more candidates. **`[inferred]`**: the Precepts Guard's near-weighted picks use Georapella's
 *    scene and Baralai's the Bahamut scene (`PRECEPTS_GUARD_SCENE`, `BARALAI_SCENE`), because those rooms ship no start positions.
 */
import { describe, expect, it } from 'vitest';

import { aiScriptFor } from '../../../src/battle/ffx2/ai/index.ts';
import { SCENES, pickIndexByWeights, sceneWeights, type Scene } from '../../../src/battle/ffx2/ai/script-rolls.ts';
import {
  ABSORB_MODULUS,
  BARALAI_COUNT_NINE,
  BARALAI_HITS,
  BARALAI_SCENE,
  BARALAI_SCRIPT,
  BARALAI_TURN,
  DRILL_SHOT_AT,
  GEORAPELLA_COUNTER,
  GEORAPELLA_RING,
  GEORAPELLA_SCENE,
  GEORAPELLA_SCRIPT,
  GUARDIAN_ABILITY as A,
  PRECEPTS_GUARD_SCENE,
  PRECEPTS_GUARD_SCRIPT,
  chainAttackTargets,
} from '../../../src/battle/ffx2/ai/bevelle-guardians.ts';
import { mem, type Ffx2Unit } from '../../../src/battle/ffx2/internal.ts';
import * as ids from '../../../src/data/bevelle-guardians-ids.ts';
import { x2BevelleGuardiansAbilities } from '../../../src/data/ffx2/enemies/bevelle-guardians-abilities.ts';
import { bevelleGuardiansGroups } from '../../../src/data/ffx2/enemies/bevelle-guardians.ts';
import { bench, enemy, type Bench } from '../helpers/ffx2ScriptRig.ts';

/** The chapter's own ability rows (the unit-test bench has no catalog). */
const ability = (id: string) => x2BevelleGuardiansAbilities.find((a) => a.id === id);

const ROLL: [number, number] = [0, 0xffff];
const SEARCH: [number, number] = [0, 0x7fffffff];

/** A girl's status, the way the engine lays one (a bare instance). */
function give(girl: Ffx2Unit, status: string): void {
  girl.statuses[status as 'poison'] = { id: status, turnsRemaining: null, ticksRemaining: null, charges: null, stacks: 0, permanent: false } as never;
}

const georapella = (): Bench => bench(enemy('x2-georapella', 4_420, { mp: 9_999 }), GEORAPELLA_SCRIPT);
const preceptsGuard = (opts: { mp?: number } = {}): Bench => bench(enemy('x2-precepts-guard', 3_680, { mp: opts.mp ?? 9_999 }), PRECEPTS_GUARD_SCRIPT);
const baralai = (opts: { hp?: number; mp?: number } = {}): Bench => bench(enemy('x2-baralai', 3_380, { mp: opts.mp ?? 540, ...(opts.hp !== undefined ? { hp: opts.hp } : {}) }), BARALAI_SCRIPT);

/** The girl a near-weighted search picks for a raw value, from a scene (all three standing). */
const nearPick = (scene: Scene, raw: number): string => ['yuna', 'rikku', 'paine'][pickIndexByWeights(raw, sceneWeights(scene, [0, 1, 2]))]!;

describe('the ids the scripts name are the data files\'', () => {
  it('every ability and script id of the scripts is a registered ability and the enemy data names the same scripts; the ids file and the AI agree on the callout\'s name', () => {
    expect([ids.GEORAPELLA_SCRIPT_ID, ids.PRECEPTS_GUARD_SCRIPT_ID, ids.BARALAI_SCRIPT_ID]).toEqual([GEORAPELLA_SCRIPT, PRECEPTS_GUARD_SCRIPT, BARALAI_SCRIPT]);
    expect(bevelleGuardiansGroups.map((g) => g.enemies[0]!.aiScriptId)).toEqual([GEORAPELLA_SCRIPT, PRECEPTS_GUARD_SCRIPT, BARALAI_SCRIPT]);
    for (const id of Object.values(A)) expect(ability(id), id).toBeDefined();
    for (const script of [GEORAPELLA_SCRIPT, PRECEPTS_GUARD_SCRIPT, BARALAI_SCRIPT]) expect(aiScriptFor(script).id, script).toBe(script);
    expect(ids.BARALAI_COUNT_NINE_TRIGGER).toBe(BARALAI_COUNT_NINE);
  });

  it('every ability each guardian\'s data lists is one its script can queue, and the scripts queue nothing the data does not list', () => {
    const listed = (i: number): string[] => [...bevelleGuardiansGroups[i]!.enemies[0]!.abilityIds].sort();
    expect(listed(0)).toEqual([A.thundaga, A.waterga, A.firaga, A.blizzaga, A.georapellaOsmose].sort());
    expect(listed(1)).toEqual([A.demi, A.slow, A.death, A.preceptsOsmose, A.drain, A.bio].sort());
    expect(listed(2)).toEqual([A.attack, A.glint, A.chainAttack, 'x2-baralai-chain-attack-2', 'x2-baralai-chain-attack-3', A.loomingGlacier, A.baralaiDemi, A.drillShot, A.absorb].sort());
  });
});

describe('Georapella [RE §6.2]', () => {
  it('the start draw (random() mod 4) picks the point of the ring it begins at: 0 Thundaga, 1 Waterga, 2 Firaga, 3 Blizzaga, each a quarter of the 16-bit values', () => {
    const firsts: string[] = [];
    for (let v = 0; v < 8; v++) {
      const b = georapella();
      firsts.push(b.id(b.poll(v)!)!);
    }
    expect(firsts).toEqual([...GEORAPELLA_RING, ...GEORAPELLA_RING]);
    expect(GEORAPELLA_RING).toEqual([A.thundaga, A.waterga, A.firaga, A.blizzaga]);
  });

  it('from there the ring goes round: Thundaga, Waterga, Firaga, Blizzaga, repeating; every spell on the whole party; one draw at the first poll and none after', () => {
    for (let start = 0; start < 4; start++) {
      const b = georapella();
      const seen: string[] = [];
      for (let poll = 0; poll < 12; poll++) {
        const before = b.rng.calls.length;
        const c = b.poll(...(poll === 0 ? [start] : []));
        seen.push(b.id(c)!);
        expect(b.targets(c), `start ${start} poll ${poll + 1}`).toEqual([]);
        expect(b.rng.calls.length - before, `start ${start} poll ${poll + 1}`).toBe(poll === 0 ? 1 : 0);
      }
      expect(seen, `start ${start}`).toEqual(Array.from({ length: 12 }, (_, k) => GEORAPELLA_RING[(start + k) % 4]));
    }
    const b = georapella();
    b.poll(0);
    expect(b.rng.calls).toEqual([ROLL]);
  });

  it('the counter is the script\'s: 1 to 3 are stored, the fourth poll of the ring resets it to 0', () => {
    const b = georapella();
    b.poll(0);
    expect(mem(b.self, GEORAPELLA_COUNTER)).toBe(1);
    b.poll();
    b.poll();
    expect(mem(b.self, GEORAPELLA_COUNTER)).toBe(3);
    expect(b.id(b.poll())).toBe(A.blizzaga);
    expect(mem(b.self, GEORAPELLA_COUNTER)).toBe(0);
  });

  it('below 25 MP (never in play: it has 9,999) it Osmoses the girl with the most MP: m262.src holds the single `max` search, with NO discarded first search (the research note\'s section 12 correction 6), so one unique top draws nothing', () => {
    const b = georapella();
    b.self.mp = 24;
    b.girls[0].mp = 10;
    b.girls[1].mp = 80;
    b.girls[2].mp = 50;
    const c = b.poll(0);
    expect(b.id(c)).toBe(A.georapellaOsmose);
    expect(b.targets(c)).toEqual(['rikku']);
    expect(b.rng.calls).toEqual([ROLL]); // the start draw only: one unique top is a search with one candidate, and that draws nothing
    b.self.mp = 25;
    expect(b.id(b.poll())).toBe(A.thundaga); // 25 is not below 25; the ring was not advanced by the Osmose
  });

  it('a tie for the most MP draws ONE search (not two, unlike the Precepts Guard and Baralai), and the pick is the near-weighted one of the stand-in scene (Georapella\'s own positions)', () => {
    for (const raw of [0, 3, 900, 40_000]) {
      const b = georapella();
      b.self.mp = 0;
      b.girls[0].mp = 90;
      b.girls[1].mp = 90;
      b.girls[2].mp = 10;
      const c = b.poll(0, raw);
      const weights = sceneWeights(GEORAPELLA_SCENE, [0, 1]);
      expect(b.targets(c), `raw ${raw}`).toEqual([['yuna', 'rikku'][pickIndexByWeights(raw, weights)]!]);
      expect(b.rng.calls, `raw ${raw}`).toEqual([ROLL, SEARCH]);
    }
  });

  it('with no girl standing it has no move and spends nothing', () => {
    const b = georapella();
    for (const g of b.girls) g.alive = false;
    expect(b.poll()).toBeNull();
    expect(b.rng.calls).toHaveLength(0);
  });

  it('Georapella\'s room is the game\'s own: boss (4.4, -3.2), the girls (-43, 29), (-50, 10), (-27, 43) [RE §5.2]', () => {
    expect(GEORAPELLA_SCENE).toEqual({ boss: { x: 4.4, z: -3.2 }, girls: [{ x: -43, z: 29 }, { x: -50, z: 10 }, { x: -27, z: 43 }] });
    expect(PRECEPTS_GUARD_SCENE, '[inferred] the neighbour room stands in').toBe(GEORAPELLA_SCENE);
    expect(BARALAI_SCENE, '[inferred] the Bahamut scene stands in').toBe(SCENES.bahamut);
  });
});

describe('the Precepts Guard [RE §6.3]', () => {
  /** One poll with the two rolls given and enough search values for whatever the poll draws; returns the first command and the draw ranges made. */
  function pollWith(b: Bench, roll3: number, r: number, search = 1): { first: string | null; command: ReturnType<Bench['poll']>; calls: Array<[number, number]> } {
    const before = b.rng.calls.length;
    b.rng.drain();
    const command = b.poll(roll3, r, search, search, search, search, search);
    b.rng.drain();
    return { first: b.id(command), command, calls: b.rng.calls.slice(before) };
  }

  it('Demi on the whole party when the first draw (mod 3) is 0, and the poll ends: one draw, no targets', () => {
    const b = preceptsGuard();
    const { first, command, calls } = pollWith(b, 3, 4); // 3 mod 3 = 0
    expect(first).toBe(A.demi);
    expect(b.targets(command)).toEqual([]);
    expect(calls).toEqual([ROLL]);
  });

  it('r = 1 (mod 5) is Slow on the whole party: two draws and nothing else', () => {
    const b = preceptsGuard();
    const { first, command, calls } = pollWith(b, 1, 1);
    expect(first).toBe(A.slow);
    expect(b.targets(command)).toEqual([]);
    expect(calls).toEqual([ROLL, ROLL]);
  });

  it('r = 2, 3 and 4 are Death, Osmose and Drain on a living girl picked uniformly (the draw mod the number of girls, in slot order); the "does some girl lack Reflect" search draws and is thrown away', () => {
    for (const [r, id] of [[2, A.death], [3, A.preceptsOsmose], [4, A.drain]] as const) {
      for (const raw of [0, 1, 2, 3, 4, 5]) {
        const b = preceptsGuard();
        const { first, command, calls } = pollWith(b, 1, r, raw);
        expect(first, `r ${r}`).toBe(id);
        expect(b.targets(command), `r ${r} raw ${raw}`).toEqual([['yuna', 'rikku', 'paine'][raw % 3]!]);
        expect(calls, `r ${r}`).toEqual([ROLL, ROLL, SEARCH, SEARCH]); // the discarded search, then the uniform pick
      }
    }
  });

  it('r = 0 does BOTH: Bio on a living girl without Reflect (a near-weighted pick) now, and the Drain on a uniform girl at the NEXT poll with no draw; five search draws in all', () => {
    for (const raw of [0, 7, 400, 20_000]) {
      const b = preceptsGuard();
      b.rng.drain();
      const first = b.poll(1, 0, raw, raw, raw, raw, raw);
      expect(b.id(first), `raw ${raw}`).toBe(A.bio);
      expect(b.targets(first), `raw ${raw}`).toEqual([nearPick(PRECEPTS_GUARD_SCENE, raw)]);
      expect(b.rng.calls, `raw ${raw}`).toEqual([ROLL, ROLL, SEARCH, SEARCH, SEARCH, SEARCH, SEARCH]); // unpoisoned, alive, the Bio pick, unreflected, the Drain pick
      const before = b.rng.calls.length;
      const second = b.poll();
      expect(b.id(second), `raw ${raw}`).toBe(A.drain);
      expect(b.targets(second), `raw ${raw}`).toEqual([['yuna', 'rikku', 'paine'][raw % 3]!]);
      expect(b.rng.calls.length - before, 'the queued command costs no draw').toBe(0);
    }
  });

  it('Bio is for the source\'s reading: ANY living girl without Reflect, so a girl who is already poisoned can take it, as long as some girl lacks Poison (the note\'s prose says "also lacks Poison"; the source does not)', () => {
    const b = preceptsGuard();
    give(b.girls[0], 'poison');
    give(b.girls[1], 'poison'); // only Paine lacks Poison; the pick is among the girls without REFLECT, all three
    b.rng.drain();
    const first = b.poll(1, 0, 0, 0, 0, 0, 0);
    expect(b.id(first)).toBe(A.bio);
    expect(b.targets(first)).toEqual([nearPick(PRECEPTS_GUARD_SCENE, 0)]);
  });

  it('with every girl poisoned there is no Bio (r = 0 is then only a Drain); with every girl wearing Reflect there is no Bio, Death, Osmose or Drain at all', () => {
    const poisoned = preceptsGuard();
    for (const g of poisoned.girls) give(g, 'poison');
    poisoned.rng.drain();
    const only = poisoned.poll(1, 0, 3, 3, 3);
    expect(poisoned.id(only)).toBe(A.drain);
    expect(poisoned.rng.calls).toEqual([ROLL, ROLL, SEARCH, SEARCH]); // no Bio searches: the discarded unreflected search and the uniform pick
    const reflected = preceptsGuard();
    for (const g of reflected.girls) give(g, 'reflect');
    for (const r of [0, 2, 3, 4]) {
      reflected.rng.drain();
      expect(reflected.poll(1, r, 1, 1, 1, 1, 1), `r ${r}`).toBeNull();
    }
    reflected.rng.drain();
    expect(reflected.id(reflected.poll(1, 1))).toBe(A.slow); // Slow ignores Reflect (the script does not test it)
  });

  it('the weights of one poll (3 x 5 draws): Demi 5/15, Slow 2/15, Death 2/15, Osmose 2/15, Drain 4/15 (a third, 13.3 percent three times, and 26.7); the Bio that comes before a Drain is not a move of its own', () => {
    const tally: Record<string, number> = {};
    for (let roll3 = 0; roll3 < 3; roll3++) {
      for (let r = 0; r < 5; r++) {
        const b = preceptsGuard();
        b.rng.drain();
        let id = b.id(b.poll(roll3, r, 1, 1, 1, 1, 1))!;
        if (id === A.bio) id = b.id(b.poll())!; // r = 0 queues the Bio first and the Drain after it
        tally[id] = (tally[id] ?? 0) + 1;
      }
    }
    expect(tally).toEqual({ [A.demi]: 5, [A.slow]: 2, [A.death]: 2, [A.preceptsOsmose]: 2, [A.drain]: 4 });
  });

  it('below 35 MP (never in play) it Osmoses the girl with the most MP before it rolls anything; 35 is not below', () => {
    const b = preceptsGuard({ mp: 34 });
    b.girls[0].mp = 5;
    b.girls[1].mp = 5;
    b.girls[2].mp = 70;
    b.rng.drain();
    const c = b.poll(0);
    expect(b.id(c)).toBe(A.preceptsOsmose);
    expect(b.targets(c)).toEqual(['paine']);
    expect(b.rng.calls).toEqual([SEARCH]); // a draw for the thrown-away search; the unique top draws nothing; no roll
    const full = preceptsGuard({ mp: 35 });
    full.rng.drain();
    expect(full.id(full.poll(0))).toBe(A.demi);
  });

  it('with no girl standing it has no move and spends nothing', () => {
    const b = preceptsGuard();
    for (const g of b.girls) g.alive = false;
    expect(b.poll()).toBeNull();
    expect(b.rng.calls).toHaveLength(0);
  });
});

describe('Baralai, the first one [RE §6.4]', () => {
  const ORDER = [A.attack, A.attack, A.glint, A.chainAttack, A.attack, A.loomingGlacier, A.baralaiDemi] as const;

  it('the cycle is seven polls: Attack, Attack, Glint, Chain Attack, Attack, Looming Glacier, Demi, and again', () => {
    const b = baralai();
    const seen: string[] = [];
    for (let poll = 0; poll < 21; poll++) {
      b.rng.drain();
      seen.push(b.id(b.poll(1, 1, 1, 1, 1))!);
    }
    expect(seen).toEqual(Array.from({ length: 21 }, (_, k) => ORDER[k % 7]));
    expect(mem(b.self, BARALAI_TURN)).toBe(0);
  });

  it('what each poll draws: an Attack one near-weighted search, Glint and Chain Attack and Demi none, Looming Glacier one (the discarded search; the unique top draws nothing)', () => {
    const b = baralai();
    b.girls[0].mp = 10;
    b.girls[1].mp = 30;
    b.girls[2].mp = 50;
    const draws: number[] = [];
    for (let poll = 0; poll < 7; poll++) {
      b.rng.drain();
      const before = b.rng.calls.length;
      b.poll(1, 1, 1, 1);
      draws.push(b.rng.calls.length - before);
    }
    expect(draws).toEqual([1, 1, 0, 0, 1, 1, 0]);
  });

  it('an Attack goes to the near-weighted pick of the stand-in scene (the Bahamut scene), and one girl left means no search draw', () => {
    for (const raw of [0, 1, 400, 900, 5_000, 123_456]) {
      const b = baralai();
      expect(b.targets(b.poll(raw)), `raw ${raw}`).toEqual([nearPick(BARALAI_SCENE, raw)]);
    }
    const lone = baralai();
    lone.girls[0].alive = false;
    lone.girls[1].alive = false;
    expect(lone.targets(lone.poll())).toEqual(['paine']);
    expect(lone.rng.calls).toHaveLength(0);
  });

  it('the Chain Attack is three strikes at fixed girls, Yuna, Rikku, Paine, each falling back to the next living girl; one girl left means a plain Attack instead', () => {
    expect(chainAttackTargets(baralai().girls)).toEqual(['yuna', 'rikku', 'paine']);
    const noYuna = baralai();
    noYuna.girls[0].alive = false;
    expect(chainAttackTargets(noYuna.girls.filter((g) => g.alive))).toEqual(['paine', 'rikku', 'paine']);
    const noRikku = baralai();
    noRikku.girls[1].alive = false;
    expect(chainAttackTargets(noRikku.girls.filter((g) => g.alive))).toEqual(['yuna', 'paine', 'paine']);
    const noPaine = baralai();
    noPaine.girls[2].alive = false;
    expect(chainAttackTargets(noPaine.girls.filter((g) => g.alive))).toEqual(['yuna', 'rikku', 'yuna']);
    // In the cycle: poll 4 with three girls is the Chain Attack on the three fixed girls; with one girl standing it is an Attack on her.
    const cycle = baralai();
    for (let i = 0; i < 3; i++) {
      cycle.rng.drain();
      cycle.poll(1, 1, 1);
    }
    const chain = cycle.poll();
    expect(cycle.id(chain)).toBe(A.chainAttack);
    expect(cycle.targets(chain)).toEqual(['yuna', 'rikku', 'paine']);
    const one = baralai();
    one.girls[0].alive = false;
    one.girls[1].alive = false;
    for (let i = 0; i < 3; i++) {
      one.rng.drain();
      one.poll();
    }
    const lone = one.poll();
    expect(one.id(lone)).toBe(A.attack);
    expect(one.targets(lone)).toEqual(['paine']);
  });

  it('Looming Glacier goes to the girl with the most MP among those not already Stopped (a discarded search first), and to nobody when all three are Stopped', () => {
    const toPoll6 = (b: Bench): void => {
      for (let i = 0; i < 5; i++) {
        b.rng.drain();
        b.poll(1, 1, 1);
      }
      b.rng.drain();
    };
    const b = baralai();
    b.girls[0].mp = 130;
    b.girls[1].mp = 60;
    b.girls[2].mp = 40;
    toPoll6(b);
    const top = b.poll(1, 1);
    expect(b.id(top)).toBe(A.loomingGlacier);
    expect(b.targets(top)).toEqual(['yuna']);
    const stopped = baralai();
    stopped.girls[0].mp = 130;
    stopped.girls[1].mp = 60;
    stopped.girls[2].mp = 40;
    give(stopped.girls[0], 'stop');
    toPoll6(stopped);
    expect(stopped.targets(stopped.poll(1, 1))).toEqual(['rikku']);
    const allStopped = baralai();
    for (const g of allStopped.girls) give(g, 'stop');
    toPoll6(allStopped);
    expect(allStopped.poll(1, 1)).toBeNull();
  });

  it('the seventh poll is Demi on the party, and an Attack instead below 40 MP (40 is not below)', () => {
    const toPoll7 = (b: Bench): void => {
      for (let i = 0; i < 6; i++) {
        b.rng.drain();
        b.poll(1, 1, 1);
      }
      b.rng.drain();
    };
    const poor = baralai({ mp: 39 });
    toPoll7(poor);
    expect(poor.id(poor.poll(1))).toBe(A.attack);
    const ok = baralai({ mp: 40 });
    toPoll7(ok);
    const demi = ok.poll(1);
    expect(ok.id(demi)).toBe(A.baralaiDemi);
    expect(ok.targets(demi)).toEqual([]);
  });

  describe('below a quarter of his HP (HP < max / 4: 844 or less of 3,380) [RE §6.4]', () => {
    it('845 is not below: no roll is drawn; 844 draws random() mod 4', () => {
      const at845 = baralai({ hp: 845 });
      at845.poll(1);
      expect(at845.rng.calls).toEqual([SEARCH]); // the Attack's search only
      const at844 = baralai({ hp: 844 });
      at844.poll(1, 1);
      expect(at844.rng.calls).toEqual([ROLL, SEARCH]);
      expect(ABSORB_MODULUS).toBe(4);
    });

    it('a roll of 0 queues an Absorb on a near-weighted living girl AND the poll goes on: the Absorb now, the cycle\'s command at the next poll with no draw; 1 to 3 queue nothing', () => {
      for (const raw of [0, 5, 300]) {
        const b = baralai({ hp: 800 });
        b.rng.drain();
        const first = b.poll(0, raw, raw);
        expect(b.id(first), `raw ${raw}`).toBe(A.absorb);
        expect(b.targets(first), `raw ${raw}`).toEqual([nearPick(BARALAI_SCENE, raw)]);
        const before = b.rng.calls.length;
        const second = b.poll();
        expect(b.id(second), `raw ${raw}: the cycle's first step`).toBe(A.attack);
        expect(b.rng.calls.length - before, 'the queued command costs no draw').toBe(0);
        expect(mem(b.self, BARALAI_TURN), 'the cycle advanced once, at the poll that queued it').toBe(1);
      }
      for (const roll of [1, 2, 3]) {
        const b = baralai({ hp: 800 });
        expect(b.id(b.poll(roll, 1)), `roll ${roll}`).toBe(A.attack);
        expect(b.id(b.poll(roll, 1)), `roll ${roll}`).toBe(A.attack); // no queued Absorb: the second poll is the cycle's second step
      }
    });
  });

  describe('the hit count and the Drill Shot at ten [RE §6.4]', () => {
    const report = (b: Bench, count: number, lastAttackerId?: string): void => {
      const script = aiScriptFor(BARALAI_SCRIPT);
      script.onResults!(b.ctx, { count, lastAttackerId });
    };

    it('the threshold is ten (the shade\'s is eight): nine results are still the cycle, ten call the Drill Shot', () => {
      expect(DRILL_SHOT_AT).toBe(10);
      const nine = baralai();
      report(nine, 9, 'paine');
      expect(nine.id(nine.poll(1))).toBe(A.attack);
      const ten = baralai();
      report(ten, 10, 'paine');
      expect(ten.id(ten.poll(1))).toBe(A.drillShot);
    });

    it('the results add up across reports, a report of several counts several, and the Drill Shot goes to the attacker of the LATEST result when she lives', () => {
      const b = baralai();
      report(b, 3, 'yuna');
      report(b, 4, 'rikku');
      report(b, 3, 'paine');
      expect(mem(b.self, BARALAI_HITS)).toBe(10);
      const shot = b.poll(1);
      expect(b.id(shot)).toBe(A.drillShot);
      expect(b.targets(shot)).toEqual(['paine']);
      expect(b.rng.calls, 'a living latest attacker needs no search').toHaveLength(0);
    });

    it('the count goes back to 0, and the poll takes no cycle step: the cycle carries on where it was', () => {
      const b = baralai();
      b.poll(1); // step 1
      b.poll(1); // step 2
      report(b, 10, 'rikku');
      expect(b.id(b.poll())).toBe(A.drillShot);
      expect(mem(b.self, BARALAI_HITS)).toBe(0);
      expect(mem(b.self, BARALAI_TURN)).toBe(2);
      expect(b.id(b.poll())).toBe(A.glint); // step 3
    });

    it('when the latest attacker is down it goes to a near-weighted living girl (a search draw); a latest attacker of nobody the same', () => {
      for (const raw of [0, 900, 50_000]) {
        const b = baralai();
        report(b, 10, 'yuna');
        b.girls[0].alive = false;
        const shot = b.poll(raw);
        expect(b.id(shot), `raw ${raw}`).toBe(A.drillShot);
        const alive = b.girls.filter((g) => g.alive);
        const weights = sceneWeights(BARALAI_SCENE, alive.map((g) => g.slot));
        expect(b.targets(shot), `raw ${raw}`).toEqual([alive[pickIndexByWeights(raw, weights)]!.id]);
        expect(b.rng.calls, `raw ${raw}`).toEqual([SEARCH]);
      }
    });

    it('the one callout: the ninth result emits it, once, and never again however many more results come', () => {
      const b = baralai();
      report(b, 8, 'paine');
      expect(b.events.filter((e) => e.type === 'script-trigger')).toHaveLength(0);
      report(b, 1, 'paine');
      expect(b.events.filter((e) => e.type === 'script-trigger')).toEqual([{ type: 'script-trigger', name: BARALAI_COUNT_NINE, payload: { who: 'x2-baralai' } }]);
      report(b, 1, 'paine');
      report(b, 5, 'paine');
      expect(b.events.filter((e) => e.type === 'script-trigger')).toHaveLength(1);
    });

    it('a low-HP poll with ten results queues the Absorb AND the Drill Shot: the Absorb now, the Drill Shot at the next poll (the count is spent at the first)', () => {
      const b = baralai({ hp: 500 });
      report(b, 10, 'paine');
      b.rng.drain();
      const first = b.poll(0, 7, 7);
      expect(b.id(first)).toBe(A.absorb);
      expect(mem(b.self, BARALAI_HITS), 'the count was spent at the poll that queued the shot').toBe(0);
      const second = b.poll();
      expect(b.id(second)).toBe(A.drillShot);
      expect(b.targets(second)).toEqual(['paine']);
    });
  });

  it('with no girl standing it has no move and spends nothing', () => {
    const b = baralai();
    for (const g of b.girls) g.alive = false;
    expect(b.poll()).toBeNull();
    expect(b.rng.calls).toHaveLength(0);
  });
});
