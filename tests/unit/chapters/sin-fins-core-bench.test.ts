/**
 * **Chapter XVII, Sin: the Fins and the Core — the bench** (`sin-fins-core`, links 1 to 3, FFX only).
 * Package B of `docs/plans/sin-two-chapters-plan.md` §5 and REVIEW 13. The method is
 * `docs/plans/sin-link4-bench.md`'s: the real FFX engine and the chapter's own data, seeds 1 to 200 per line,
 * first try, human pace equals bench speed (CTB moves only on turns). **Measure, never tune**: this pins only
 * that every battle ends, that the switches do what they say, and that the advisor harness agrees with
 * `critic/bench/advisor-v3/drive.ts`. No target rate is pinned.
 *
 * Three lines (`../helpers/sinFinsPolicies.ts`, the card below): sensible (research §8 rows 1 to 4, 6, 9),
 * naive (Attack what reaches, Defend otherwise) and the advisor card's top row, played the way the
 * scorecard plays it. Per link (a rested start on each) and for the chain (links 1 to 3 on the carried state).
 * Switches, both ways: S-8 (FAR or NEAR open), S-12 (Negation on or off), the seam line-up (REVIEW 6), and the
 * sensible line's three sensitivities (the Core first, REVIEW row 6; a top-up before the Core acts; a careful rest at FAR before each Fin's last blow).
 *
 * **The full 200-seed tables are gated**: `PYREFLY_SIN_BENCH=1 npx vitest run tests/unit/chapters/sin-fins-core-bench.test.ts`.
 * Without the variable only a small smoke set runs, so `npm test` stays fast.
 */

import { appendFileSync } from 'node:fs';
import { beforeAll, describe, expect, it } from 'vitest';
import type { BattleEngine, Command } from '../../../src/battle/common/types.ts';
import { getChapter } from '../../../src/data/encounters.ts';
import { buildAdvisorView } from '../../../src/engine/tactics/advisor.ts';
import { registerBattleContent } from '../../../src/app/screens/BattleScreenContent.ts';
import { liveAdvisorOptions, runChapter } from '../../../critic/bench/advisor-v3/drive.ts';
import type { BattleSetup, FFXPartyBuild } from '../../../src/battle/common/types.ts';
import { type ChainReading, type Input, type Line, type LinkNo, type RunOpts, addLink, aggLink, chainRow, emptyAgg, fmtCauses, per, pct, runChain, runWithRetries, sweep } from '../helpers/sinFinsBench.ts';
import { makeNaive, makeSensible } from '../helpers/sinFinsPolicies.ts';

const FULL = process.env['PYREFLY_SIN_BENCH'] === '1';
/** `PYREFLY_SIN_BENCH_OUT=<file>` appends every table row there as it is measured (vitest holds console output until a test ends). */
const OUT_FILE = process.env['PYREFLY_SIN_BENCH_OUT'];
const tee = (s: string): void => { if (OUT_FILE) appendFileSync(OUT_FILE, `${s}\n`); };
const SEEDS = FULL ? 200 : 4;
const SMOKE = 4;
const KNOWN = ['victory', 'defeat', 'escape'];

/** The advisor card's top row, as the scorecard presses it (`critic/bench/advisor-v3/scorecard.test.ts#cardDriver`). */
function makeCard(): Line {
  const options = liveAdvisorOptions('ffx');
  return (e: BattleEngine, d: Input): Command | null =>
    buildAdvisorView(e.state(), { actorId: d.actorId, commands: d.commands }, options)?.suggestions[0]?.command ?? null;
}

const LINES: Array<[string, () => Line]> = [
  ['sensible', () => makeSensible()],
  ['naive', () => makeNaive()],
  ['advisor card', () => makeCard()],
];

beforeAll(async () => {
  // The advisor reads the process-wide content the running game registers (`drive.ts#engineFor` does the same).
  await registerBattleContent();
});

describe(`Chapter XVII bench smoke (${SMOKE} seeds; the full tables are behind PYREFLY_SIN_BENCH=1)`, () => {
  it('every line ends every chain in a victory, a defeat or the 400-turn stalemate', () => {
    for (const [name, make] of LINES) {
      for (const r of sweep(make, {}, SMOKE)) {
        expect(KNOWN, `${name} seed ${r.seed}`).toContain(r.outcome);
        for (const l of r.links) expect(KNOWN, `${name} seed ${r.seed} link ${l.link}`).toContain(l.outcome);
      }
    }
  });

  it('the switches do what they say: S-8 opens NEAR, S-12 off means no Negation, the seam reads both ways', () => {
    const openings = (o: { range?: 'far' | 'near' }): unknown[] => {
      const seen: unknown[] = [];
      const base = makeSensible();
      runChain((e, d, link) => { if (seen.length === 0) seen.push(e.state().flags['airship.range']); return base(e, d, link); }, { seed: 1, stopAfter: 1, ...o });
      return seen;
    };
    expect(openings({})).toEqual(['far']);
    expect(openings({ range: 'near' })).toEqual(['near']);

    for (const seed of [1, 2, 3]) {
      const on = runChain(makeSensible(), { seed });
      const off = runChain(makeSensible(), { seed, negationOff: true });
      expect(off.links.reduce((s, l) => s + l.negations, 0), `seed ${seed}`).toBe(0);
      expect(on.links.reduce((s, l) => s + l.negations, 0), `seed ${seed}`).toBeGreaterThan(0);
    }

    // REVIEW 6: link 2 opens with the build's Tidus, Yuna, Auron, or with the row link 1 ended in.
    for (const seam of ['build', 'front'] as const) {
      let last: string[] = [];
      const starts: Array<{ link: LinkNo; row: string[]; before: string[] }> = [];
      const base = makeSensible();
      runChain((e, d, link) => {
        const row = [...e.state().activeIds];
        if (!starts.some((s) => s.link === link)) starts.push({ link, row, before: last });
        last = row;
        return base(e, d, link);
      }, { seed: 2, seam });
      const two = starts.find((s) => s.link === 2);
      expect(two, seam).toBeTruthy();
      expect(two!.row, seam).toEqual(seam === 'build' ? ['tidus', 'yuna', 'auron'] : two!.before);
    }
  });

  it('the sensible line never leaves a dry Auron Defending: short of the 12 MP a Break costs he drinks an Ether (the carried seam)', () => {
    // The link-3 cause (2026-09-29): links 1 and 2 leave Auron at 4 to 16 MP of 100 with Turbo Ethers in the bag;
    // the line used to Defend him for the rest of link 3, so the Core went unbroken, or Auron idle, on a carried party.
    let total = 0;
    for (const seed of [1, 2, 3, 4]) {
      const base = makeSensible();
      let dryDefends = 0;
      let drinks = 0;
      runChain((e, d, link) => {
        const cmd = base(e, d, link);
        const st = e.state();
        const me = st.combatants[d.actorId] as { mp: number } | undefined;
        const core = st.combatants['sin-core'] as { hp: number; statuses: Record<string, unknown> } | undefined;
        const genais = st.combatants['sinspawn-genais'] as { hp: number } | undefined;
        const bag = d.commands.some((c) => c.enabled && c.command.kind === 'item' && 'id' in c.command && ['ether', 'turbo-ether', 'elixir'].includes(c.command.id));
        if (link === 3 && d.actorId === 'auron' && me && me.mp < 12 && bag && core && core.hp > 0 && (genais?.hp ?? 0) <= 0 && (core.statuses['armor-break'] === undefined || core.statuses['mental-break'] === undefined)) {
          if (cmd?.kind === 'defend') dryDefends++;
          if (cmd?.kind === 'item') drinks++;
        }
        return cmd;
      }, { seed });
      expect(dryDefends, `seed ${seed}`).toBe(0);
      total += drinks;
    }
    expect(total).toBeGreaterThan(0);
  });

  it('the advisor line agrees with critic/bench/advisor-v3/drive.ts (same decisions and links cleared)', async () => {
    for (const seed of [1, 2]) {
      const mine = runChain(makeCard(), { seed });
      const options = liveAdvisorOptions('ffx');
      const theirs = await runChapter(getChapter('sin-fins-core')!, seed, (ctx) =>
        buildAdvisorView(ctx.state, { actorId: ctx.decision.actorId, commands: ctx.decision.commands }, options)?.suggestions[0]?.command ?? null);
      expect(mine.cleared, `seed ${seed}`).toBe(theirs.linksCleared);
      expect(mine.links.reduce((s, l) => s + l.actions, 0), `seed ${seed}`).toBe(theirs.decisions);
    }
  });
});

/** Each aeon summoned by Yuna on a Fin: which of its rows reach the Fin (REVIEW 13), FAR and NEAR, gauge full on its first turn. */
function aeonReach(aeon: string, link: 1 | 2, range: 'far' | 'near', fill: boolean, seeds: number): string {
  const kinds: Record<string, number> = {};
  const offered: Record<string, number> = {};
  let decisions = 0;
  let summoned = 0;
  let won = 0;
  for (let seed = 1; seed <= seeds; seed++) {
    let done = false;
    let filled = false;
    const r = runChain((e, d) => {
      const st = e.state();
      const me = st.combatants[d.actorId] as { side: string; overdrive?: { gauge: number } } | undefined;
      const fin = st.enemyIds.find((id) => id === 'left-fin' || id === 'right-fin')!;
      if (me?.side === 'aeon') {
        // The preset's aeon gauges are 50 to 70, so the Overdrive row is not offered at all unless the bench fills the gauge once.
        if (fill && !filled && me.overdrive) { me.overdrive.gauge = 100; filled = true; return { kind: 'defend', targets: [] }; }
        decisions++;
        for (const c of d.commands) if (['attack', 'ability', 'overdrive'].includes(c.command.kind)) {
          offered[c.command.kind] = (offered[c.command.kind] ?? 0) + 1;
          if (c.enabled && c.validTargets.includes(fin)) kinds[c.command.kind] = (kinds[c.command.kind] ?? 0) + 1;
        }
        const hit = d.commands.find((c) => c.enabled && ['overdrive', 'attack', 'ability'].includes(c.command.kind) && c.validTargets.includes(fin));
        return hit ? ({ ...hit.command, targets: [fin] } as Command) : { kind: 'defend', targets: [] };
      }
      if (d.actorId === 'yuna' && !st.aeonId && !done) {
        const sm = d.commands.find((c) => c.enabled && c.command.kind === 'summon' && c.command.id === aeon);
        if (sm) { done = true; summoned++; return sm.command; }
      }
      return { kind: 'defend', targets: [] };
    }, { seed, startLink: link, stopAfter: link, range });
    if (r.outcome === 'victory') won++;
  }
  const fmt = (r: Record<string, number>): string => Object.entries(r).map(([k, v]) => `${k} ${v}`).join(', ') || 'none';
  return `| ${aeon} | ${range.toUpperCase()} | ${fill ? 'filled once' : 'preset'} | ${summoned}/${seeds} | ${won}/${seeds} | ${decisions} | ${fmt(offered)} | ${fmt(kinds)} |`;
}

/** Sweeps are cached by line, switches and seeds, so a row printed twice is measured once. */
const cache = new Map<string, ChainReading[]>();
function runs(name: string, make: () => Line, o: Omit<RunOpts, 'seed'> = {}, seeds = SEEDS): ChainReading[] {
  const key = `${name}|${JSON.stringify(o)}|${seeds}`;
  let r = cache.get(key);
  if (!r) { r = sweep(make, o, seeds); cache.set(key, r); }
  return r;
}

describe('Chapter XVII bench (200 seeds per line; measured, not tuned)', () => {
  it.skipIf(!FULL)('prints the tables', () => {
    const out: string[] = [];
    const push = (s = ''): void => { out.push(s); tee(s); };
    const seeded = LINES.filter(([n]) => n !== 'naive');

    // ---- 1. Per link, a rested start on each ----
    push('## 1. Per link (a rested start on each link, first try)');
    push('| Line | Link | Wins | Losses by cause | Mean turns | Mean party actions | Negation / fight | Gravija / fight (whiffs at FAR) | Genais shells / fight | Wins with Genais standing |');
    push('|---|---|---:|---|---:|---:|---:|---|---:|---:|');
    for (const [name, make] of LINES) {
      for (const link of [1, 2, 3] as LinkNo[]) {
        const a = aggLink(runs(name, make, { startLink: link, stopAfter: link }), link);
        push(`| ${name} | ${link} | ${pct(a.wins, a.n)} | ${fmtCauses(a.causes)} | ${per(a.turns, a.n)} | ${per(a.actions, a.n)} | ${per(a.negations, a.n)} | ${per(a.gravijas, a.n)} (${per(a.whiffs, a.n)}) | ${link === 3 ? per(a.shells, a.n) : '-'} | ${link === 3 ? a.winWithGenais : '-'} |`);
      }
    }

    // ---- 2. The chain, and every switch both ways ----
    push('\n## 2. The chain (links 1 to 3 on the carried state) and the switches, both ways');
    push('| Line / switch | Chains won | Wins per link (of those that reached it) | Chains lost by cause | Mean turns per chain | Into link 3 |');
    push('|---|---:|---|---|---:|---|');
    const scenarios: Array<[string, string, string, () => Line, Omit<RunOpts, 'seed'>]> = [];
    for (const [name, make] of LINES) {
      scenarios.push([name, name, 'as built (FAR open, Negation on, build line-up)', make, {}]);
      if (name === 'naive') continue;
      scenarios.push([name, name, 'S-8 NEAR open', make, { range: 'near' }]);
      scenarios.push([name, name, 'S-12 Negation OFF (a bound)', make, { negationOff: true }]);
      scenarios.push([name, name, 'seam: front row carries (REVIEW 6)', make, { seam: 'front' }]);
    }
    scenarios.push(['sensible', 'sensible-core-first', 'the Core first (row 6)', () => makeSensible({ coreFirst: true }), {}]);
    scenarios.push(['sensible', 'sensible-topup', 'top-up heals (a sensitivity)', () => makeSensible({ topUp: true }), {}]);
    scenarios.push(['sensible', 'sensible-recover', "careful: rests at FAR before each Fin's last blow (a sensitivity)", () => makeSensible({ recover: true }), {}]);
    scenarios.push(['sensible', 'sensible', 'S-12 OFF and S-8 NEAR together', () => makeSensible(), { negationOff: true, range: 'near' }]);
    for (const [label, key, what, make, o] of scenarios) push(`| ${label}: ${what} | ${chainRow(runs(key, make, o))} |`);

    // ---- 3. Length against Chapter III's first link (about 195 turns) ----
    push('\n## 3. Length');
    push("Chapter III's first link is about 195 engine turns (`docs/plans/sin-link4-bench.md`); every figure here is engine turns (every actor).");
    for (const [name, make] of seeded) {
      const r = runs(name, make);
      const m = (k: LinkNo): string => { const a = aggLink(r, k); return per(a.turns, a.n, 0); };
      push(`- ${name}: link 1 ${m(1)}, link 2 ${m(2)}, link 3 ${m(3)} turns (chain attempts that reached each).`);
    }

    // ---- 4. Per-link switches (sensible and advisor) ----
    push('\n## 4. Per-link switches (a rested start on each link)');
    push('| Line | Switch | Link 1 | Link 2 | Link 3 |');
    push('|---|---|---:|---:|---:|');
    for (const [name, make] of seeded) {
      for (const [what, o] of [['as built', {}], ['S-8 NEAR', { range: 'near' as const }], ['S-12 OFF', { negationOff: true }]] as const) {
        const cells = ([1, 2, 3] as LinkNo[]).map((k) => {
          if ('range' in o && k === 3) return 'n/a (no Fin)';
          const a = aggLink(runs(name, make, { ...o, startLink: k, stopAfter: k }), k);
          return pct(a.wins, a.n);
        });
        push(`| ${name} | ${what} | ${cells.join(' | ')} |`);
      }
    }

    // ---- 4b. The Core's unsourced tunables (REVIEW 8), link 3 rested ----
    push("\n## 4b. The Core's counter tunables (S-13, REVIEW 8), link 3 with a rested start");
    push('| Line | Switch | Link 3 wins | Losses by cause |');
    push('|---|---|---:|---|');
    for (const [name, make] of seeded) {
      for (const [what, flags] of [
        ['as built (counter 100 % before and after Genais dies; an absorbed spell draws it)', {}],
        ['counter chance before Genais dies 50 %', { 'sin.core.counterChanceBefore': 0.5 }],
        ['an absorbed spell draws no counter', { 'sin.core.absorbedDrawsCounter': false }],
      ] as const) {
        const a = aggLink(runs(name, make, { startLink: 3, stopAfter: 3, flags }), 3);
        push(`| ${name} | ${what} | ${pct(a.wins, a.n)} | ${fmtCauses(a.causes)} |`);
      }
    }

    // ---- 5. Aeons at FAR (REVIEW 13) ----
    push('\n## 5. Aeon reach at FAR (link 1; Yuna summons the aeon on her first turn and the rest of the party defends; NEAR for contrast)');
    push('| Aeon | Ship | Aeon gauge | Summoned | Links won | Aeon decisions | Attack / ability / Overdrive rows offered | ...of them enabled AND reaching the Fin |');
    push('|---|---|---|---:|---:|---:|---|---|');
    for (const aeon of ['valefor', 'ifrit', 'ixion', 'shiva', 'bahamut'])
      for (const range of ['far', 'near'] as const) for (const fill of [false, true]) push(aeonReach(aeon, 1, range, fill, Math.min(SEEDS, 5)));
    const all = emptyAgg();
    for (const r of cache.values()) for (const c of r) for (const l of c.links) addLink(all, l);
    push(`\nAeon decisions at FAR across every sweep above: ${all.aeonFarDecisions} (${all.aeonFarReach} with a row that reaches); summons at FAR ${all.summonsAtFar} of ${all.summons}.`);

    // eslint-disable-next-line no-console
    console.log(`\n${out.join('\n')}\n`);
    expect(out.length).toBeGreaterThan(10);
  }, 3_600_000);
});

/** One factor of the link-3 entry state set back to the rested build's, the rest left as carried. */
type Refill = (carried: FFXPartyBuild, rested: FFXPartyBuild) => FFXPartyBuild;
const byId = <T extends { id: string }>(xs: readonly T[], id: string): T => xs.find((x) => x.id === id)!;
const bag = (ids: string[]): Refill => (p, r) => ({ ...p, inventory: p.inventory.map((e) => (ids.includes(e.itemId) ? { ...byId(r.inventory.map((x) => ({ ...x, id: x.itemId })), e.itemId) } : e)) });
const REFILLS: Array<[string, Refill]> = [
  ['carried as is', (p) => p],
  ['HP refilled', (p, r) => ({ ...p, members: p.members.map((m) => ({ ...m, hp: byId(r.members, m.id).hp })) })],
  ['MP refilled', (p, r) => ({ ...p, members: p.members.map((m) => ({ ...m, mp: byId(r.members, m.id).mp })) })],
  ['statuses as rested', (p, r) => ({ ...p, members: p.members.map((m) => { const { statuses: _s, ...rest } = m; const was = byId(r.members, m.id).statuses; return was ? { ...rest, statuses: structuredClone(was) } : rest; }) })],
  ['Overdrive gauges as rested', (p, r) => ({ ...p, members: p.members.map((m) => ({ ...m, overdrive: { ...m.overdrive, gauge: byId(r.members, m.id).overdrive.gauge } })) })],
  ['aeons as rested', (p, r) => ({ ...p, aeons: r.aeons.map((a) => structuredClone(a)) })],
  ['items refilled', (p, r) => ({ ...p, inventory: r.inventory.map((e) => ({ ...e })) })],
  ['X-Potions refilled', bag(['x-potion'])],
  ['Ethers refilled', bag(['ether', 'turbo-ether'])],
  ['items and MP refilled', (p, r) => ({ ...p, inventory: r.inventory.map((e) => ({ ...e })), members: p.members.map((m) => ({ ...m, mp: byId(r.members, m.id).mp })) })],
  ['the rested build (all of it)', (_p, r) => r],
];

/**
 * Keep the dynamic SOS status (`critical`, HP under half) in step with a refilled HP, as a real carry always is: the
 * engine re-derives it in `buildBattle`, and that re-derivation emits an event a fresh engine has no log for yet.
 */
function sosConsistent(p: FFXPartyBuild): FFXPartyBuild {
  return { ...p, members: p.members.map((m) => {
    const statuses = { ...(m.statuses ?? {}) };
    if (m.hp > 0 && m.hp * 2 < m.stats.maxHp) statuses.critical ??= { id: 'critical', turnsRemaining: null, ticksRemaining: null, charges: null, stacks: 0, permanent: false };
    else delete statuses.critical;
    return { ...m, statuses };
  }) };
}

describe('Chapter XVII bench: the link-3 seam and retries (measured, not tuned)', () => {
  it.skipIf(!FULL)('prints the seam A/B and the retry tables', () => {
    const out: string[] = [];
    const push = (s = ''): void => { out.push(s); tee(s); };
    const rested = getChapter('sin-fins-core')!.buildRef as FFXPartyBuild;

    // ---- 6. The link-3 seam, one factor at a time (sensible line) ----
    push('## 6. Link 3, rested against carried: one factor of the entry state at a time (sensible line)');
    push('Each row replays link 3 on the setup the chain entered it on (same seed, `seed + 2`), with one factor set back to the rested build.');
    push('| Link-3 entry | Link 3 wins | Losses by cause |');
    push('|---|---:|---|');
    const entries: BattleSetup[] = [];
    for (let seed = 1; seed <= SEEDS; seed++) { const at = runChain(makeSensible(), { seed }).link3Entry; if (at) entries.push(at); }
    for (const [what, refill] of REFILLS) {
      const agg = emptyAgg();
      for (const entry of entries) {
        const party = sosConsistent(refill(structuredClone(entry.party as FFXPartyBuild), rested));
        addLink(agg, runChain(makeSensible(), { seed: entry.seed, startLink: 3, entry: { ...entry, party } }).links[0]!);
      }
      push(`| ${what} | ${pct(agg.wins, agg.n)} | ${fmtCauses(agg.causes)} |`);
    }

    // ---- 7. Retries, the link-3 checkpoint off and ON (SIN_LINK3_CHECKPOINT, an adaptation; ON as shipped since D-284) ----
    push('\n## 7. Retries: wins within 1, 3 and 5 attempts, the link-3 checkpoint off and on (on as shipped since D-284)');
    push('| Line | Checkpoint | Within 1 | Within 3 | Within 5 | Mean engine turns to a win (winners) | Link 3 retries that won / tried |');
    push('|---|---|---:|---:|---:|---:|---:|');
    for (const [name, make] of LINES.filter(([n]) => n !== 'naive')) {
      for (const on of [false, true]) {
        const rs = Array.from({ length: SEEDS }, (_, i) => runWithRetries(make, {}, i + 1, 5, on));
        const within = (k: number): string => pct(rs.filter((r) => r.wonOn !== null && r.wonOn <= k).length, rs.length);
        const winners = rs.filter((r) => r.wonOn !== null);
        const l3 = rs.flatMap((r) => r.attempts.filter((a) => a.from === 3));
        push(`| ${name} | ${on ? 'ON' : 'off'} | ${within(1)} | ${within(3)} | ${within(5)} | ${per(winners.reduce((t, r) => t + r.turns, 0), winners.length, 0)} | ${on ? `${l3.filter((a) => a.outcome === 'victory').length} / ${l3.length}` : '-'} |`);
      }
    }
    expect(out.length).toBeGreaterThan(10);
  }, 3_600_000);
});
