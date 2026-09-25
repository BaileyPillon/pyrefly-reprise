/**
 * **Seymour Omnis — the seeded bench.** Win rates across 200 seeds for sourced
 * lines and for a credibly wrong one, on the real engine, the real data and
 * the Garden of Pain build (`src/data/ffx/builds/garden-of-pain.ts`).
 *
 * **Measure, never tune** (`docs/plans/chapter-omnis-review.md` §9, R4, the
 * `boss-side-fix-needs-measured-options` rule): this file prints the numbers
 * and pins only that every battle ends and that the intended line beats the
 * wrong one. If a line is unwinnable, the answer is measured options for
 * Bailey, never a weaker or stronger boss.
 *
 * What every number rests on, said out loud:
 * - **The party is `[estimate]`**: Chapter III's preset cells (B5 = a), its
 *   gear less the Infinity's One MP Cost, plus the Phantom Ring on Yuna
 *   (B6 = a), its bag (B7 = a), Tidus / Yuna / Auron opening (B2 = a).
 * - **The ring order and the reset cycle are our estimate** (B8 = b), and so is
 *   who each disc's spell hits (B12 = a).
 * - **`no ring`** rows run the intended line on the same build with Yuna in
 *   her Chapter III Tetra Ring (B6 = b): the difficulty lever, measured.
 *
 * The lines (research §5):
 * - **intended** — rows 1, 2, 3, 6, 9: Tidus hands his turn to Wakka (the only
 *   member who turns a disc left); Wakka hits a disc of any colour shown on
 *   three or more discs, so no -ga comes out, else he hits Omnis; Auron lands
 *   Armor Break, then hits; Yuna Nuls the majority colour, re-casts Hastega
 *   after each Dispel, heals, and lifts everyone above 4,200 before Ultima.
 * - **break-brute** — row 1 alone: Auron's Armor Break, then Tidus and Auron
 *   hit Omnis; Yuna only heals. No disc is touched.
 * - **weakness** — row 5: Tidus hands his turn to Lulu; Auron lands Mental
 *   Break, then Armor Break, then hits; Lulu Doublecasts the -ga of his
 *   weakness while four discs match, else of an element he does not resist;
 *   Yuna heals.
 * - **wrong** — the credibly wrong line the plan names: Tidus hands his turn to
 *   Lulu, who casts **Firaga into a Fire-absorbing Omnis**; Auron hits without
 *   breaking him; Yuna heals.
 *
 * **Game case: FFX only** [AGENTS.md rule 14].
 */

import { beforeAll, describe, expect, it } from 'vitest';
import type { AvailableCommand, BattleEngine, Command, FFXCombatant, FFXPartyBuild } from '../../../src/battle/common/types.ts';
import { dreamsEndBuild } from '../../../src/data/ffx/builds/dreams-end.ts';
import { gardenOfPainBuild } from '../../../src/data/ffx/builds/garden-of-pain.ts';
import { DISCS, OMNIS, newEngine } from '../helpers/omnisUnits.ts';

const SEEDS = 200;
type Line = 'intended' | 'break-brute' | 'weakness' | 'wrong';
const LINES: readonly Line[] = ['intended', 'break-brute', 'weakness', 'wrong'];

/** B6 = b, measured beside the pick: Yuna keeps Chapter III's Tetra Ring. */
const noRing: FFXPartyBuild = {
  ...gardenOfPainBuild,
  members: gardenOfPainBuild.members.map((m) =>
    m.id === 'yuna' ? { ...m, equipment: { ...m.equipment, armor: structuredClone(dreamsEndBuild.members.find((x) => x.id === 'yuna')!.equipment.armor) } } : m,
  ),
};

const defend: Command = { kind: 'defend', targets: [] };
const OPPOSITE: Record<string, string> = { fire: 'ice', ice: 'fire', lightning: 'water', water: 'lightning' };
const GA: Record<string, string> = { fire: 'firaga', ice: 'blizzaga', lightning: 'thundaga', water: 'waterga' };
const NUL: Record<string, string> = { fire: 'nulblaze', ice: 'nulfrost', lightning: 'nulshock', water: 'nultide' };

function row(commands: readonly AvailableCommand[], kind: Command['kind'], id?: string): AvailableCommand | undefined {
  return commands.find((c) => c.enabled && c.command.kind === kind && (id === undefined || ('id' in c.command && c.command.id === id)));
}
function party(engine: BattleEngine): FFXCombatant[] {
  const st = engine.state();
  return st.activeIds.map((id) => st.combatants[id] as FFXCombatant).filter((c) => !c.removed);
}
function discsOf(engine: BattleEngine): string[] {
  return String(engine.state().flags['omnis.discs']).split(',');
}
function majority(engine: BattleEngine): { element: string; count: number } {
  const counts: Record<string, number> = {};
  for (const d of discsOf(engine)) counts[d] = (counts[d] ?? 0) + 1;
  const [element, count] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]!;
  return { element, count };
}
function switchTo(commands: readonly AvailableCommand[], inId: string): Command | null {
  const s = commands.find((c) => c.enabled && c.command.kind === 'switch' && (c.command.extra as { inId?: string } | undefined)?.inId === inId);
  return s ? s.command : null;
}
function hitOmnis(commands: readonly AvailableCommand[]): Command {
  return row(commands, 'attack')?.validTargets.includes(OMNIS) ? { kind: 'attack', targets: [OMNIS] } : defend;
}
function ability(commands: readonly AvailableCommand[], id: string, target: string): Command | null {
  return row(commands, 'ability', id)?.validTargets.includes(target) ? { kind: 'ability', id, targets: [target] } : null;
}

/** Shared by every line: revive the fallen, then heal the lowest below `floor` (a share of max HP, or an absolute HP). */
function upkeep(engine: BattleEngine, actorId: string, commands: readonly AvailableCommand[], floorHp?: number): Command | null {
  const members = party(engine);
  const down = members.find((c) => c.hp <= 0);
  if (down) {
    if (actorId === 'yuna') {
      const life = ability(commands, 'life', down.id);
      if (life) return life;
    }
    for (const item of ['phoenix-down', 'mega-phoenix']) {
      if (row(commands, 'item', item)?.validTargets.includes(down.id)) return { kind: 'item', id: item, targets: [down.id] };
    }
  }
  // MP for the casters: Turbo Ether, Ether, then the Elixir (all in the bag, B7 = a).
  const dry = members.find((c) => c.hp > 0 && (c.id === 'yuna' || c.id === 'lulu') && c.mp < 60);
  if (dry) {
    for (const item of ['turbo-ether', 'ether', 'elixir']) {
      if (row(commands, 'item', item)?.validTargets.includes(dry.id)) return { kind: 'item', id: item, targets: [dry.id] };
    }
  }
  const low = members
    .filter((c) => c.hp > 0 && (floorHp !== undefined ? c.hp < floorHp : c.hp < c.stats.maxHp * 0.45))
    .sort((a, b) => a.hp - b.hp)[0];
  if (!low) return null;
  if (actorId === 'yuna') {
    const cure = ability(commands, 'curaga', low.id);
    if (cure) return cure;
  }
  for (const item of ['x-potion', 'hi-potion']) {
    if (row(commands, 'item', item)?.validTargets.includes(low.id)) return { kind: 'item', id: item, targets: [low.id] };
  }
  return null;
}

function choose(line: Line, engine: BattleEngine, actorId: string, commands: readonly AvailableCommand[]): Command {
  const st = engine.state();
  const omnis = st.combatants[OMNIS] as FFXCombatant;
  const phase = st.flags['omnis.state'];
  // Before Ultima every line lifts the party above 4,200 (row 6); the wrong line does not know to.
  const floor = line !== 'wrong' && (phase === 'dispelled' || phase === 'red') ? 4_200 : undefined;
  const care = upkeep(engine, actorId, commands, floor);
  if (care) return care;

  if (actorId === 'tidus' && line !== 'break-brute') {
    const inId = line === 'intended' ? 'wakka' : 'lulu';
    const s = switchTo(commands, inId);
    if (s) return s;
  }

  if (actorId === 'auron') {
    if (line === 'weakness' && omnis.statuses['mental-break'] === undefined) return ability(commands, 'mental-break', OMNIS) ?? hitOmnis(commands);
    if (line !== 'wrong' && omnis.statuses['armor-break'] === undefined) return ability(commands, 'armor-break', OMNIS) ?? hitOmnis(commands);
    return hitOmnis(commands);
  }

  if (actorId === 'wakka') {
    const m = majority(engine);
    if (m.count >= 3) {
      const disc = DISCS[discsOf(engine).indexOf(m.element)];
      if (disc && row(commands, 'attack')?.validTargets.includes(disc)) return { kind: 'attack', targets: [disc] };
    }
    return hitOmnis(commands);
  }

  if (actorId === 'lulu') {
    if (line === 'wrong') return ability(commands, 'firaga', OMNIS) ?? hitOmnis(commands);
    const aff = omnis.affinities;
    const weak = Object.keys(OPPOSITE).find((e) => aff[e as 'fire'] === 'weak');
    const open = weak ?? Object.keys(GA).find((e) => (aff[e as 'fire'] ?? 'normal') === 'normal');
    if (open) {
      const dc = row(commands, 'ability', 'doublecast');
      if (dc) return { kind: 'ability', id: 'doublecast', targets: [OMNIS], wrappedId: GA[open]! };
      return ability(commands, GA[open]!, OMNIS) ?? hitOmnis(commands);
    }
    return hitOmnis(commands);
  }

  if (actorId === 'yuna') {
    if (line === 'intended') {
      const m = majority(engine);
      const nul = NUL[m.element]!;
      const bare = party(engine).some((c) => c.hp > 0 && c.statuses[nul as 'nulblaze'] === undefined);
      if (m.count >= 3 && bare && row(commands, 'ability', nul)) return { kind: 'ability', id: nul, targets: [] };
      const slow = party(engine).find((c) => c.hp > 0 && c.statuses['haste'] === undefined);
      if (slow && row(commands, 'ability', 'hastega')) return { kind: 'ability', id: 'hastega', targets: [] };
    }
    const hurt = party(engine).filter((c) => c.hp > 0 && c.hp < c.stats.maxHp * 0.7).sort((a, b) => a.hp - b.hp)[0];
    if (hurt) return ability(commands, 'curaga', hurt.id) ?? defend;
    return defend;
  }

  return hitOmnis(commands);
}

/** One fight, read back from the event log: the outcome and the boss's key moments. */
interface Outcome {
  outcome: string; turns: number; partyActions: number; omnisTurns: number;
  glows: number; dispels: number; ultimas: number; resets: number; turned: number; ga: number; casts: number;
  firstGlow: number; firstUltima: number; below20k: number; omnisHp: number;
  /** Party-side KOs by what landed them: Ultima, a -ga, a -ra, anything else. */
  ko: Record<KoBy, number>; raises: number; lastBlow: KoBy | 'none';
}
type KoBy = 'ultima' | 'ga' | 'ra' | 'other';
type Moment = 'firstGlow' | 'firstUltima' | 'below20k';

function play(line: Line, seed: number, party: FFXPartyBuild): Outcome {
  const engine = newEngine(seed, party);
  for (let i = 0; i < 8000; i++) {
    const d = engine.nextDecision();
    if (d.kind === 'battle-over') break;
    if (d.kind === 'player-input') engine.submit(choose(line, engine, d.actorId, d.commands));
  }
  const st = engine.state();
  const o: Outcome = {
    outcome: st.result?.outcome ?? 'unfinished', turns: st.turn, partyActions: 0, omnisTurns: 0,
    glows: 0, dispels: 0, ultimas: 0, resets: 0, turned: 0, ga: 0, casts: 0,
    firstGlow: -1, firstUltima: -1, below20k: -1, omnisHp: (st.combatants[OMNIS] as FFXCombatant).hp,
    ko: { ultima: 0, ga: 0, ra: 0, other: 0 }, raises: 0, lastBlow: 'none',
  };
  const foes = new Set<string>([OMNIS, ...DISCS]);
  const maxHp = (st.combatants[OMNIS] as FFXCombatant).stats.maxHp;
  let hp = maxHp;
  let by: KoBy = 'other';
  // The log is in order, so a moment is "his Nth turn" (1-based), counted as the walk goes.
  for (const e of st.log) {
    if (e.type === 'turn-start' && e.actorId === OMNIS) o.omnisTurns++;
    if (e.type === 'action-start') {
      const id = e.abilityId ?? '';
      if (e.actorId === OMNIS) {
        by = id === 'omnis-ultima' ? 'ultima' : /^omnis-(fir|bliz|thund|water)/.test(id) ? (id.endsWith('ga') ? 'ga' : 'ra') : 'other';
        if (by === 'ga' || by === 'ra') o.casts++;
        if (by === 'ga') o.ga++;
        if (id === 'omnis-ultima') {
          o.ultimas++;
          if (o.firstUltima < 0) o.firstUltima = o.omnisTurns;
        }
        if (id === 'omnis-dispel') o.dispels++;
      } else {
        by = 'other';
        if (!foes.has(e.actorId)) o.partyActions++;
      }
    }
    if (e.type === 'message' && e.text === 'Seymour Omnis glows red') {
      o.glows++;
      if (o.firstGlow < 0) o.firstGlow = o.omnisTurns;
    }
    if (e.type === 'affinity-change') {
      if (e.cause === 'part-turn') o.turned++;
      else o.resets++;
    }
    if (e.type === 'damage' && e.targetId === OMNIS) {
      hp = Math.min(maxHp, Math.max(0, hp - e.amount));
      if (hp < 20_000 && o.below20k < 0) o.below20k = o.omnisTurns;
    }
    if (e.type === 'ko' && !foes.has(e.targetId)) {
      o.ko[by]++;
      o.lastBlow = by;
    }
    if (e.type === 'revive') o.raises++;
  }
  return o;
}

type Numeric = Exclude<keyof Outcome, 'outcome' | 'ko' | 'lastBlow'>;

interface Bench {
  wins: number; outcomes: Record<string, number>;
  mean: (k: Numeric, winsOnly?: boolean) => number;
  /** Mean of a moment over the fights that reached it, and how many did. */
  moment: (k: Moment) => { mean: number; reached: number };
  ko: Record<KoBy, number>; lastBlow: Record<string, number>; gaShare: number;
}

function bench(line: Line, party: FFXPartyBuild = gardenOfPainBuild): Bench {
  const runs: Outcome[] = [];
  for (let seed = 1; seed <= SEEDS; seed++) runs.push(play(line, seed, party));
  const outcomes: Record<string, number> = {};
  const lastBlow: Record<string, number> = {};
  const ko: Record<KoBy, number> = { ultima: 0, ga: 0, ra: 0, other: 0 };
  for (const r of runs) {
    outcomes[r.outcome] = (outcomes[r.outcome] ?? 0) + 1;
    if (r.outcome === 'defeat') lastBlow[r.lastBlow] = (lastBlow[r.lastBlow] ?? 0) + 1;
    for (const k of Object.keys(ko) as KoBy[]) ko[k] += r.ko[k] / SEEDS;
  }
  const wins = runs.filter((r) => r.outcome === 'victory');
  const casts = runs.reduce((s, r) => s + r.casts, 0);
  return {
    wins: wins.length, outcomes, ko, lastBlow,
    gaShare: casts > 0 ? runs.reduce((s, r) => s + r.ga, 0) / casts : 0,
    mean: (k, winsOnly = false) => {
      const set = winsOnly ? wins : runs;
      return set.length === 0 ? 0 : set.reduce((s, r) => s + r[k], 0) / set.length;
    },
    moment: (k) => {
      const hit = runs.filter((r) => r[k] >= 0);
      return { mean: hit.length === 0 ? 0 : hit.reduce((s, r) => s + r[k], 0) / hit.length, reached: hit.length };
    },
  };
}

const f1 = (x: number): string => x.toFixed(1);
const f2 = (x: number): string => x.toFixed(2);

describe(`Seymour Omnis — win rates across ${SEEDS} seeds (measured, not tuned)`, () => {
  let results: Record<Line, Bench>;
  let ringless: Bench;
  beforeAll(() => {
    results = Object.fromEntries(LINES.map((l) => [l, bench(l)])) as Record<Line, Bench>;
    ringless = bench('intended', noRing);
    const rows: [string, Bench][] = [...Object.entries(results), ['intended, no ring (B6 = b)', ringless]];
    console.log('| Line | Wins | Outcomes | Battle turns, all (mean) | Battle turns, wins | Party actions | His turns | Omnis HP left (mean) |');
    console.log('|---|---:|---|---:|---:|---:|---:|---:|');
    for (const [name, r] of rows) {
      console.log(
        `| ${name} | ${r.wins}/${SEEDS} | ${JSON.stringify(r.outcomes)} | ${f1(r.mean('turns'))} | ${f1(r.mean('turns', true))} | ` +
          `${f1(r.mean('partyActions'))} | ${f1(r.mean('omnisTurns'))} | ${Math.round(r.mean('omnisHp'))} |`,
      );
    }
    console.log('');
    console.log(
      '| Line | 1st glow: his turn (fights) | 1st Ultima: his turn (fights) | Below 20,000: his turn (fights) | Glows | Dispels | Ultimas | Resets | ' +
        'Disc turns | -ga share | KOs: Ultima / -ga / -ra / other | Raises | Defeats by last blow |',
    );
    console.log('|---|---|---|---|---:|---:|---:|---:|---:|---:|---|---:|---|');
    for (const [name, r] of rows) {
      const m = (k: Moment): string => `${f1(r.moment(k).mean)} (${r.moment(k).reached})`;
      console.log(
        `| ${name} | ${m('firstGlow')} | ${m('firstUltima')} | ${m('below20k')} | ${f2(r.mean('glows'))} | ${f2(r.mean('dispels'))} | ` +
          `${f2(r.mean('ultimas'))} | ${f2(r.mean('resets'))} | ${f2(r.mean('turned'))} | ${(100 * r.gaShare).toFixed(0)} % | ` +
          `${f2(r.ko.ultima)} / ${f2(r.ko.ga)} / ${f2(r.ko.ra)} / ${f2(r.ko.other)} | ${f2(r.mean('raises'))} | ${JSON.stringify(r.lastBlow)} |`,
      );
    }
  }, 900_000);

  it('every battle ends (no runaway loop)', () => {
    for (const r of [...Object.values(results), ringless]) expect(r.outcomes['unfinished'] ?? 0).toBe(0);
  });

  it('the intended line beats the credibly wrong one', () => {
    expect(results.intended.wins).toBeGreaterThan(results.wrong.wins);
  });

  it('only the intended line turns discs, and it cuts his -ga share', () => {
    expect(results.intended.mean('turned')).toBeGreaterThan(0);
    expect(results['break-brute'].mean('turned')).toBe(0);
    expect(results.intended.gaShare).toBeLessThan(results['break-brute'].gaShare);
  });

  it('the key moments happen on the intended line: a glow, Dispel, Ultima and a reset', () => {
    const r = results.intended;
    expect(r.moment('firstGlow').reached).toBe(SEEDS);
    expect(r.mean('dispels')).toBeGreaterThan(0);
    expect(r.moment('firstUltima').reached).toBeGreaterThan(0);
    expect(r.mean('resets')).toBeGreaterThan(0);
  });
});
