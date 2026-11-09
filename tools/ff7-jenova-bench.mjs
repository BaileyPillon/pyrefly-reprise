/**
 * FF7 Jenova LIFE bench (hidden chapter 44): the Cloud, Tifa and Barret preset against Jenova LIFE over many seeds,
 * one headless battle per seed and policy (`src/battle/ff7/simulate.ts`, `policies-jenova.ts`).
 *
 *   node tools/ff7-jenova-bench.mjs                  # 200 seeds, prints the tables
 *   node tools/ff7-jenova-bench.mjs --seeds=100
 *   node tools/ff7-jenova-bench.mjs --json           # also prints one JSON line of the numbers
 *
 * Runs the TypeScript sources directly (Node 24 strips the types). Pure numbers out; the write-up with the method and
 * the pre-registered bands is docs/plans/ch-jenova-life-review.md section 8 and docs/handoff/ch-jenova-life.md. Game
 * case: FF7 only. **Never tune a number to move these results** (AGENTS.md rule 6; the levers, in order, are the
 * party's stock, Materia and level, never hers).
 */
import {
  attackOnlyPolicy, distractedPolicy, jenovaSensiblePolicy, runFf7Battle, sensibleQuakePolicy, spamMagicPolicy, summarizeJenovaRun, TICKS_PER_SECOND,
} from '../src/battle/ff7/index.ts';
import { forgottenCapitalBuild, ff7Registry, jenovaLifeGroup } from '../src/data/ff7/index.ts';

const arg = process.argv.find((a) => a.startsWith('--seeds='));
const SEEDS = arg ? Number(arg.slice('--seeds='.length)) : 200;
const reg = ff7Registry();
const setup = (seed) => ({ game: 'ff7', party: forgottenCapitalBuild, enemies: jenovaLifeGroup, triggers: [], seed, condition: 'normal', canEscape: false });

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

const POLICIES = {
  sensible: () => jenovaSensiblePolicy,
  'sensible+quake': () => sensibleQuakePolicy,
  distracted: (seed) => distractedPolicy(seed),
  'attack-only': () => attackOnlyPolicy,
  'spam-magic': () => spamMagicPolicy,
};

function bench(name, mode, timed = false) {
  const rows = [];
  for (let seed = 1; seed <= SEEDS; seed++) {
    const run = runFf7Battle({ setup: setup(seed), registry: reg, policy: POLICIES[name](seed), atbMode: mode, ...(timed ? TIMED : {}) });
    rows.push(summarizeJenovaRun(run));
  }
  return rows;
}

const out = {};
console.log(`seeds 1 to ${SEEDS}, Recommended mode, zero decision time\n`);
console.log('| Policy | Wins | Time of a win (median ticks, ~s at 30/s; range s) | Jenova turns (median) | Aqualungs (mean) | Double Blue Lights (mean) | Reflect cast | Bounced casts (mean) | Party KOs (mean) | Limits (mean) | Her MP left on a win (median) |');
console.log('|---|---|---|---|---|---|---|---|---|---|---|');
for (const name of Object.keys(POLICIES)) {
  const rows = bench(name, 'recommended');
  const wins = rows.filter((r) => r.outcome === 'victory');
  const ticks = wins.map((r) => r.ticks);
  out[name] = { wins: wins.length, of: rows.length };
  console.log(
    `| ${name} | ${wins.length}/${rows.length} (${pct(wins.length, rows.length)}) | ${median(ticks)} (~${Math.round(median(ticks) / TICKS_PER_SECOND)} s; ${wins.length ? `${Math.round(Math.min(...ticks) / TICKS_PER_SECOND)} to ${Math.round(Math.max(...ticks) / TICKS_PER_SECOND)}` : 'n/a'}) | ${median(rows.map((r) => r.bossTurns))} (${span(rows.map((r) => r.bossTurns))}) | ${mean(rows.map((r) => r.aqualungs)).toFixed(2)} | ${mean(rows.map((r) => r.doubleBlueLights)).toFixed(2)} | ${pct(rows.filter((r) => r.reflectsCast > 0).length, rows.length)} | ${mean(rows.map((r) => r.reflectedCasts)).toFixed(2)} | ${mean(rows.map((r) => r.kos)).toFixed(2)} | ${mean(rows.map((r) => r.limitsUsed)).toFixed(2)} | ${median(wins.map((r) => r.mpLeft))} |`,
  );
}

console.log('\nThe same seeds in the other two modes (outcomes should match Recommended at zero decision time):\n');
console.log('| Policy | Mode | Wins |');
console.log('|---|---|---|');
for (const name of Object.keys(POLICIES)) {
  for (const mode of ['active', 'wait']) console.log(`| ${name} | ${mode} | ${bench(name, mode).filter((r) => r.outcome === 'victory').length}/${SEEDS} |`);
}

console.log('\nTimed player model (our numbers: 1.5 s per animation, menus 0.5 s then 1.5 s), all three modes:\n');
console.log('| Policy | Mode | Wins | Jenova turns (median) | Party KOs (mean) | Time of a win (median ~s) |');
console.log('|---|---|---|---|---|---|');
for (const name of ['sensible', 'sensible+quake', 'distracted']) {
  for (const mode of ['active', 'recommended', 'wait']) {
    const rows = bench(name, mode, true);
    const wins = rows.filter((r) => r.outcome === 'victory');
    console.log(`| ${name} | ${mode} | ${wins.length}/${rows.length} (${pct(wins.length, rows.length)}) | ${median(rows.map((r) => r.bossTurns))} | ${mean(rows.map((r) => r.kos)).toFixed(2)} | ${Math.round(median(wins.map((r) => r.ticks)) / TICKS_PER_SECOND)} |`);
  }
}
if (process.argv.includes('--json')) console.log(`\n${JSON.stringify(out)}`);
