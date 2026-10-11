/**
 * **Chapter IX (Yojimbo): the candidate lines of re-parity W5, as a measurement harness** (FFX only; the chapter is FFX's).
 *
 * Bailey's pick, 2026-10-10: "Keep 1:1, rework our line (Recommended)". The game charges the summoner the full recovery of her Summon
 * and does not give it back when the aeon leaves (`research/re-ffx-overdrive-steal-aeons.md` 4.7, row A3), so the line that called an
 * aeon at gauge 80 after the heal fell from 488 to 307 wins in 500. This file plays the candidate changes to OUR line (the tactic, the
 * advisor card and the guide steps that describe it) over the chapter's own setup, with nothing about Yojimbo, his odds, the party or
 * the aeons changed, so the rates in `docs/handoff/re-parity-w5.md` can be reproduced and a new rung can be added.
 *
 * It runs only with `PYREFLY_MEASURE=1` (it is a measurement, never a gate), so the full suite pays nothing:
 *
 *   PYREFLY_MEASURE=1 PYREFLY_MEASURE_SEEDS=1-500 PYREFLY_YOJIMBO_LINES=old,t96,queue,t96late \
 *     PYREFLY_MEASURE_OUT=out.json node vitest.mjs run --testTimeout=3000000 tests/unit/re-parity-w5-yojimbo-ladder.test.ts
 *
 * `PYREFLY_YOJIMBO_LINES` is a comma list of the names below (default: all); `shipped` is the real `intendedStrategy` and must equal `t96`
 * seed for seed (the one cheap check that the harness plays the line the game ships).
 *
 * The candidates, each a change to Yuna's choices only (Lulu casts Fira, Kimahri has no Doom on the shipped party, everyone else
 * defends, an aeon on the field defends):
 *   old        the line that shipped until W5: the aeon at gauge 80, after the revive and the heal
 *   t90 ... t100  the aeon at that gauge or above, before the revive and the heal (t96 is what ships)
 *   t96late    96, but after the revive and the heal (the old order)
 *   queue      the aeon on the first Yuna turn from gauge 90 on after which Zanmato would come before her next turn, read off the CTB forecast
 *   t96Protect t96, and Yuna casts Protect on Lulu, Yuna and Kimahri while she has nothing else to do (a cast the preset already has)
 *   t96Haste   t96, and Yuna casts Haste on Lulu while she lacks it
 * Not shipped: Protect and Haste add casts of ours that no source asks for and win 500 of 500 (the handoff says why that is not the target).
 */

import { writeFileSync } from 'node:fs';
import { describe, it } from 'vitest';
import type { AvailableCommand, BattleSetup, BattleState, Command, Decision, FFXCombatant } from '../../src/battle/common/types.ts';
import { FFXEngine } from '../../src/battle/ffx/index.ts';
import { registerBattleContent } from '../../src/app/screens/BattleScreenContent.ts';
import { setupForChapter } from '../../src/app/screens/BattleScreenSetup.ts';
import { CHAPTERS } from '../../src/data/encounters.ts';
import { intendedStrategy } from '../../src/engine/BattlePresenterStrategies.ts';
import { activeParty, aim, has, hpFraction, revive, row } from '../../src/engine/tactics/common.ts';

const MEASURE = process.env['PYREFLY_MEASURE'] === '1';
const OUT = process.env['PYREFLY_MEASURE_OUT'];
const BOSS = 'yojimbo';
const AEONS = ['Bahamut', 'Ifrit', 'Ixion', 'Shiva', 'Valefor'] as const;
const SPELLS = ['Fira', 'Blizzara', 'Thundara', 'Watera'] as const;

interface Opts {
  summonAt: number;
  /** consult the summon before the revive and the heal */
  first: boolean;
  /** summon by the CTB forecast (from gauge 90) instead of by a fixed gauge */
  queue: boolean;
  haste: boolean;
  protect: boolean;
}

const LINES: Record<string, Opts> = {
  old: { summonAt: 80, first: false, queue: false, haste: false, protect: false },
  t90: { summonAt: 90, first: true, queue: false, haste: false, protect: false },
  t92: { summonAt: 92, first: true, queue: false, haste: false, protect: false },
  t94: { summonAt: 94, first: true, queue: false, haste: false, protect: false },
  t95: { summonAt: 95, first: true, queue: false, haste: false, protect: false },
  t96: { summonAt: 96, first: true, queue: false, haste: false, protect: false },
  t97: { summonAt: 97, first: true, queue: false, haste: false, protect: false },
  t98: { summonAt: 98, first: true, queue: false, haste: false, protect: false },
  t99: { summonAt: 99, first: true, queue: false, haste: false, protect: false },
  t100: { summonAt: 100, first: true, queue: false, haste: false, protect: false },
  t96late: { summonAt: 96, first: false, queue: false, haste: false, protect: false },
  queue: { summonAt: 96, first: true, queue: true, haste: false, protect: false },
  t96Protect: { summonAt: 96, first: true, queue: false, haste: false, protect: true },
  t96Haste: { summonAt: 96, first: true, queue: false, haste: true, protect: false },
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
const WANT = (process.env['PYREFLY_YOJIMBO_LINES'] ?? '').split(',').map((s) => s.trim()).filter((s) => s !== '');
const NAMES = [...Object.keys(LINES), 'shipped'].filter((n) => WANT.length === 0 || WANT.includes(n));

function defend(commands: AvailableCommand[]): Command | null {
  const r = commands.find((c) => c.enabled && c.command.kind === 'defend');
  return r ? aim(r) : null;
}

/** Would Zanmato come before Yuna's next turn? Read off the CTB forecast, +2 for each of his turns and +3 for each cast of Lulu's. */
function zanmatoBeforeMyNextTurn(engine: FFXEngine, actorId: string, gauge: number): boolean {
  if (gauge >= 100) return true;
  const order = engine.predictTurnOrder(14);
  let g = gauge;
  for (let i = 1; i < order.length; i += 1) {
    const a = order[i]!.actorId;
    if (a === actorId) return false;
    if (a === BOSS) {
      if (g >= 100) return true;
      g += 2;
    } else if (a === 'lulu') g += 3;
  }
  return false;
}

function lineOf(o: Opts) {
  return (actorId: string, commands: AvailableCommand[], engine: FFXEngine): Command | null => {
    const state = engine.state();
    const boss = state.combatants[BOSS] as FFXCombatant | undefined;
    if (!boss || boss.side !== 'enemy' || !boss.alive) return null;
    const gauge = boss.overdrive?.gauge ?? 0;
    if (state.aeonId === actorId) return defend(commands);
    const party = activeParty(engine);

    const due = (): boolean => {
      if (actorId !== 'yuna') return false;
      if (o.queue) return gauge >= 90 && zanmatoBeforeMyNextTurn(engine, actorId, gauge);
      return gauge >= o.summonAt;
    };
    const summon = (): Command | null => {
      for (const label of AEONS) {
        const s = commands.find((c) => c.enabled && c.command.kind === 'summon' && c.label === label);
        if (s) return aim(s);
      }
      return null;
    };

    if (o.first && due()) { const s = summon(); if (s) return s; }
    const back = revive(commands, party);
    if (back) return back;
    if (actorId === 'yuna') {
      const low = party.filter((c) => c.alive && hpFraction(c) < 0.45).sort((a, b) => hpFraction(a) - hpFraction(b));
      const first = low[0];
      if (first) {
        const heal = low.length >= 2 ? row(commands, ['Curaga', 'Cura'], first.id) : row(commands, ['Cura', 'Curaga'], first.id);
        if (heal) return aim(heal, first.id);
      }
    }
    if (actorId === 'kimahri' && !has(boss, 'doom')) {
      const doom = row(commands, ['Doom'], BOSS);
      if (doom && doom.command.kind === 'overdrive') return aim(doom, BOSS);
    }
    if (actorId === 'lulu') {
      const spell = row(commands, SPELLS, BOSS);
      if (spell) return aim(spell, BOSS);
    }
    if (!o.first && due()) { const s = summon(); if (s) return s; }
    if (actorId === 'yuna' && o.haste) {
      const lulu = party.find((c) => c.id === 'lulu' && c.alive);
      if (lulu && !has(lulu, 'haste')) {
        const h = row(commands, ['Haste'], 'lulu');
        if (h) return aim(h, 'lulu');
      }
    }
    if (actorId === 'yuna' && o.protect) {
      for (const id of ['lulu', 'yuna', 'kimahri']) {
        const c = party.find((p) => p.id === id && p.alive);
        if (c && !has(c, 'protect')) {
          const p = row(commands, ['Protect'], id);
          if (p) return aim(p, id);
        }
      }
    }
    return defend(commands);
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

interface One { won: boolean; partyTurns: number; zanmatoOnOpenParty: boolean; kos: number }

function play(seed: number, name: string): One {
  const chapter = CHAPTERS.find((c) => c.id === 'yojimbo-cavern')!;
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
  let aeonOut = false;
  let open = false;
  let kos = 0;
  for (const e of st.log) {
    if (e.type === 'summon') aeonOut = true;
    else if (e.type === 'dismiss') aeonOut = false;
    else if (e.type === 'action-start' && e.actorId === BOSS && /zanmato/i.test(e.abilityName ?? '') && !aeonOut) open = true;
    else if (e.type === 'ko') {
      const side = st.combatants[e.targetId]?.side;
      if (side === 'party' || side === 'aeon') kos += 1;
    }
  }
  return { won: outcome === 'victory', partyTurns, zanmatoOnOpenParty: open, kos };
}

const mean = (xs: readonly number[]): number => (xs.length === 0 ? 0 : Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 10) / 10);

describe.skipIf(!MEASURE)('Chapter IX (Yojimbo), re-parity W5: the candidate lines (PYREFLY_MEASURE=1)', () => {
  it('plays each named line over the seeds and prints wins, party turns, KOs and Zanmatos that met an open party', async () => {
    await registerBattleContent();
    const rows: unknown[] = [];
    for (const name of NAMES) {
      const ones = SEEDS.map((seed) => play(seed, name));
      const row1 = {
        line: name,
        seeds: SEEDS.length,
        wins: ones.filter((o) => o.won).length,
        meanPartyTurns: mean(ones.map((o) => o.partyTurns)),
        meanPartyKos: mean(ones.map((o) => o.kos)),
        lossesWithAnOpenZanmato: ones.filter((o) => !o.won && o.zanmatoOnOpenParty).length,
        perSeed: ones.map((o) => (o.won ? 'W' : 'L')).join(''),
      };
      rows.push(row1);
      console.log(JSON.stringify(row1));
    }
    if (OUT) writeFileSync(OUT, JSON.stringify(rows, null, 1));
  }, 7_200_000);
});
