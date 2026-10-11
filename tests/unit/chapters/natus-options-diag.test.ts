/**
 * Chapter X diagnosis: where do the losses of the shipped line go now that Natus's Flare is rank 3?
 * (`docs/handoff/re-parity-chx-options.md`, "Diagnosis".) **Game case: FFX only** [AGENTS.md rule 14].
 *
 * Plays the shipped line on the seeds of `PYREFLY_CHX_SEEDS` (default 1 to 12) through the harness's own path and reads the
 * event log of every battle (hard rule 3: prove by running the engine, not by grepping): Flare casts and the gaps between
 * them, who the KOs fall on and by which action, how long the party spends in each of Natus's three phases, what the party's
 * turns are spent on, and how the last turns of a lost battle go. `PYREFLY_CHX_LINE=<id>` reads a candidate line instead of the live one;
 * `PYREFLY_CHX_FLARE_RANK=5` puts the Flare back at the rank our data carried before re-parity W2 (the ablation). Runs only with `PYREFLY_CHX_DIAG=1`; `PYREFLY_CHX_OUT=<file>`
 * writes the per-seed rows as JSON. It asserts nothing about the numbers: **measure, never tune**.
 */

import { writeFileSync } from 'node:fs';
import { describe, it } from 'vitest';
import type { FFXCombatant } from '../../../src/battle/common/types.ts';
import type { NatusLineId } from '../../../src/data/guides/natus-line.ts';
import { MORTIBODY, NATUS, type Played, lineById, playChapterX, seedsFromEnv, shippedLine } from './natus-options-lib.ts';

const ON = process.env['PYREFLY_CHX_DIAG'] === '1';
const OUT = process.env['PYREFLY_CHX_OUT'];
/** Which line to read: `PYREFLY_CHX_LINE` is an id of `NATUS_LINES`; absent = the game's own path (the live line). */
const LINE = process.env['PYREFLY_CHX_LINE'] as NatusLineId | undefined;
const line = LINE ? lineById(LINE) : shippedLine;

interface SeedRow {
  seed: number;
  won: boolean;
  partyTurns: number;
  engineTurns: number;
  flares: number;
  /** Party turns between the first Flare and the end; between each pair of Flares. */
  turnsAfterFirstFlare: number;
  flareGaps: number[];
  /** Ticks between consecutive Flare turns of Natus. */
  flareTicks: number[];
  /** Party turns spent in each phase of Natus's HP (>= 24,000, 12,000 to 24,000, < 12,000). */
  turnsInPhase: [number, number, number];
  koBy: Record<string, number>;
  partyKos: number;
  mortibodyKills: number;
  desperados: number;
  shatters: number;
  breaks: number;
  multis: number;
  claws: number;
  /** Claws that came straight after a Break, with no party turn between (the stone cannot be Softed in time), and after at least one party turn. */
  clawStraight: number;
  clawLate: number;
  cura: number;
  natusHpEnd: number;
  aliveEnd: string[];
  spent: Record<string, number>;
  lastActions: string[];
}

function rowOf(p: Played): SeedRow {
  const koBy: Record<string, number> = {};
  let cur = { actor: '', ability: '' };
  const flareSeqs: number[] = [];
  const spent: Record<string, number> = {};
  const lastActions: string[] = [];
  let desperados = 0;
  let shatters = 0;
  let breaks = 0;
  let multis = 0;
  let claws = 0;
  let clawStraight = 0;
  let clawLate = 0;
  let breakOpen = false;
  let partySince = 0;
  let cura = 0;
  let partyKos = 0;
  let mortibodyKills = 0;
  let flares = 0;
  let cum = 0;
  const flareAt: number[] = [];
  for (const [idx, e] of p.log.entries()) {
    if (e.type === 'turn-start') cum += e.elapsedTicks;
    if (e.type === 'turn-start' && p.final.combatants[e.actorId]?.side === 'party') partySince += 1;
    if (e.type === 'action-start') {
      cur = { actor: e.actorId, ability: e.abilityId ?? e.command.kind };
      lastActions.push(`${e.actorId}:${cur.ability}>${e.targets.join('+')}`);
      if (e.abilityId === 'natus-flare') { flares += 1; flareSeqs.push(idx); flareAt.push(cum); }
      if (e.abilityId === 'mortibody-desperado') desperados += 1;
      if (e.abilityId === 'natus-break') breaks += 1;
      if (e.abilityId?.startsWith('natus-multi')) multis += 1;
      if (e.abilityId === 'mortibody-shattering-claw') {
        claws += 1;
        if (breakOpen) { if (partySince === 0) clawStraight += 1; else clawLate += 1; breakOpen = false; }
      }
      if (e.abilityId === 'natus-break') { breakOpen = true; partySince = 0; }
      if (e.abilityId === 'mortibody-cura') cura += 1;
    } else if (e.type === 'message' && e.text.endsWith(' shatters')) shatters += 1;
    else if (e.type === 'ko') {
      const side = p.final.combatants[e.targetId]?.side;
      if (side === 'party' || side === 'aeon') {
        partyKos += 1;
        const key = `${cur.actor}:${cur.ability}`;
        koBy[key] = (koBy[key] ?? 0) + 1;
      } else if (e.targetId === MORTIBODY) mortibodyKills += 1;
    }
  }
  const turnsInPhase: [number, number, number] = [0, 0, 0];
  for (const pick of p.picks) {
    const slot = pick.natusHp >= 24_000 ? 0 : pick.natusHp >= 12_000 ? 1 : 2;
    turnsInPhase[slot] += 1;
    const label = pick.kind === 'attack' ? `attack>${pick.targets[0] === MORTIBODY ? 'mortibody' : pick.targets[0] === NATUS ? 'natus' : 'other'}` : `${pick.kind}:${pick.id}`;
    spent[label] = (spent[label] ?? 0) + 1;
  }
  const flareGaps: number[] = [];
  // Party turns between consecutive Flares: picks whose log position sits between the two casts.
  for (let i = 1; i < flareSeqs.length; i += 1) {
    flareGaps.push(p.picks.filter((pk) => pk.seq > (flareSeqs[i - 1] as number) && pk.seq <= (flareSeqs[i] as number)).length);
  }
  const first = flareSeqs[0];
  const natus = p.final.combatants[NATUS] as FFXCombatant;
  return {
    seed: p.seed,
    won: p.outcome === 'victory',
    partyTurns: p.partyTurns,
    engineTurns: p.engineTurns,
    flares,
    turnsAfterFirstFlare: first === undefined ? 0 : p.picks.filter((pk) => pk.seq > first).length,
    flareGaps,
    flareTicks: flareAt.slice(1).map((t, i) => t - (flareAt[i] as number)),
    turnsInPhase,
    koBy,
    partyKos,
    mortibodyKills,
    desperados,
    shatters,
    breaks,
    multis,
    claws,
    clawStraight,
    clawLate,
    cura,
    natusHpEnd: natus.hp,
    aliveEnd: Object.values(p.final.combatants).filter((c) => c.side === 'party' && c.hp > 0 && !c.removed).map((c) => c.id),
    spent,
    lastActions: lastActions.slice(-14),
  };
}

interface FlareHit { target: string; hpBefore: number; maxHp: number; amount: number; shell: boolean; killed: boolean; aliveBefore: number }

/** Replays the event log into HP and Shell per party member, and returns every Flare hit with the state it landed on. */
function flareHitsOf(p: Played): FlareHit[] {
  const hp: Record<string, number> = {};
  const max: Record<string, number> = {};
  for (const [id, s] of Object.entries(p.start)) { hp[id] = s.hp; max[id] = s.maxHp; }
  const shell = new Set<string>();
  const active = new Set<string>(p.startActive);
  const hits: FlareHit[] = [];
  let flareOn = false;
  for (const e of p.log) {
    if (e.type === 'action-start') flareOn = e.abilityId === 'natus-flare';
    else if (e.type === 'switch') { active.delete(e.outId); active.add(e.inId); }
    else if (e.type === 'status-add' && e.status === 'shell') shell.add(e.targetId);
    else if (e.type === 'status-remove' && e.status === 'shell') shell.delete(e.targetId);
    else if (e.type === 'heal' && hp[e.targetId] !== undefined) hp[e.targetId] = Math.min(max[e.targetId] as number, (hp[e.targetId] as number) + e.amount);
    else if (e.type === 'revive' && hp[e.targetId] !== undefined) hp[e.targetId] = e.hp;
    else if (e.type === 'ko') { if (hp[e.targetId] !== undefined) hp[e.targetId] = 0; shell.delete(e.targetId); }
    else if (e.type === 'damage' && hp[e.targetId] !== undefined) {
      const before = hp[e.targetId] as number;
      if (flareOn && e.sourceId === NATUS && e.amount > 0) {
        const alive = [...active].filter((id) => (hp[id] ?? 0) > 0).length;
        hits.push({ target: e.targetId, hpBefore: before, maxHp: max[e.targetId] as number, amount: e.amount, shell: shell.has(e.targetId), killed: before - e.amount <= 0, aliveBefore: alive });
      }
      hp[e.targetId] = Math.max(0, Math.min(max[e.targetId] as number, before - e.amount));
    }
  }
  return hits;
}

function flareTable(hits: FlareHit[]): string {
  const row = (label: string, hs: FlareHit[]): string =>
    hs.length === 0 ? `  ${label}: none` : `  ${label}: ${hs.length} hits, mean ${Math.round(hs.reduce((a, h) => a + h.amount, 0) / hs.length)} damage, ${Math.round((100 * hs.filter((h) => h.killed).length) / hs.length)} % kill`;
  const frac = (h: FlareHit): number => h.hpBefore / h.maxHp;
  return [
    row('all', hits),
    row('Shell on', hits.filter((h) => h.shell)),
    row('no Shell', hits.filter((h) => !h.shell)),
    row('Shell on, HP >= 90 %', hits.filter((h) => h.shell && frac(h) >= 0.9)),
    row('no Shell, HP >= 90 %', hits.filter((h) => !h.shell && frac(h) >= 0.9)),
    row('no Shell, HP 60-90 %', hits.filter((h) => !h.shell && frac(h) >= 0.6 && frac(h) < 0.9)),
    row('no Shell, HP < 60 %', hits.filter((h) => !h.shell && frac(h) < 0.6)),
    row('Shell on, HP < 60 %', hits.filter((h) => h.shell && frac(h) < 0.6)),
    ...['tidus', 'auron', 'yuna', 'kimahri', 'wakka', 'lulu', 'rikku'].map((id) => row(id, hits.filter((h) => h.target === id))),
    row('2 or more alive before', hits.filter((h) => h.aliveBefore >= 2)),
    row('only 1 alive before', hits.filter((h) => h.aliveBefore === 1)),
  ].join('\n');
}

interface StoneLife { victim: string; by: string; outcome: 'softed' | 'shattered' | 'ended'; partyTurnsHeld: number; enemyActionsHeld: number; shatterBy: string }

/** The life of every Petrify the party suffers: who put it on, how many party turns and enemy actions it lasted, and how it ended. */
function stonesOf(p: Played): StoneLife[] {
  const open = new Map<string, { by: string; partyTurns: number; enemyActions: number }>();
  const done: StoneLife[] = [];
  let cur = { actor: '', ability: '' };
  for (const e of p.log) {
    if (e.type === 'action-start') {
      cur = { actor: e.actorId, ability: e.abilityId ?? e.command.kind };
      const side = p.final.combatants[e.actorId]?.side;
      for (const st of open.values()) {
        if (side === 'enemy') st.enemyActions += 1;
      }
    } else if (e.type === 'turn-start') {
      const side = p.final.combatants[e.actorId]?.side;
      if (side === 'party') for (const st of open.values()) st.partyTurns += 1;
    } else if (e.type === 'status-add' && e.status === 'petrify' && p.final.combatants[e.targetId]?.side === 'party') {
      open.set(e.targetId, { by: cur.ability, partyTurns: 0, enemyActions: 0 });
    } else if (e.type === 'status-remove' && e.status === 'petrify') {
      const st = open.get(e.targetId);
      if (st) { done.push({ victim: e.targetId, by: st.by, outcome: 'softed', partyTurnsHeld: st.partyTurns, enemyActionsHeld: st.enemyActions, shatterBy: '' }); open.delete(e.targetId); }
    } else if (e.type === 'status-add' && e.status === 'eject' && p.final.combatants[e.targetId]?.side === 'party') {
      const st = open.get(e.targetId);
      if (st) { done.push({ victim: e.targetId, by: st.by, outcome: 'shattered', partyTurnsHeld: st.partyTurns, enemyActions: 0, enemyActionsHeld: st.enemyActions, shatterBy: `${cur.actor}:${cur.ability}` } as StoneLife); open.delete(e.targetId); }
    }
  }
  for (const [victim, st] of open) done.push({ victim, by: st.by, outcome: 'ended', partyTurnsHeld: st.partyTurns, enemyActionsHeld: st.enemyActions, shatterBy: '' });
  return done;
}

function stoneTable(stones: StoneLife[], seeds: number): string {
  const by = (o: StoneLife['outcome']): StoneLife[] => stones.filter((s) => s.outcome === o);
  const hist = (xs: StoneLife[], f: (s: StoneLife) => number): string => {
    const h: Record<string, number> = {};
    for (const x of xs) { const k = Math.min(f(x), 4); h[k === 4 ? '4+' : String(k)] = (h[k === 4 ? '4+' : String(k)] ?? 0) + 1; }
    return JSON.stringify(h);
  };
  const causes: Record<string, number> = {};
  for (const s of by('shattered')) causes[s.shatterBy] = (causes[s.shatterBy] ?? 0) + 1;
  return [
    `  Petrifies: ${stones.length} (${(stones.length / seeds).toFixed(2)} a battle): softed/cured ${by('softed').length}, shattered ${by('shattered').length}, still stone at the end ${by('ended').length}`,
    `  party turns the stone lasted before a Soft: ${hist(by('softed'), (s) => s.partyTurnsHeld)}; before a shatter: ${hist(by('shattered'), (s) => s.partyTurnsHeld)}`,
    `  enemy actions the stone lasted before a Soft: ${hist(by('softed'), (s) => s.enemyActionsHeld)}; before a shatter: ${hist(by('shattered'), (s) => s.enemyActionsHeld)}`,
    `  shattered by: ${JSON.stringify(causes)}`,
  ].join('\n');
}

const mean = (xs: number[]): number => (xs.length === 0 ? 0 : Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 100) / 100);

function summary(label: string, rows: SeedRow[]): string {
  if (rows.length === 0) return `${label}: no seeds`;
  const sum = (f: (r: SeedRow) => number): number => mean(rows.map(f));
  const koTotals: Record<string, number> = {};
  const spentTotals: Record<string, number> = {};
  for (const r of rows) {
    for (const [k, v] of Object.entries(r.koBy)) koTotals[k] = (koTotals[k] ?? 0) + v;
    for (const [k, v] of Object.entries(r.spent)) spentTotals[k] = (spentTotals[k] ?? 0) + v;
  }
  const per = (o: Record<string, number>): string =>
    Object.entries(o).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${(v / rows.length).toFixed(2)}`).join(', ');
  const gaps = rows.flatMap((r) => r.flareGaps);
  return [
    `${label} (${rows.length} seeds)`,
    `  party turns ${sum((r) => r.partyTurns)}, engine turns ${sum((r) => r.engineTurns)}, party KOs ${sum((r) => r.partyKos)}`,
    `  Flares ${sum((r) => r.flares)} (gap in party turns between Flares ${mean(gaps)} over ${gaps.length} gaps), party turns after the first Flare ${sum((r) => r.turnsAfterFirstFlare)}`,
    `  party turns by phase (>=24k / 12-24k / <12k): ${sum((r) => r.turnsInPhase[0])} / ${sum((r) => r.turnsInPhase[1])} / ${sum((r) => r.turnsInPhase[2])}`,
    `  Multi-ra ${sum((r) => r.multis)}, Break ${sum((r) => r.breaks)}, Claw ${sum((r) => r.claws)} (straight after a Break, no party turn between: ${sum((r) => r.clawStraight)}; after a party turn: ${sum((r) => r.clawLate)}), Mortibody Cura ${sum((r) => r.cura)}, Desperado ${sum((r) => r.desperados)}, shatters ${sum((r) => r.shatters)}, Mortibody killed ${sum((r) => r.mortibodyKills)}`,
    `  Natus HP at the end ${sum((r) => r.natusHpEnd)}`,
    `  KOs by actor:action per battle: ${per(koTotals)}`,
    `  party turns by use per battle: ${per(spentTotals)}`,
  ].join('\n');
}

describe.skipIf(!ON)('Chapter X diagnosis: the shipped line on the game-rank Flare (PYREFLY_CHX_DIAG=1)', () => {
  it('reads the event log of every seed and tallies where the battles are won and lost', async () => {
    const rows: SeedRow[] = [];
    const hitsWon: FlareHit[] = [];
    const hitsLost: FlareHit[] = [];
    const stonesWon: StoneLife[] = [];
    const stonesLost: StoneLife[] = [];
    for (const seed of seedsFromEnv()) {
      const p = await playChapterX(seed, line);
      const row = rowOf(p);
      rows.push(row);
      (row.won ? hitsWon : hitsLost).push(...flareHitsOf(p));
      (row.won ? stonesWon : stonesLost).push(...stonesOf(p));
    }
    const wins = rows.filter((r) => r.won);
    const losses = rows.filter((r) => !r.won);
    console.log(['', summary('ALL', rows), summary('WON', wins), summary('LOST', losses)].join('\n'));
    const ticks = rows.flatMap((r) => r.flareTicks);
    console.log(`Ticks between consecutive Flares of Natus: mean ${mean(ticks)} over ${ticks.length} gaps (min ${Math.min(...ticks)}, max ${Math.max(...ticks)})`);
    const phase = (r: SeedRow): string => (r.natusHpEnd >= 24_000 ? 'phase 1 (>= 24k)' : r.natusHpEnd >= 12_000 ? 'phase 2 (12-24k)' : 'phase 3 (< 12k)');
    const cross: Record<string, number> = {};
    for (const r of losses) {
      const key = `${phase(r)} / ${r.shatters > 0 ? 'with a shatter' : 'no shatter'}`;
      cross[key] = (cross[key] ?? 0) + 1;
    }
    console.log('Losses by the phase Natus was in when the party fell, and whether a guardian had been shattered:', JSON.stringify(cross));
    console.log(['', 'FLARE HITS (won)', flareTable(hitsWon), 'FLARE HITS (lost)', flareTable(hitsLost)].join('\n'));
    console.log(['', 'STONES (won)', stoneTable(stonesWon, wins.length), 'STONES (lost)', stoneTable(stonesLost, losses.length)].join('\n'));
    // How the last turns of a few lost battles go (the log tail, oldest first).
    for (const r of losses.slice(0, 6)) console.log(`seed ${r.seed} lost, alive at the end ${r.aliveEnd.join(',') || '-'}, Natus ${r.natusHpEnd}: ${r.lastActions.join(' | ')}`);
    if (OUT) writeFileSync(OUT, JSON.stringify(rows, null, 2));
  }, 3_600_000);
});
