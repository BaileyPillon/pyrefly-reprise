/**
 * FF7 Guard Scorpion bench: the canon party against the boss over many seeds,
 * one headless battle per seed and policy (`src/battle/ff7/simulate.ts`).
 *
 *   node tools/ff7-bench.mjs                # 200 seeds, prints the tables
 *   node tools/ff7-bench.mjs --seeds=50
 *
 * Runs the TypeScript sources directly (Node 24 strips the types). Pure numbers
 * out; the write-up with the method is docs/plans/ff7-engine-bench.md. Game
 * case: FF7 only. Never tune a number to move these results (AGENTS.md rule 6).
 */
import { FF7_POLICIES, runFf7Battle, summarizeFf7Run, TICKS_PER_SECOND } from '../src/battle/ff7/index.ts';
import { ff7Registry, guardScorpionGroup, sector1ReactorBuild } from '../src/data/ff7/index.ts';

const arg = process.argv.find((a) => a.startsWith('--seeds='));
const SEEDS = arg ? Number(arg.slice('--seeds='.length)) : 200;
const reg = ff7Registry();
const setup = (seed) => ({ game: 'ff7', party: sector1ReactorBuild, enemies: guardScorpionGroup, triggers: [], seed, condition: 'normal', canEscape: false });

const pct = (n, d) => `${((100 * n) / d).toFixed(1)}%`;
const mean = (xs) => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : 0);
const median = (xs) => {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
const span = (xs) => (xs.length ? `${Math.min(...xs)} to ${Math.max(...xs)}` : 'n/a');

/** The timed player model (our numbers, not FF7's): each action animates 1.5 s; a menu stays 0.5 s at the top list, then 1.5 s in a sub-menu or targeting. */
const TIMED = { animationMs: 1500, menuMs: { top: 500, deep: 1500 } };

function bench(policyName, mode, timed = false) {
  const rows = [];
  for (let seed = 1; seed <= SEEDS; seed++) {
    const run = runFf7Battle({ setup: setup(seed), registry: reg, policy: FF7_POLICIES[policyName], atbMode: mode, ...(timed ? TIMED : {}) });
    const s = summarizeFf7Run(run);
    const cloud = run.state.combatants.cloud;
    const barret = run.state.combatants.barret;
    rows.push({ ...s, hpLeft: (cloud.alive ? cloud.hp : 0) + (barret.alive ? barret.hp : 0), bossShare: s.bossTurns / Math.max(1, s.turns) });
  }
  return rows;
}

const policies = ['sensible', 'naive', 'literal-hint'];
console.log(`seeds 1 to ${SEEDS}, Recommended mode, zero decision time\n`);
console.log('| Policy | Wins | Battle turns (median, range) | Party turns (median) | Time (median ticks, ~s at 30/s) | Attacks into the raised tail (mean per battle; battles with any) | Tail Laser damage taken (mean) | Limits used (mean) | Party KOs (mean) | Party HP left on a win (mean) |');
console.log('|---|---|---|---|---|---|---|---|---|---|');
const byPolicy = {};
for (const p of policies) {
  const rows = bench(p, 'recommended');
  byPolicy[p] = rows;
  const wins = rows.filter((r) => r.outcome === 'victory');
  const t = rows.map((r) => r.turns);
  const ticks = median(rows.map((r) => r.ticks));
  console.log(
    `| ${p} | ${wins.length}/${rows.length} (${pct(wins.length, rows.length)}) | ${median(t)} (${span(t)}) | ${median(rows.map((r) => r.partyTurns))} | ${ticks} (~${Math.round(ticks / TICKS_PER_SECOND)} s) | ${mean(rows.map((r) => r.tailLasers)).toFixed(2)}; ${rows.filter((r) => r.tailLasers > 0).length}/${rows.length} | ${mean(rows.map((r) => r.tailLaserDamage)).toFixed(0)} | ${mean(rows.map((r) => r.limitsUsed)).toFixed(2)} | ${mean(rows.map((r) => r.kos)).toFixed(2)} | ${wins.length ? mean(wins.map((r) => r.hpLeft)).toFixed(0) : 'n/a'} |`,
  );
}

console.log('\nThe same seeds in the other two modes (outcomes and turns should match Recommended at zero decision time):\n');
console.log('| Policy | Mode | Wins | Same outcome and turns as Recommended |');
console.log('|---|---|---|---|');
for (const p of policies) {
  for (const mode of ['active', 'wait']) {
    const rows = bench(p, mode);
    const same = rows.filter((r, i) => r.outcome === byPolicy[p][i].outcome && r.turns === byPolicy[p][i].turns).length;
    console.log(`| ${p} | ${mode} | ${rows.filter((r) => r.outcome === 'victory').length}/${rows.length} | ${same}/${rows.length} |`);
  }
}

console.log('\nTimed player model (our numbers: 1.5 s per action animation, menus 0.5 s at the top list then 1.5 s in a sub-menu), all three modes:\n');
console.log('| Policy | Mode | Wins | Battle turns (median) | Boss share of turns (mean) | Attacks into the raised tail (mean) | Party KOs (mean) | Time (median ticks, ~s) |');
console.log('|---|---|---|---|---|---|---|---|');
for (const p of policies) {
  for (const mode of ['active', 'recommended', 'wait']) {
    const rows = bench(p, mode, true);
    const ticks = median(rows.map((r) => r.ticks));
    console.log(
      `| ${p} | ${mode} | ${rows.filter((r) => r.outcome === 'victory').length}/${rows.length} | ${median(rows.map((r) => r.turns))} | ${mean(rows.map((r) => r.bossShare)).toFixed(3)} | ${mean(rows.map((r) => r.tailLasers)).toFixed(2)} | ${mean(rows.map((r) => r.kos)).toFixed(2)} | ${ticks} (~${Math.round(ticks / TICKS_PER_SECOND)} s) |`,
    );
  }
}

// How the naive player dies: HP at the first Raise Tail, and the lasers after it.
const naive = [];
for (let seed = 1; seed <= SEEDS; seed++) {
  const run = runFf7Battle({ setup: setup(seed), registry: reg, policy: FF7_POLICIES.naive });
  let bossHp = 800;
  let atRaise = null;
  let firstLaserCycle = 0;
  let raised = false;
  for (const e of run.log) {
    if (e.type === 'damage' && e.targetId === 'guard-scorpion' && e.amount > 0) bossHp -= e.amount;
    if (e.type === 'form-change' && e.formIndex === 1 && !raised) {
      raised = true;
      atRaise = Math.max(0, bossHp);
    }
    if (e.type === 'form-change' && e.formIndex === 0 && raised) break;
    if (e.type === 'counter' && e.abilityId === 'tail-laser') firstLaserCycle++;
  }
  naive.push({ atRaise, firstLaserCycle, outcome: run.result.outcome });
}
const died = naive.filter((r) => r.outcome === 'defeat');
console.log(`\nNaive: boss HP when the tail first rises, median ${median(naive.map((r) => r.atRaise ?? 0))} (${span(naive.map((r) => r.atRaise ?? 0))}); Tail Lasers during the first raised tail, median ${median(naive.map((r) => r.firstLaserCycle))}; defeats ${died.length}/${naive.length}.`);
