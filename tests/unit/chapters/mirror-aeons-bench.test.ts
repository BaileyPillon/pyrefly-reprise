/**
 * **The bench for the hidden Mirror Aeons chapter: the difficulty measured, never tuned** (D-410; Bailey 2026-10-15: "i like the mirror match but make the difficulty appropriate not too easy not too hard"; the plan
 * is `docs/plans/ch-mirror-aeons-review.md` section 3, the table and the recommended cell `docs/plans/ch-mirror-aeons-bench.md`, printed by `tools/mirror-aeons-bench.mjs`). The target: **with the advisor's line a full
 * run (both acts, the heal between them) is won about 70 percent of the time, 60 to 80 accepted**, and a careless line (the plain Attack on the first living enemy, no aeon, no potion) **mostly loses**. The levers are the
 * party preset (`data/ffx/builds/mirror-aeons.ts`: its Phoenix Downs, Luck, stat fraction) and WHICH of the game's own formations each act uses; **no boss row is ever edited to fit a result**.
 *
 * **Pay on and Pay off (the release driver's rule, 2026-10-15).** A Pay can roll a Zanmato, which kills every legal foe of a group whatever its Death resistance (RE's `afda2d451`, merged), so the table carries the line with Pay on
 * beside the two lines that never pay him (Yojimbo sent in and dismissed at his first menu, which loses the shield; Yojimbo never sent in, the competent no-Pay line). At compatibility 128 and hire answer 2 (the game's own starting values, read at boot, 2026-10-17) a Pay of 100,000 gil buys a Zanmato
 * 11 times in 64 (31 with a full Overdrive gauge, which the line never has when it pays): 42 of the advisor's 234 Pays at tier 2 did, and 42 of 200 Act II fights ended that way. Dark Yojimbo is the only legal foe in Act II, so the
 * first-target kill already ended those fights, and the Pay-on and Pay-off numbers agree closely. The Sisters' seven other orders work now (`4256d209a`); the line still plays only Combine powers and Dismiss.
 *
 * **THE TABLE OF RECORD (2026-10-16)** was run on the engine with RE's whole follow-up merged (`494b2f2fb`/`53ce98a05`: the group Zanmato, the seven orders, the group-type Delta Attack). The rate pins below are OFF unless
 * `MIRROR_AEONS_BENCH=1` is set (they take a minute and a half): the driver turns them on for a release check. The constants the chapter ships (the pair, tier 2, 17 Phoenix Downs) are pinned beside the numbers that set them.
 *
 * What this file holds, in four parts: the harness (always on), what a blade and a spell can reach (the engine's hit rule is the game's, and it is why the line sends blades to Cindy and Sandy and spells to Mindy; always on),
 * **one smoke cell** (always on: the cell runs, every fight ends, nothing is asserted about how often it is won), and the **rate pins** of the table of record (the shipped cell's band over a few dozen seeds, the Pay-off lines,
 * the trio, the singles; on with `MIRROR_AEONS_BENCH=1`). The chapter's picks and the preset's lever are pinned beside the numbers that set them, so the day one moves the test says so.
 */
import { describe, expect, it } from 'vitest';

import type { Command, FFXCombatant } from '../../../src/battle/common/types.ts';
import { ENDGAME_PHOENIX_DOWNS, mirrorAeonsBuild } from '../../../src/data/ffx/builds/mirror-aeons.ts';
import { MIRROR_ACT_I, MIRROR_ACT_II, SISTER_ADJUSTED_FORMATIONS, SISTER_LADDER, YOJIMBO_TIERS, sistersGroupId } from '../../../src/data/ffx/mirror-aeons-ids.ts';
import {
  ACT_I_CELLS, ACT_II_CELLS, BAND, CARELESS_AT_MOST, TARGET, ablatedLine, advisorLine, carelessLine, inBand, pickCell, playAct, playChain, rateOf, share, withLuck, withPhoenixDowns, withStatFraction, type Rate,
} from '../helpers/mirrorAeonsBench.ts';
import * as H from '../helpers/mirrorAeonsDrive.ts';

/** The rate pins run only when the driver re-runs the bench (see the header); the rest of the file always runs. */
const BENCH = process.env['MIRROR_AEONS_BENCH'] === '1';

const rate = (wins: number, seeds = 100): Rate => ({ seeds, wins, lostFirst: seeds - wins, lostSecond: 0, unfinished: 0 });

describe('the harness (always on)', () => {
  it('the band is 60 to 80 percent around a target of 70; careless is "mostly loses" under 20', () => {
    expect([TARGET, BAND, CARELESS_AT_MOST]).toEqual([0.7, [0.6, 0.8], 0.2]);
    expect([0.59, 0.6, 0.7, 0.8, 0.81].map(inBand)).toEqual([false, true, true, true, false]);
  });

  it('picks the cell nearest 70 percent inside the band, and none when no cell is inside it', () => {
    expect(pickCell([{ advisor: rate(95) }, { advisor: rate(78) }, { advisor: rate(66) }, { advisor: rate(20) }])).toEqual({ advisor: rate(66) }); // 66 is 4 from the target, 78 is 8
    expect(pickCell([{ advisor: rate(95) }, { advisor: rate(40) }])).toBeNull();
    expect(pickCell([])).toBeNull();
  });

  it('the cells are the game\'s own formations plus the one adjusted trio (OUR adjustment); each is registered, and the shipped picks are among them', () => {
    expect(ACT_I_CELLS).toEqual(['kino00_70', 'kino01_72', 'kino00_70-g0']);
    expect(ACT_II_CELLS).toEqual(['nagi05_70', 'nagi05_71', 'nagi05_72']);
    for (const file of [...ACT_I_CELLS, ...ACT_II_CELLS]) expect(() => H.setup(1, H.groupIdOf(file)), file).not.toThrow();
    expect(SISTER_ADJUSTED_FORMATIONS.map((f) => f.file)).toEqual(['kino00_70-g0']);
    expect(ACT_I_CELLS).toContain(MIRROR_ACT_I);
    expect(ACT_II_CELLS).toContain(MIRROR_ACT_II);
    expect(SISTER_LADDER).toContain(MIRROR_ACT_I);
    expect(YOJIMBO_TIERS.map((t) => t.file)).toContain(MIRROR_ACT_II);
  });

  it('the levers change only what they name: Phoenix Downs the one item, Luck every member\'s, the stat fraction four stats and not Agility, HP or the hit stats', () => {
    const base = mirrorAeonsBuild;
    const pd = withPhoenixDowns(base, 3);
    expect(pd.inventory.find((e) => e.itemId === 'phoenix-down')?.count).toBe(3);
    expect(pd.inventory.filter((e) => e.itemId !== 'phoenix-down')).toEqual(base.inventory.filter((e) => e.itemId !== 'phoenix-down'));
    expect(base.inventory.find((e) => e.itemId === 'phoenix-down')?.count, 'the shared build is never mutated').toBe(ENDGAME_PHOENIX_DOWNS);
    expect(withLuck(base, 7).members.every((m) => m.stats.luck === 7)).toBe(true);
    const weaker = withStatFraction(base, 0.5);
    for (const [i, m] of weaker.members.entries()) {
      const was = base.members[i]!.stats;
      expect([m.stats.str, m.stats.def, m.stats.mag, m.stats.mdef]).toEqual([Math.round(was.str / 2), Math.round(was.def / 2), Math.round(was.mag / 2), Math.round(was.mdef / 2)]);
      expect([m.stats.agi, m.stats.maxHp, m.stats.eva, m.stats.acc]).toEqual([was.agi, was.maxHp, was.eva, was.acc]);
    }
  });
});

describe('what a blade and a spell can reach (measured on the real engine, the preset\'s own party; deterministic seeds)', () => {
  /** Swings (or casts) at `target` with `who`, the party kept alive and the target's HP kept huge: hits and misses over a few seeds. */
  function reach(group: string, target: string, who: string, how: 'blade' | 'spell'): { hits: number; swings: number } {
    let hits = 0;
    let swings = 0;
    for (let seed = 1; seed <= 5; seed++) {
      const e = H.newEngine(seed, group);
      for (const id of e.state().enemyIds) {
        const c = e.state().combatants[id] as FFXCombatant;
        c.stats.maxHp = c.hp = 99_999_999;
      }
      for (let i = 0; i < 60 && swings < 40 * seed; i++) {
        const d = e.nextDecision();
        if (d.kind === 'battle-over') break;
        if (d.kind !== 'player-input') continue;
        for (const id of e.state().activeIds) {
          const m = e.state().combatants[id] as FFXCombatant;
          m.stats.maxHp = m.hp = 9_999_999; // the Dark Aeons' blows are capped at 99,999: nobody falls while the swings are counted
        }
        const row = d.commands.find((c) => c.enabled && c.validTargets.includes(target) && (how === 'blade' ? c.command.kind === 'attack' : c.command.kind === 'ability' && c.label === 'Fire'));
        if (d.actorId !== who || !row) { e.submit(H.defend()); continue; }
        const events = e.submit({ ...row.command, targets: [target] } as Command);
        swings++;
        if (events.some((ev) => ev.type === 'damage' && ev.targetId === target && ev.amount > 0)) hits++;
      }
    }
    return { hits, swings };
  }

  it('a blade of Tidus lands none on Dark Mindy (Evasion 240), most on Sandy (100), all on Cindy (0), about two in five on Dark Yojimbo (Luck 114)', () => {
    const pair = H.ACT_I_GROUP; // Mindy and Sandy
    const mindy = reach(pair, 'dark-mindy', 'tidus', 'blade');
    const sandy = reach(pair, 'dark-sandy', 'tidus', 'blade');
    const cindy = reach(sistersGroupId('kino01_71'), 'dark-cindy', 'tidus', 'blade'); // Cindy alone
    const yojimbo = reach(H.ACT_II_GROUP, 'dark-yojimbo', 'tidus', 'blade');
    for (const r of [mindy, sandy, cindy, yojimbo]) expect(r.swings).toBeGreaterThanOrEqual(20);
    expect(mindy.hits / mindy.swings).toBeLessThan(0.05);
    expect(sandy.hits / sandy.swings).toBeGreaterThan(0.55);
    expect(sandy.hits / sandy.swings).toBeLessThan(0.97);
    expect(cindy.hits / cindy.swings).toBeGreaterThan(0.97);
    expect(yojimbo.hits / yojimbo.swings).toBeGreaterThan(0.2);
    expect(yojimbo.hits / yojimbo.swings).toBeLessThan(0.7);
  });

  it('a spell of Lulu never misses, Dark Mindy included', () => {
    const spell = reach(H.ACT_I_GROUP, 'dark-mindy', 'lulu', 'spell');
    expect(spell.swings).toBeGreaterThanOrEqual(10);
    expect(spell.hits).toBe(spell.swings);
  });
});

describe('one smoke cell (always on: nothing here says how often a line wins)', () => {
  it('the shipped cell runs for every line: each fight ends, the counts add up, and a seed is a fight', () => {
    for (const [name, line] of [['advisor', advisorLine], ['careless', carelessLine], ['Pay off, no Yojimbo', ablatedLine('no-yojimbo')], ['Pay off, Yojimbo unpaid', ablatedLine('no-pay')]] as const) {
      const r = rateOf(4, MIRROR_ACT_I, MIRROR_ACT_II, line);
      expect(r.unfinished, name).toBe(0);
      expect(r.wins + r.lostFirst + r.lostSecond, name).toBe(4);
    }
  }, 120_000);
});

describe.skipIf(!BENCH)('the shipped cell, measured for the table of record (the document\'s table has 200 seeds a line; here the first seeds, a band, and the reasons the others are not shipped; on with MIRROR_AEONS_BENCH=1)', () => {
  it('the chapter ships the faithful pair and tier 2, with 17 Phoenix Downs in the bag, each set by the bench', () => {
    expect([MIRROR_ACT_I, MIRROR_ACT_II, ENDGAME_PHOENIX_DOWNS]).toEqual(['kino01_72', 'nagi05_71', 17]);
  });

  it('the advisor\'s line (Pay ON; the Pay-off test beside it is the other honest line) wins the whole chapter about seven times in ten (60 seeds, band 55 to 85 percent), and a careless line loses it', () => {
    const advisor = rateOf(60, MIRROR_ACT_I, MIRROR_ACT_II, advisorLine);
    expect(advisor.unfinished).toBe(0);
    expect(share(advisor), `${advisor.wins} of ${advisor.seeds}`).toBeGreaterThanOrEqual(0.55);
    expect(share(advisor), `${advisor.wins} of ${advisor.seeds}`).toBeLessThanOrEqual(0.85);
    const careless = rateOf(20, MIRROR_ACT_I, MIRROR_ACT_II, carelessLine);
    expect(share(careless), `${careless.wins} of ${careless.seeds}`).toBeLessThanOrEqual(CARELESS_AT_MOST);
    // eslint-disable-next-line no-console
    console.info(`[mirror-aeons bench] ${MIRROR_ACT_I} -> ${MIRROR_ACT_II}: advisor ${advisor.wins}/${advisor.seeds} (lost in I ${advisor.lostFirst}, in II ${advisor.lostSecond}), careless ${careless.wins}/${careless.seeds}`);
  }, 180_000);

  it('Pay off, the line that never rolls a Zanmato of the player\'s: never sending Yojimbo in wins about seven runs in ten, and sending him in without paying him loses the shield', () => {
    const noYojimbo = rateOf(60, MIRROR_ACT_I, MIRROR_ACT_II, ablatedLine('no-yojimbo'));
    expect(noYojimbo.unfinished).toBe(0);
    expect(share(noYojimbo), `${noYojimbo.wins} of ${noYojimbo.seeds}`).toBeGreaterThanOrEqual(0.5);
    expect(share(noYojimbo), `${noYojimbo.wins} of ${noYojimbo.seeds}`).toBeLessThanOrEqual(0.85);
    const unpaid = rateOf(40, MIRROR_ACT_I, MIRROR_ACT_II, ablatedLine('no-pay'));
    expect(share(unpaid), `${unpaid.wins} of ${unpaid.seeds}`).toBeLessThanOrEqual(0.4);
    // eslint-disable-next-line no-console
    console.info(`[mirror-aeons bench, Pay off] no Yojimbo ${noYojimbo.wins}/${noYojimbo.seeds} (lost in I ${noYojimbo.lostFirst}, in II ${noYojimbo.lostSecond}), Yojimbo unpaid ${unpaid.wins}/${unpaid.seeds}`);
  }, 240_000);

  it('the faithful trio is out of the advisor\'s reach (the second Delta Attack has no shield: Mindy and Sandy kill a lone aeon first), and so is the trio with its gauges started at 0', () => {
    for (const cell of ['kino00_70', 'kino00_70-g0']) {
      const r = rateOf(25, cell, null, advisorLine);
      expect(r.unfinished, cell).toBe(0);
      expect(share(r), `${cell}: ${r.wins} of ${r.seeds}`).toBeLessThanOrEqual(0.2);
    }
  }, 120_000);

  it('the single sisters are too easy to be a chapter (a careless line wins Sandy alone and Cindy alone), which is why the pair is the formation', () => {
    for (const file of ['kino05_70', 'kino01_71']) expect(share(rateOf(10, file, null, carelessLine)), file).toBeGreaterThanOrEqual(0.9);
  }, 60_000);

  it('the heal between the acts does what the bench measured: Act II alone and as the second link are both fought from a whole party and whole aeons (one winnable seed, both ways)', () => {
    const alone = playAct(2, MIRROR_ACT_II, advisorLine);
    const chained = playChain(2, MIRROR_ACT_I, MIRROR_ACT_II, advisorLine);
    expect(alone.outcome).toBe('victory');
    expect(chained.outcome).toBe('victory');
    expect(chained.second?.outcome).toBe('victory');
  }, 60_000);
});
