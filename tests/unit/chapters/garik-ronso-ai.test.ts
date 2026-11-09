/**
 * Garik Ronso and the Ronso Youths (the hidden chapter): the four scripts, poll by poll, on a stub context with exact draws. **FFX-2 only** [AGENTS.md rule 14].
 *
 * `src/battle/ffx2/ai/garik-ronso.ts` is the game's own order (`m182` for Garik, `m181` for the Youth, each in its two scenes; `research/re-ffx2-garik-ronso.md` §2). What this file pins, each fact tagged `[RE]`:
 *
 * 1. **Garik, hostile** [RE §2.1]: the counter starts at 0 and rises each poll; Bane Lance on the first of Yuna, Rikku and Paine (in that order) who wears Black Mage and carries no Curse; else, at 7 or more, Mighty Guard and the
 *    counter back to 0; else `random() % 4`: 0 is Blind on a girl without Darkness (an Attack when all are dark), 1 to 3 an Attack on a living girl.
 * 2. **Garik, friendly** [RE §2.2]: the counter starts at 3; Protect, Attack x3, Shell, Attack x3, on himself; no roll at all.
 * 3. **The Youth** [RE §2.3]: hostile, `random() % 8`: 0 is MP Blowout on the girl with the most MP, else an Attack; friendly: an Attack.
 * 4. **The "battle too long" block** [RE §2.4]: **inert** (its guard is true only when no girl can act, and the ATB clock does not step then: `research/re-ffx2-ai-bahamut-vegnagun.md` 1.6, run on the live exe). The scripts never
 *    queue it; the ported thresholds (180 / 190 / 195 / 200 polls of Garik, 140 / 150 / 155 / 160 of a Youth, then Time Up Meteor every poll) are pinned through `tooLong`'s `enabled` argument.
 * 5. **The draws**: `random() % n` is stream 2 (0 to 0xFFFF), a target search is stream 4 and draws only with two or more candidates.
 */
import { describe, expect, it } from 'vitest';

import { aiScriptFor } from '../../../src/battle/ffx2/ai/index.ts';
import {
  BANE_LANCE_DRESSPHERE,
  GARIK_BOUT_PROTECT_AT,
  GARIK_BOUT_SHELL_AT,
  GARIK_BOUT_START,
  GARIK_DRAW_MODULUS,
  GARIK_GUARD_AT,
  GARIK_TOO_LONG_POLLS,
  RONSO_POLLS,
  RONSO_STAGE,
  RONSO_TOO_LONG_BLOCK_ON,
  RONSO_TURN,
  YOUTH_DRAW_MODULUS,
  YOUTH_TOO_LONG_POLLS,
  garikRonsoScripts,
  tooLong,
} from '../../../src/battle/ffx2/ai/garik-ronso.ts';
import { mem } from '../../../src/battle/ffx2/internal.ts';
import {
  GARIK_ATTACK_ID as ATTACK,
  GARIK_BANE_LANCE_ID as LANCE,
  GARIK_BLIND_ID as BLIND,
  GARIK_MIGHTY_GUARD_ID as GUARD,
  GARIK_PROTECT_ID as PROTECT,
  GARIK_SHELL_ID as SHELL,
  RONSO_ANNOUNCEMENT_IDS,
  RONSO_TIME_UP_METEOR_ID as METEOR,
  YOUTH_ATTACK_ID as YOUTH_ATTACK,
  YOUTH_MP_BLOWOUT_ID as BLOWOUT,
} from '../../../src/data/ffx2/enemies/garik-ronso-abilities.ts';
import { x2GarikRonso, x2GarikRonsoBout, x2RonsoYouthA, x2RonsoYouthBout } from '../../../src/data/ffx2/enemies/garik-ronso.ts';
import { GARIK_FRIENDLY_SCRIPT_ID, GARIK_HOSTILE_SCRIPT_ID, YOUTH_FRIENDLY_SCRIPT_ID, YOUTH_HOSTILE_SCRIPT_ID } from '../../../src/data/garik-ronso-ids.ts';
import { bench, enemy, type Bench } from '../helpers/ffx2ScriptRig.ts';

const garikHostile = (): Bench => bench(enemy('x2-garik-ronso', 6_880, { mp: 444 }), GARIK_HOSTILE_SCRIPT_ID);
const garikBout = (): Bench => bench(enemy('x2-garik-ronso-bout', 6_880, { mp: 444 }), GARIK_FRIENDLY_SCRIPT_ID);
const youthHostile = (): Bench => bench(enemy('x2-ronso-youth-a', 4_060, { mp: 170 }), YOUTH_HOSTILE_SCRIPT_ID);
const youthBout = (): Bench => bench(enemy('x2-ronso-youth-bout', 4_060, { mp: 170 }), YOUTH_FRIENDLY_SCRIPT_ID);

/** Put a girl in a dressphere (the script reads `dresspheres.current`). */
function wear(b: Bench, who: 0 | 1 | 2, dressphere: string): void {
  b.girls[who].dresspheres = { current: dressphere, owned: [dressphere], abilitiesLearned: {} } as never;
}
/** Lay a status on a girl the way the script reads it (present or not). */
function afflict(b: Bench, who: 0 | 1 | 2, status: string): void {
  b.girls[who].statuses[status as never] = { id: status } as never;
}
/** The nth girl alone: the other two are not in the fight (no search draws). */
function alone(b: Bench, who: 0 | 1 | 2 = 0): Bench {
  b.girls.forEach((g, i) => {
    if (i !== who) g.alive = false;
  });
  return b;
}

describe('the ids the scripts name are the data files\'', () => {
  it('four scripts are registered under their ids, the enemy data names them, and every ability id is a registered ability', () => {
    expect(garikRonsoScripts.map((s) => s.id)).toEqual([GARIK_HOSTILE_SCRIPT_ID, GARIK_FRIENDLY_SCRIPT_ID, YOUTH_HOSTILE_SCRIPT_ID, YOUTH_FRIENDLY_SCRIPT_ID]);
    for (const script of garikRonsoScripts) expect(aiScriptFor(script.id), script.id).toBe(script);
    expect([x2GarikRonso.aiScriptId, x2GarikRonsoBout.aiScriptId, x2RonsoYouthA.aiScriptId, x2RonsoYouthBout.aiScriptId]).toEqual([GARIK_HOSTILE_SCRIPT_ID, GARIK_FRIENDLY_SCRIPT_ID, YOUTH_HOSTILE_SCRIPT_ID, YOUTH_FRIENDLY_SCRIPT_ID]);
  });

  it('the constants are the workers\': moduli 4 and 8, the guard at 7, the bout\'s start 3 with Protect at 4 and Shell at 8, the polls 180 / 190 / 195 / 200 and 140 / 150 / 155 / 160, Black Mage', () => {
    expect([GARIK_DRAW_MODULUS, YOUTH_DRAW_MODULUS, GARIK_GUARD_AT, GARIK_BOUT_START, GARIK_BOUT_PROTECT_AT, GARIK_BOUT_SHELL_AT]).toEqual([4, 8, 7, 3, 4, 8]);
    expect([...GARIK_TOO_LONG_POLLS]).toEqual([180, 190, 195, 200]);
    expect([...YOUTH_TOO_LONG_POLLS]).toEqual([140, 150, 155, 160]);
    expect(BANE_LANCE_DRESSPHERE).toBe('black-mage');
  });
});

describe('Garik, the hostile fight [RE §2.1]', () => {
  it('the counter starts at 0: six ordinary polls (an Attack on the picked girl for a roll of 1 to 3), then Mighty Guard on the 7th with NO draw, then six ordinary again, then the guard on the 14th', () => {
    const b = garikHostile();
    const ids: Array<string | null> = [];
    for (let poll = 1; poll <= 14; poll++) {
      const guard = poll % 7 === 0;
      const c = guard ? b.poll() : b.poll(1 + (poll % 3), poll % 3); // the roll, then the search over three girls
      ids.push(b.id(c));
      if (guard) expect(b.targets(c), `poll ${poll}`).toEqual([]);
      expect(b.rng.left(), `poll ${poll}`).toBe(0);
    }
    expect(ids).toEqual([ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, GUARD, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, GUARD]);
  });

  it('random() % 4: a roll of 0 is Blind on a girl without Darkness (the search is over the girls who lack it), 1 to 3 are the Attack; the roll is stream 2, the search stream 4', () => {
    const blind = garikHostile();
    const c = blind.poll(4, 1); // 4 % 4 = 0, then the second of the three
    expect(blind.id(c)).toBe(BLIND);
    expect(blind.targets(c)).toEqual(['rikku']);
    expect(blind.rng.calls).toEqual([[0, 0xffff], [0, 2]]);
    for (const roll of [1, 2, 3, 5, 6, 7]) {
      const b = garikHostile();
      const hit = b.poll(roll, 2);
      expect(b.id(hit), `roll ${roll}`).toBe(ATTACK);
      expect(b.targets(hit), `roll ${roll}`).toEqual(['paine']);
    }
  });

  it('Blind skips a girl who is already dark (the search is over the other two), and with all three dark a roll of 0 is an Attack on a living girl', () => {
    const one = garikHostile();
    afflict(one, 0, 'darkness');
    const c = one.poll(0, 0, 1 /* never used */);
    expect(one.id(c)).toBe(BLIND);
    expect(one.targets(c)).toEqual(['rikku']);
    expect(one.rng.calls[1]).toEqual([0, 1]);
    one.rng.drain();

    const all = garikHostile();
    for (const who of [0, 1, 2] as const) afflict(all, who, 'darkness');
    const a = all.poll(0, 2); // the roll, then the Attack's search over all three (the Blind search found nobody and drew nothing)
    expect(all.id(a)).toBe(ATTACK);
    expect(all.targets(a)).toEqual(['paine']);
    expect(all.rng.calls).toEqual([[0, 0xffff], [0, 2]]);
  });

  it('a roll over 1,000 consecutive values with one girl alive and not dark: 250 Blind, 750 Attack (no search draw below two candidates)', () => {
    const counts: Record<string, number> = {};
    for (let v = 0; v < 1000; v++) {
      const b = alone(garikHostile());
      const id = b.id(b.poll(v))!;
      counts[id] = (counts[id] ?? 0) + 1;
    }
    expect(counts).toEqual({ [BLIND]: 250, [ATTACK]: 750 });
  });

  it('Bane Lance goes first to the first of Yuna, Rikku and Paine, in that order, who wears Black Mage and carries no Curse: no roll, no search', () => {
    const order = garikHostile();
    wear(order, 1, 'black-mage');
    wear(order, 2, 'black-mage');
    let c = order.poll();
    expect([order.id(c), order.targets(c)]).toEqual([LANCE, ['rikku']]); // Rikku before Paine
    afflict(order, 1, 'curse');
    c = order.poll();
    expect([order.id(c), order.targets(c)]).toEqual([LANCE, ['paine']]); // a cursed Rikku is skipped
    afflict(order, 2, 'curse');
    c = order.poll(1, 0); // nobody left to curse: an ordinary poll
    expect(order.id(c)).toBe(ATTACK);

    const first = garikHostile();
    for (const who of [0, 1, 2] as const) wear(first, who, 'black-mage');
    c = first.poll();
    expect([first.id(c), first.targets(c)]).toEqual([LANCE, ['yuna']]);
    expect(first.rng.calls).toEqual([]);

    const other = garikHostile();
    wear(other, 0, 'warrior');
    wear(other, 1, 'dark-knight');
    expect(other.id(other.poll(1, 0))).toBe(ATTACK);
  });

  it('a fallen Black Mage is not cursed (the search keeps the living)', () => {
    const b = garikHostile();
    wear(b, 0, 'black-mage');
    b.girls[0].alive = false;
    expect(b.id(b.poll(1, 0))).toBe(ATTACK);
  });

  it('the Bane Lance polls count: the counter rises on them, does not reset, and the guard comes on the first poll after it reaches 7', () => {
    const b = garikHostile();
    wear(b, 0, 'black-mage');
    const ids: Array<string | null> = [];
    for (let poll = 1; poll <= 5; poll++) ids.push(b.id(b.poll()));
    afflict(b, 0, 'curse');
    for (let poll = 6; poll <= 8; poll++) {
      const c = poll === 7 ? b.poll() : b.poll(1, 0);
      ids.push(b.id(c));
    }
    expect(ids).toEqual([LANCE, LANCE, LANCE, LANCE, LANCE, ATTACK, GUARD, ATTACK]); // five lances (counter 5), an ordinary poll (6), the guard (7), an ordinary poll (counter 1 again)
    expect(mem(b.self, RONSO_TURN)).toBe(1);
  });

  it('the lance on the 7th poll takes the poll: the counter reaches 7 inside it, and the next poll without a Black Mage to curse is the guard', () => {
    const b = garikHostile();
    for (let poll = 1; poll <= 6; poll++) b.poll(1, 0);
    wear(b, 0, 'black-mage');
    const c7 = b.poll();
    expect(b.id(c7)).toBe(LANCE);
    afflict(b, 0, 'curse');
    expect(b.id(b.poll())).toBe(GUARD); // the counter is 8 now: 8 is "7 or more"
    expect(mem(b.self, RONSO_TURN)).toBe(0);
  });

  it('the one branch with no Curse test [m182.src:405-410]: Paine alone in Black Mage is lanced on every poll, cursed or not, and he never reaches the guard, the Blind or the Attack', () => {
    const b = garikHostile();
    wear(b, 2, 'black-mage');
    afflict(b, 2, 'curse');
    for (let poll = 1; poll <= 9; poll++) {
      const c = b.poll();
      expect([b.id(c), b.targets(c)], `poll ${poll}`).toEqual([LANCE, ['paine']]);
    }
    expect(mem(b.self, RONSO_TURN)).toBe(9); // the counter rose on every lance and was never reset (no Mighty Guard)
    expect(b.rng.calls).toEqual([]); // no roll, no search

    // Every other branch tests the Curse: Yuna or Rikku in Black Mage as well (even cursed, even fallen) puts Paine back behind the test.
    for (const other of [0, 1] as const) {
      const c = garikHostile();
      wear(c, other, 'black-mage');
      wear(c, 2, 'black-mage');
      afflict(c, other, 'curse');
      afflict(c, 2, 'curse');
      expect(c.id(c.poll(1, 0)), `girl ${other} in Black Mage, both cursed`).toBe(ATTACK);
    }
    const fallen = garikHostile();
    wear(fallen, 0, 'black-mage');
    wear(fallen, 2, 'black-mage');
    afflict(fallen, 2, 'curse');
    fallen.girls[0].alive = false; // Yuna still wears it, so the script's job test sends it down the Paine-tests-Curse branch
    expect(fallen.id(fallen.poll(1, 0)), 'fallen Yuna in Black Mage, Paine cursed').toBe(ATTACK);
  });

  it('with no girl alive he does nothing', () => {
    const b = garikHostile();
    b.girls.forEach((g) => (g.alive = false));
    expect(b.poll()).toBeNull();
  });
});

describe('Garik, the friendly bout [RE §2.2]', () => {
  it('the counter starts at 3, so the first poll is 4: Protect, Attack x3, Shell, Attack x3, Protect, from the first poll, on himself, and no roll is ever drawn', () => {
    const b = garikBout();
    const seen: Array<[string | null, string[]]> = [];
    for (let poll = 1; poll <= 17; poll++) {
      const phase = (poll - 1) % 8; // 0 Protect, 1..3 Attack, 4 Shell, 5..7 Attack
      const c = phase === 0 || phase === 4 ? b.poll() : b.poll(poll % 3); // an Attack's search over three girls
      seen.push([b.id(c), b.targets(c)]);
      for (const [min, max] of b.rng.calls) expect([min, max], `poll ${poll}`).not.toEqual([0, 0xffff]); // no random() % n in this scene
      b.rng.calls.length = 0;
    }
    const attack = (n: number): [string, string[]] => [ATTACK, [['yuna', 'rikku', 'paine'][n % 3]!]];
    expect(seen.slice(0, 8)).toEqual([[PROTECT, ['x2-garik-ronso-bout']], attack(2), attack(3), attack(4), [SHELL, ['x2-garik-ronso-bout']], attack(6), attack(7), attack(8)]);
    expect(seen[8]).toEqual([PROTECT, ['x2-garik-ronso-bout']]);
    expect(seen[12]).toEqual([SHELL, ['x2-garik-ronso-bout']]);
    expect(seen[16]).toEqual([PROTECT, ['x2-garik-ronso-bout']]);
  });

  it('no Bane Lance for a Black Mage, no Blind, no Mighty Guard: a cursable girl is attacked like any other', () => {
    const b = garikBout();
    wear(b, 0, 'black-mage');
    const used = new Set<string>();
    for (let poll = 1; poll <= 40; poll++) {
      const phase = ((poll - 1) % 8);
      const c = phase === 0 || phase === 4 ? b.poll() : b.poll(0);
      used.add(b.id(c)!);
    }
    expect([...used].sort()).toEqual([ATTACK, PROTECT, SHELL].sort());
  });
});

describe('the Ronso Youth [RE §2.3]', () => {
  it('hostile: random() % 8 is MP Blowout for 0 and an Attack for 1 to 7, the shares over 800 consecutive values are 100 and 700', () => {
    const counts: Record<string, number> = {};
    for (let v = 0; v < 800; v++) {
      const b = alone(youthHostile());
      const id = b.id(b.poll(v))!;
      counts[id] = (counts[id] ?? 0) + 1;
    }
    expect(counts).toEqual({ [BLOWOUT]: 100, [YOUTH_ATTACK]: 700 });
  });

  it('MP Blowout goes to the girl with the most MP (one candidate draws nothing); a tie is a search among the tied girls (stream 4, range of the tie)', () => {
    const b = youthHostile();
    b.girls[0].mp = 300;
    b.girls[1].mp = 120;
    b.girls[2].mp = 80;
    let c = b.poll(8); // 8 % 8 = 0
    expect([b.id(c), b.targets(c)]).toEqual([BLOWOUT, ['yuna']]);
    expect(b.rng.calls).toEqual([[0, 0xffff]]);

    const tie = youthHostile();
    tie.girls[0].mp = 100;
    tie.girls[1].mp = 300;
    tie.girls[2].mp = 300;
    c = tie.poll(0, 1);
    expect([tie.id(c), tie.targets(c)]).toEqual([BLOWOUT, ['paine']]);
    expect(tie.rng.calls).toEqual([[0, 0xffff], [0, 1]]);

    const all = youthHostile();
    for (const g of all.girls) g.mp = 170;
    c = all.poll(16, 2);
    expect(all.targets(c)).toEqual(['paine']);
    expect(all.rng.calls[1]).toEqual([0, 2]);
  });

  it('a roll of 1 to 7 is an Attack on a living girl (one search over the living, nothing drawn for a lone girl)', () => {
    const b = youthHostile();
    const c = b.poll(3, 1);
    expect([b.id(c), b.targets(c)]).toEqual([YOUTH_ATTACK, ['rikku']]);
    b.girls[1].alive = false;
    const d = b.poll(9, 1); // two left: the search range is 0 to 1
    expect(b.targets(d)).toEqual(['paine']);
  });

  it('friendly: an Attack on a living girl, every poll, no roll', () => {
    const b = youthBout();
    for (let poll = 1; poll <= 20; poll++) {
      const c = b.poll(poll % 3);
      expect(b.id(c)).toBe(YOUTH_ATTACK);
      for (const [min, max] of b.rng.calls) expect([min, max]).not.toEqual([0, 0xffff]);
      b.rng.calls.length = 0;
    }
  });
});


describe('the generic "battle too long" block is inert [RE §2.4; m182.src:63, m181.src:59; research/re-ffx2-ai-bahamut-vegnagun.md 1.6]', () => {
  const NOT_THE_BLOCK = (id: string | null): boolean => id !== null && !RONSO_ANNOUNCEMENT_IDS.includes(id as never) && id !== METEOR;
  /** Poll `n` times with a harmless roll (1) and the first candidate; return the ids in order. */
  function run(b: Bench, n: number): Array<string | null> {
    const out: Array<string | null> = [];
    for (let i = 0; i < n; i++) {
      b.rng.drain();
      out.push(b.id(b.poll(1, 0, 0)));
    }
    return out;
  }

  it('the switch is off: the guard is true only when no girl can act, and the ATB clock does not step then', () => {
    expect(RONSO_TOO_LONG_BLOCK_ON).toBe(false);
  });

  it('in play none of the four scripts ever queues an announcement or Time Up Meteor, however long the fight runs (400 polls, a full party and a lone girl)', () => {
    for (const make of [garikHostile, garikBout, youthHostile, youthBout]) {
      const full = make();
      expect(run(full, 400).every(NOT_THE_BLOCK)).toBe(true);
      expect([mem(full.self, RONSO_POLLS), mem(full.self, RONSO_STAGE)]).toEqual([0, 0]);
      const lone = alone(make());
      expect(run(lone, 400).every(NOT_THE_BLOCK)).toBe(true);
      expect([mem(lone.self, RONSO_POLLS), mem(lone.self, RONSO_STAGE)]).toEqual([0, 0]);
    }
  });

  it('Garik\'s turn counter just keeps cycling past the old thresholds: after 400 hostile polls it is 400 mod 7 = 1', () => {
    const b = garikHostile();
    run(b, 400);
    expect(mem(b.self, RONSO_TURN)).toBe(400 % 7);
  });

  it('with the switch passed off (the shipped default) tooLong counts nothing and queues nothing', () => {
    const b = garikHostile();
    for (let i = 0; i < 300; i++) expect(tooLong(b.ctx, GARIK_TOO_LONG_POLLS)).toBeNull();
    expect([mem(b.self, RONSO_POLLS), mem(b.self, RONSO_STAGE)]).toEqual([0, 0]);
  });

  describe('the ported thresholds, driven through the switch (`enabled` true), pinned in case a run of the exe ever says the guard can be true', () => {
    /** Call the block `n` times with it enabled; return the ids it queued (null where it queued nothing). */
    function block(b: Bench, polls: readonly [number, number, number, number], n: number): Array<string | null> {
      const out: Array<string | null> = [];
      for (let i = 0; i < n; i++) out.push(b.id(tooLong(b.ctx, polls, true)));
      return out;
    }
    const stageOf = (ids: Array<string | null>): number[] => ids.flatMap((id, i) => (RONSO_ANNOUNCEMENT_IDS.includes(id as never) ? [i + 1] : []));

    it('Garik: polls 181, 191, 196 and 201 are the four announcements in order, Time Up Meteor on 202 and every poll after, and nothing before 181', () => {
      const b = garikHostile();
      const ids = block(b, GARIK_TOO_LONG_POLLS, 206);
      expect(stageOf(ids)).toEqual([181, 191, 196, 201]);
      expect([ids[180], ids[190], ids[195], ids[200]]).toEqual([...RONSO_ANNOUNCEMENT_IDS]);
      expect(ids.slice(201)).toEqual([METEOR, METEOR, METEOR, METEOR, METEOR]);
      expect(ids.slice(0, 180).every((id) => id === null)).toBe(true);
      expect([mem(b.self, RONSO_POLLS), mem(b.self, RONSO_STAGE)]).toEqual([206, 4]);
    });

    it('a Youth: 141, 151, 156 and 161 are the announcements, Time Up Meteor from 162', () => {
      const b = youthHostile();
      const ids = block(b, YOUTH_TOO_LONG_POLLS, 165);
      expect(stageOf(ids)).toEqual([141, 151, 156, 161]);
      expect(ids.slice(161)).toEqual([METEOR, METEOR, METEOR, METEOR]);
    });

    it('the announcements are on himself and the Meteor is on everyone: no targets', () => {
      const b = garikHostile();
      block(b, GARIK_TOO_LONG_POLLS, 201);
      const last = tooLong(b.ctx, GARIK_TOO_LONG_POLLS, true);
      expect([b.id(last), b.targets(last)]).toEqual([METEOR, []]);
    });
  });
});
