/**
 * **Chapter II (Yunalesca): the candidate lines of re-parity RC6, as a measurement harness** (FFX only; the chapter is FFX's).
 *
 * Bailey's pick, 2026-10-12: "I'll go with all of your recommendations", to the question whether to accept the game-true KO rule
 * (a KO clears Zombie) that dropped Chapter II from 476 to 398 of 500 and rework our line later. This file plays the candidate changes
 * to OUR line (the tactic, its advisor card, the guide steps) over the chapter's own setup (`setupForChapter`), with nothing about
 * Yunalesca, her script, the KO rule or the party preset changed, so the rates in `docs/handoff/re-parity-rc6-ch2.md` can be
 * reproduced and a new rung added.
 *
 * It runs only with `PYREFLY_MEASURE=1` (a measurement, never a gate), so the full suite pays nothing:
 *
 *   PYREFLY_MEASURE=1 PYREFLY_MEASURE_SEEDS=1-500 PYREFLY_YUNA_LINES=base,hold1,guard1 PYREFLY_MEASURE_OUT=out.json \
 *     node vitest.mjs run --testTimeout=3000000 tests/unit/re-parity-rc6-ch2-ladder.test.ts
 *
 * `PYREFLY_YUNA_LINES` is a comma list of the line names in `LINES` below plus `shipped` (default: all). `shipped` is the real `intendedStrategy`;
 * `tactic` is the shipped tactic called through this harness; they must equal each other, and `swapTidus` (the same switch played by the harness),
 * seed for seed (the cheap check that the harness plays the line the game ships). `base` is the line BEFORE RC6: the switch rows are hidden from
 * the tactic, so it plays what origin/r43-rc played (398 and 405 wins of 500 on seeds 1 to 500 and 501 to 1000).
 *
 * Each candidate wraps the tactic and changes only what the player's menu offers or what comes first, with the ring read off the battle log the way
 * a player reads it (`helpers/yunalescaRing.ts`, checked exactly by `re-parity-rc6-ch2-ring.test.ts`). The switches of `Opts`:
 *   hold N       no Phoenix Down, Life or Mega Phoenix while Mega Death is within N of her turns (1 = her very next turn)
 *   guard N      a Zombie at or under `guardHp` HP (one Dispelling Slap, 300, unless set), with at most `guardMaxZ` Zombies standing, Defends while
 *                Mega Death is within N of her turns (9 = always in Form III)
 *   cureMinZ     Yuna cures the worn Zombie (under `cureFrac` of its HP) with Holy Water or Remedy early in the ring (`cureMaxTurn`: 0 = right after a
 *                Mega Death), when at least N Zombies stand (2 keeps one), even with aeons still to call
 *   reviveAll    any actor raises a downed member while Mega Death is within N of her turns (a no-op: the tactic already lets everyone raise in Forms II and III)
 *   shell        Yuna casts Shell on a Zombie at or under 700 HP the turn before Mind Blast
 *   swapIn/Form/With   the named member hands the turn to a bench member from the given form on (swapTidus = Tidus for Wakka in Form III: what ships)
 *   swapStandby  a clean acting member (not Auron or a bench type) switches for Wakka, Kimahri or Rikku when no Zombie stands and Mega Death is within N turns
 * Rates and the reading of each are in `docs/handoff/re-parity-rc6-ch2.md`.
 */

import { writeFileSync } from 'node:fs';
import { describe, it } from 'vitest';
import type { AvailableCommand, BattleSetup, BattleState, Command, Decision, FFXCombatant } from '../../src/battle/common/types.ts';
import { FFXEngine } from '../../src/battle/ffx/index.ts';
import { registerBattleContent } from '../../src/app/screens/BattleScreenContent.ts';
import { setupForChapter } from '../../src/app/screens/BattleScreenSetup.ts';
import { CHAPTERS } from '../../src/data/encounters.ts';
import { intendedStrategy } from '../../src/engine/BattlePresenterStrategies.ts';
import { activeParty, aim, has, hpFraction, row } from '../../src/engine/tactics/common.ts';
import { yunalesca } from '../../src/engine/tactics/yunalesca.ts';
import { readRing } from './helpers/yunalescaRing.ts';

const MEASURE = process.env['PYREFLY_MEASURE'] === '1';
const OUT = process.env['PYREFLY_MEASURE_OUT'];
const BOSS = 'yunalesca';
const REVIVES = ['Phoenix Down', 'Life', 'Mega Phoenix', 'Full-Life'];
/** The biggest Dispelling Slap at Defense 0 (research/ffx-yunalesca.md 4.2: 296): a Zombie at or under this is one Slap from dying. */
const SLAP_MAX = 300;

interface Opts {
  hold: number;
  guard: number;
  /** Zombies that must stand before Yuna cures the worn one (0 = never; 1 may cure the last, 2 keeps one) */
  cureMinZ: number;
  /** Yuna cures only while the ring has taken at most this many ordinary turns since the last Mega Death (0 = right after it) */
  cureMaxTurn: number;
  /** the worn Zombie is cured under this fraction of its HP */
  cureFrac: number;
  /** any actor raises a downed member while Mega Death is within this many of her turns (0 = the shipped rule: Yuna raises) */
  reviveAll: number;
  /** a Zombie at or under this many HP is 'low' for the guard (the biggest Slap, 300, unless set) */
  guardHp: number;
  /** the guard applies while at most this many Zombies stand */
  guardMaxZ: number;
  /** Shell on a Zombie MB would kill, the turn before Mind Blast (1 = on) */
  shell: number;
  /** a Wakka (no Zombie Ward, a Death Ward) takes this member's place at his first Form III turn: 'tidus' | 'auron' | 'yuna' | '' */
  swapIn: string;
  /** a clean acting member swaps for a Death Ward bench member when no Zombie stands and Mega Death is within this many turns */
  swapStandby: number;
  /** the form (0 to 2) from which 'swapIn' is played, and the bench member who comes in */
  swapForm: number;
  swapWith: string;
  /** leave the shipped tactic's own switch to the carrier alone (off: the switch rows are hidden from it, so `base` is the line before RC6) */
  tacticSwap: boolean;
}
const OFF: Opts = { hold: 0, guard: 0, cureMinZ: 0, cureMaxTurn: 0, cureFrac: 0.4, reviveAll: 0, guardHp: SLAP_MAX, guardMaxZ: 1, shell: 0, swapIn: '', swapStandby: 0, swapForm: 2, swapWith: 'wakka', tacticSwap: false };

const LINES: Record<string, Opts> = {
  base: OFF,
  tactic: { ...OFF, tacticSwap: true },
  hold1: { ...OFF, hold: 1 },
  hold2: { ...OFF, hold: 2 },
  guard1: { ...OFF, guard: 1 },
  guard2: { ...OFF, guard: 2 },
  guardAll: { ...OFF, guard: 9 },
  cure2: { ...OFF, cureMinZ: 2 },
  cure1: { ...OFF, cureMinZ: 1 },
  cure2t1: { ...OFF, cureMinZ: 2, cureMaxTurn: 1 },
  cure2t3: { ...OFF, cureMinZ: 2, cureMaxTurn: 3 },
  cure1t1: { ...OFF, cureMinZ: 1, cureMaxTurn: 1 },
  cure2f6: { ...OFF, cureMinZ: 2, cureFrac: 0.6 },
  cure2f8: { ...OFF, cureMinZ: 2, cureFrac: 0.8 },
  cure2t1f6: { ...OFF, cureMinZ: 2, cureMaxTurn: 1, cureFrac: 0.6 },
  cure2t3f6: { ...OFF, cureMinZ: 2, cureMaxTurn: 3, cureFrac: 0.6 },
  cure2t3f8: { ...OFF, cureMinZ: 2, cureMaxTurn: 3, cureFrac: 0.8 },
  rev2: { ...OFF, reviveAll: 2 },
  rev3: { ...OFF, reviveAll: 3 },
  rev9: { ...OFF, reviveAll: 9 },
  cure2guard2: { ...OFF, cureMinZ: 2, guard: 2 },
  cure2rev2: { ...OFF, cureMinZ: 2, reviveAll: 2 },
  shell: { ...OFF, shell: 1 },
  g2h700: { ...OFF, guard: 2, guardHp: 700 },
  g2h1500: { ...OFF, guard: 2, guardHp: 1500 },
  g2h700z2: { ...OFF, guard: 2, guardHp: 700, guardMaxZ: 2 },
  g3h700: { ...OFF, guard: 3, guardHp: 700 },
  g5h700: { ...OFF, guard: 5, guardHp: 700 },
  g2h700cure2: { ...OFF, guard: 2, guardHp: 700, cureMinZ: 2 },
  g3h700cure2: { ...OFF, guard: 3, guardHp: 700, cureMinZ: 2 },
  swapTidus: { ...OFF, swapIn: 'tidus' },
  swapAuron: { ...OFF, swapIn: 'auron' },
  swapStandby2: { ...OFF, swapStandby: 2 },
  swapStandby3: { ...OFF, swapStandby: 3 },
  sT1W: { ...OFF, swapIn: 'tidus', swapForm: 1, swapWith: 'wakka' },
  sT0W: { ...OFF, swapIn: 'tidus', swapForm: 0, swapWith: 'wakka' },
  sT2K: { ...OFF, swapIn: 'tidus', swapForm: 2, swapWith: 'kimahri' },
  sT2L: { ...OFF, swapIn: 'tidus', swapForm: 2, swapWith: 'lulu' },
  sT2R: { ...OFF, swapIn: 'tidus', swapForm: 2, swapWith: 'rikku' },
  sT2Wstandby2: { ...OFF, swapIn: 'tidus', swapForm: 2, swapWith: 'wakka', swapStandby: 2 },
  sT2Wg2: { ...OFF, swapIn: 'tidus', swapForm: 2, swapWith: 'wakka', guard: 2 },
  sT2Wc2: { ...OFF, swapIn: 'tidus', swapForm: 2, swapWith: 'wakka', cureMinZ: 2 },
  sY2W: { ...OFF, swapIn: 'yuna', swapForm: 2, swapWith: 'wakka' },
};

function parseSeeds(spec: string | undefined): number[] {
  if (!spec) return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  const range = /^(\d+)-(\d+)$/.exec(spec);
  if (range) {
    const [from, to] = [Number(range[1]), Number(range[2])];
    return Array.from({ length: to - from + 1 }, (_, i) => from + i);
  }
  return spec.split(',').map((s) => Number(s.trim())).filter((n) => Number.isFinite(n));
}
const SEEDS = parseSeeds(process.env['PYREFLY_MEASURE_SEEDS']);
const WANT = (process.env['PYREFLY_YUNA_LINES'] ?? '').split(',').map((s) => s.trim()).filter((s) => s !== '');
const NAMES = [...Object.keys(LINES), 'shipped'].filter((n) => WANT.length === 0 || WANT.includes(n));

/** What `intendedStrategy` does when the tactic has no opinion: the ready Overdrive, else the first Attack (the boss is the only foe). */
function swing(commands: AvailableCommand[]): Command | null {
  const on = commands.filter((c) => c.enabled);
  const od = on.find((c) => c.command.kind === 'overdrive');
  const r = od ?? on.find((c) => c.command.kind === 'attack') ?? on.find((c) => c.category === 'skill' || c.category === 'blackmagic') ?? on[0];
  if (!r) return null;
  return aim(r, r.validTargets.includes(BOSS) ? BOSS : r.validTargets[0]);
}

function lineOf(o: Opts) {
  return (actorId: string, commands: AvailableCommand[], engine: FFXEngine): Command | null => {
    const state = engine.state();
    const boss = state.combatants[BOSS] as FFXCombatant | undefined;
    if (!boss || !boss.alive) return null;
    const party = activeParty(engine);
    const living = party.filter((c) => c.alive);
    const ring = readRing(state.log, BOSS);
    const actor = state.combatants[actorId];
    // the line before RC6 never saw a switch row; the harness's own swap below uses the full list
    let offered = o.tacticSwap ? commands : commands.filter((c) => c.command.kind !== 'switch');

    if (ring.form === 2 && !ring.aeonOut) {
      const next = ring.megaDeathIn ?? 99;
      // 1. Do not raise anyone into a Mega Death.
      if (o.hold > 0 && next < o.hold) offered = offered.filter((c) => !REVIVES.includes(c.label));
      // 2. A lone Zombie one Slap from death keeps its hands down while a Mega Death is near.
      if (o.guard > 0 && actor && has(actor, 'zombie') && next < o.guard) {
        const zombies = living.filter((c) => has(c, 'zombie'));
        if (zombies.length <= o.guardMaxZ && actor.hp <= o.guardHp) {
          const d = row(commands, ['Defend']);
          if (d) return aim(d, actorId);
        }
      }
      // 3. Yuna cures the worn Zombie early in the ring, while the longest stretch of Hellbiter turns lies ahead.
      if (o.cureMinZ > 0 && ring.turns <= o.cureMaxTurn && commands.some((c) => c.label === 'Curaga' || c.label === 'Reflect') && !party.some((c) => !c.alive)) {
        const zombies = living.filter((c) => has(c, 'zombie'));
        const worn = [...zombies].sort((a, b) => hpFraction(a) - hpFraction(b))[0];
        if (worn && zombies.length >= o.cureMinZ && hpFraction(worn) < o.cureFrac) {
          const cure = row(commands, ['Holy Water', 'Remedy'], worn.id);
          if (cure) return aim(cure, worn.id);
        }
      }
      // 3b. Shell on the lowest-HP Zombie Mind Blast would kill, while Mind Blast is her next turn.
      if (o.shell > 0 && ring.turns === 1 && commands.some((c) => c.label === 'Curaga' || c.label === 'Reflect')) {
        const doomed = living.filter((c) => has(c, 'zombie') && c.hp <= 700 && !has(c, 'shell')).sort((a, b) => a.hp - b.hp)[0];
        const cast = doomed && row(commands, ['Shell'], doomed.id);
        if (cast && doomed) return aim(cast, doomed.id);
      }
      // 3c. A Death Ward bench member stands in for a clean member when no Zombie stands and Mega Death is close.
      if (o.swapStandby > 0 && next < o.swapStandby && actor && !['wakka', 'kimahri', 'rikku', 'auron'].includes(actorId) && !has(actor, 'zombie') && !living.some((c) => has(c, 'zombie'))) {
        const sw = commands.find((c) => c.enabled && c.command.kind === 'switch' && ['wakka', 'kimahri', 'rikku'].includes((c.command as { extra: { inId: string } }).extra.inId));
        if (sw) return { ...sw.command } as Command;
      }
      // 4. Any actor raises a downed member while the Hellbiter turns before the Mega Death are few.
      if (o.reviveAll > 0 && next < o.reviveAll) {
        const downed = party.find((c) => !c.alive);
        if (downed) {
          const zombiesStanding = living.some((c) => has(c, 'zombie'));
          const r = row(commands, zombiesStanding ? ['Phoenix Down', 'Life', 'Full-Life'] : ['Phoenix Down', 'Life', 'Mega Phoenix', 'Full-Life'], downed.id);
          if (r) return aim(r, downed.id);
        }
      }
    }
    if (o.swapIn !== '' && ring.form >= o.swapForm && actorId === o.swapIn) {
      const sw = commands.find((c) => c.enabled && c.command.kind === 'switch' && (c.command as { extra: { inId: string } }).extra.inId === o.swapWith);
      if (sw) return { ...sw.command } as Command;
    }
    return yunalesca(actorId, offered, engine) ?? swing(offered);
  };
}

type Input = Extract<Decision, { kind: 'player-input' }>;

/** What the measurement harness plays when a line has no pick: the first enabled Attack, else the first enabled row. */
function fallback(d: Input): Command {
  const r = d.commands.find((c) => c.enabled && c.command.kind === 'attack') ?? d.commands.find((c) => c.enabled);
  if (!r) return { kind: 'defend', targets: [] } as Command;
  const t = r.validTargets[0];
  return { ...r.command, targets: t ? [t] : [] } as Command;
}

interface One { won: boolean; partyTurns: number; kos: number; phoenix: number; cures: number; megaDeaths: number; wipedAtMegaDeath: boolean }

function play(seed: number, name: string): One {
  const chapter = CHAPTERS.find((c) => c.id === 'yunalesca')!;
  const setup: BattleSetup = setupForChapter(chapter, seed);
  const engine = new FFXEngine({ autoResolveMinigames: true });
  engine.setSeed(setup.seed);
  engine.init(setup);
  const mine = name === 'shipped' ? null : lineOf(LINES[name]!);
  let outcome = 'unresolved';
  let partyTurns = 0;
  for (let step = 0; step < 200_000; step += 1) {
    const d = engine.nextDecision();
    if (d.kind === 'resolved' || d.kind === 'waiting') continue;
    if (d.kind === 'battle-over') { outcome = String(d.result.outcome); break; }
    partyTurns += 1;
    const pick = (mine ? mine(d.actorId, d.commands, engine) : intendedStrategy(d.actorId, d.commands, engine as never)) ?? fallback(d);
    engine.submit(pick);
  }
  const st = engine.state() as BattleState;
  let kos = 0;
  let phoenix = 0;
  let cures = 0;
  let megaDeaths = 0;
  let lastWasMega = false;
  for (const e of st.log) {
    if (e.type === 'ko') {
      const side = st.combatants[e.targetId]?.side;
      if (side === 'party' || side === 'aeon') kos += 1;
    } else if (e.type === 'revive' && e.cause === 'phoenix-down') phoenix += 1;
    else if (e.type === 'action-start') {
      if (e.actorId === BOSS) { lastWasMega = e.abilityName === 'Mega Death'; if (lastWasMega) megaDeaths += 1; }
      else if (e.abilityName === 'Holy Water' || e.abilityName === 'Remedy') cures += 1;
    }
  }
  return { won: outcome === 'victory', partyTurns, kos, phoenix, cures, megaDeaths, wipedAtMegaDeath: outcome !== 'victory' && lastWasMega };
}

const mean = (xs: readonly number[]): number => (xs.length === 0 ? 0 : Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 10) / 10);

describe.skipIf(!MEASURE)('Chapter II (Yunalesca), re-parity RC6: the candidate lines (PYREFLY_MEASURE=1)', () => {
  it('plays each named line over the seeds and prints wins, party turns, KOs, Phoenix Downs, cures and wipes at a Mega Death', async () => {
    await registerBattleContent();
    const rows: unknown[] = [];
    for (const name of NAMES) {
      const ones = SEEDS.map((seed) => play(seed, name));
      const r = {
        line: name,
        seeds: SEEDS.length,
        wins: ones.filter((o) => o.won).length,
        meanPartyTurns: mean(ones.map((o) => o.partyTurns)),
        meanPartyKos: mean(ones.map((o) => o.kos)),
        meanPhoenix: mean(ones.map((o) => o.phoenix)),
        meanCures: mean(ones.map((o) => o.cures)),
        meanMegaDeaths: mean(ones.map((o) => o.megaDeaths)),
        lossesAtAMegaDeath: ones.filter((o) => o.wipedAtMegaDeath).length,
        perSeed: ones.map((o) => (o.won ? 'W' : 'L')).join(''),
      };
      rows.push(r);
      console.log(JSON.stringify({ ...r, perSeed: SEEDS.length > 60 ? `(${r.perSeed.length} seeds, see the JSON)` : r.perSeed }));
    }
    if (OUT) writeFileSync(OUT, JSON.stringify(rows, null, 1));
  }, 7_200_000);
});
