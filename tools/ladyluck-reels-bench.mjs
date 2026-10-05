/**
 * Lady Luck's timed reels, measured (Bailey's pick A of 2026-10-04, "the slow strip"; FFX-2 only).
 *
 *   node --experimental-transform-types tools/ladyluck-reels-bench.mjs pay [--spins=20000]
 *   node --experimental-transform-types tools/ladyluck-reels-bench.mjs chapters [--seeds=200] [--only=ffx2-vegnagun-shuyin,ffx2-trema] [--spinner=yuna|rikku|paine] [--arms=a,b]
 *
 * Runs the TypeScript sources directly (Node 24 strips the types; the FFX-2 engine needs `--experimental-transform-types`).
 * Pure numbers out; the write-up and the method are `docs/handoff/ladyluck-reels-a.md`. **Nothing here tunes a number**
 * (AGENTS.md rule 6; the page promised "I would not tune a boss for it"): the players are inputs to a measurement, never game data.
 *
 * ## `pay`: what each kind of player gets from a spin
 *
 * The real thing end to end, minus the screen: the engine draws the layout of a spin (`rollReelLayout`, the same function the
 * `minigame-request` carries), a player model picks the instants of its three presses, the overlay's own rule turns each instant
 * into a symbol (`ladyLuckTiming.ts`), and the engine's own pay table reads the three symbols (`resolveLadyLuckSpin` on the
 * shipped Magic Reels). The players are the options page's, so the numbers can be set beside the page's:
 *
 *   masher     taps three times, 150 to 260 ms apart, never looking at the symbols
 *   casual     aims at a Cherry on every reel and presses about 120 ms off the moment it meant (one standard deviation)
 *   careful    aims at a Cherry on every reel, about 60 ms off
 *   greedy     careful, aiming at Red 7 on every reel
 *
 * ## `chapters`: what the timed reels do to Chapters V and XIII
 *
 * The page promised to measure both chapters with the timed reels before anything ships. Each chapter's own build and link chain,
 * Wait ATB, no decision time (the autopilot's clock), seeds 1 to N. Arms, all with the same four-step stream before a spin:
 *
 *   shipped       the shipped autopilot (`intendedStrategy`) for all three girls: the reference; no shipped line opens a reel
 *   random        Yuna wears Lady Luck from the start and throws Magic Reels every turn, **today's reels**: the engine's blind roll
 *   timed-red7    the same line, a careful player at the reels aiming at three Red 7s (Ultima)
 *   timed-cherry  the same line, a careful player aiming at three Cherries (Flare)
 *
 *   careful-red7  the same line, but the spinner only gambles while every living ally has 90 percent of their max HP or more, and
 *                 otherwise takes the shipped line's turn (a Dud takes 75 percent of everyone's current HP): the most careful player
 *   careful-cherry  the same, aiming at Cherries
 *   trio-red7     all three girls wear Lady Luck from the start and throw Magic Reels every turn, a careful player aiming at Red 7
 *   trio-cherry   the same, aiming at Cherries: the most the reels can be asked to do in these chapters, a ceiling and not a line a player takes
 *
 * In the one-girl arms the other two follow the shipped line. The spinner is Yuna unless `--spinner` says otherwise: Lady Luck is one Change
 * away for Yuna and Rikku in Chapter V and for all three girls in Chapter XIII (`docs/handoff/r381-lady-luck.md`; Paine in V is two
 * Changes away, so her rows assume she changed twice early), and wearing her from the start is what that Change on turn one gives.
 *
 * Two checks ride along in every timed arm. `engine!=` counts spins where the engine's message disagrees with the symbols the player
 * stopped (a Dud message for a Dud, never for anything else): it must be 0. `refused` counts answers the engine refused because everything
 * the reels aimed at died while she charged (a rule from r37: the turn is not spent and is offered again); a refused answer is not a spin.
 */
import { SeededRng } from '../src/battle/common/rng.ts';
import {
  FFX2Engine,
  abilityRegistryFrom,
  dressphereRegistryFrom,
  garmentGridRegistryFrom,
  itemRegistryFrom,
  resolveLadyLuckSpin,
  rollReelLayout,
} from '../src/battle/ffx2/index.ts';
import * as data from '../src/data/ffx2/index.ts';
import { getChapter } from '../src/data/encounters.ts';
import { setupForNextLink } from '../src/app/screens/BattleScreenSetup.ts';
import { intendedStrategy } from '../src/engine/BattlePresenterStrategies.ts';
import { REEL_TIMER_MS, msUntilCentred, symbolOnLine } from '../src/ui/ffx2/ladyLuckTiming.ts';

const args = Object.fromEntries(process.argv.slice(3).map((a) => { const m = a.match(/^--([^=]+)=?(.*)$/); return [m[1], m[2] === '' ? true : m[2]]; }));
const mode = process.argv[2];

const MAGIC_REELS = 'x2-lady-luck-magic-reels';
const MAGIC_DEF = data.ABILITIES[MAGIC_REELS];
const STRIP = MAGIC_DEF.extra.symbols;

/** The page's players. `sigma` and `wait` are ms; `want` is the symbol aimed at on every reel. */
const PLAYERS = {
  masher: { masher: true },
  casual: { sigma: 120, wait: 350, want: 'cherry' },
  careful: { sigma: 60, wait: 300, want: 'cherry' },
  greedy: { sigma: 60, wait: 300, want: 'red7' },
};

const gauss = (rng) => {
  let u = 0;
  while (u === 0) u = rng.next();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rng.next());
};

/** One spin by a player model: the three symbols, left to right, from the layout a `minigame-request` carries. */
function playSpin(params, player, rng) {
  const { symbols, stopOrder, phases } = params;
  const stops = [null, null, null];
  let last = 0;
  for (let n = 0; n < 3; n++) {
    const reel = stopOrder[n];
    let t;
    if (player.masher) t = last + 150 + rng.next() * 110;
    else {
      const earliest = last + player.wait;
      const target = earliest + msUntilCentred(symbols, phases[reel], player.want, earliest);
      t = Math.max(earliest, target + player.sigma * gauss(rng));
    }
    if (t >= REEL_TIMER_MS) {
      // the safety timer: every reel still running stops where it is at the deadline
      for (let m = n; m < 3; m++) stops[stopOrder[m]] = symbolOnLine(symbols, phases[stopOrder[m]], REEL_TIMER_MS);
      return { stops, seconds: REEL_TIMER_MS / 1000, timedOut: true };
    }
    stops[reel] = symbolOnLine(symbols, phases[reel], t);
    last = t;
  }
  return { stops, seconds: last / 1000, timedOut: false };
}

const reelsOf = (stops) => ({ symbols: stops, threeOfAKind: stops[0] === stops[1] && stops[1] === stops[2], timeRemainingMs: 0 });
const tierOf = (stops) => resolveLadyLuckSpin(MAGIC_DEF, reelsOf(stops)).tier;
const pct = (n, d) => `${((100 * n) / d).toFixed(1)}%`;

/** Wilson 95% interval, in percent. */
function wilson(k, n) {
  const z = 1.96;
  const p = k / n;
  const d = 1 + (z * z) / n;
  const c = (p + (z * z) / (2 * n)) / d;
  const h = (z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n))) / d;
  return `${(100 * (c - h)).toFixed(1)} to ${(100 * (c + h)).toFixed(1)}`;
}

// ------------------------------------------------------------------------------------------------------------- pay

function pay() {
  const spins = Number(args.spins ?? 20000);
  console.log(`PAY  ${spins} spins a row, shipped Magic Reels, engine layout + overlay timing rule + engine pay table`);
  console.log('player'.padEnd(34), 'pays'.padStart(7), 'dud'.padStart(7), '3 of a kind'.padStart(12), 'red7 x3'.padStart(8), 'pair'.padStart(7), 'cherry'.padStart(7), 'secs/spin'.padStart(10));
  const rows = [['masher (never looks)', 'masher'], ['casual (120 ms off), aims at Cherry', 'casual'], ['careful (60 ms off), aims at Cherry', 'careful'], ['careful, aims at Red 7', 'greedy']];
  for (const [label, key] of rows) {
    const player = PLAYERS[key];
    const layoutRng = new SeededRng(1001);
    const pressRng = new SeededRng(2002);
    const c = { dud: 0, cherry: 0, pair: 0, three: 0, red7: 0, secs: 0 };
    for (let i = 0; i < spins; i++) {
      const params = { symbols: STRIP, ...rollReelLayout(layoutRng, STRIP.length) };
      const r = playSpin(params, player, pressRng);
      const tier = tierOf(r.stops);
      c[tier]++;
      if (tier === 'three' && r.stops[0] === 'red7') c.red7++;
      c.secs += r.seconds;
    }
    console.log(label.padEnd(34), pct(spins - c.dud, spins).padStart(7), pct(c.dud, spins).padStart(7), pct(c.three, spins).padStart(12), pct(c.red7, spins).padStart(8), pct(c.pair, spins).padStart(7), pct(c.cherry, spins).padStart(7), (c.secs / spins).toFixed(2).padStart(10));
  }
  // today's random reels: three uniform draws a spin, the engine's own blind roll
  const rng = new SeededRng(3003);
  const c = { dud: 0, cherry: 0, pair: 0, three: 0, red7: 0 };
  for (let i = 0; i < spins; i++) {
    const stops = [rng.pick(STRIP), rng.pick(STRIP), rng.pick(STRIP)];
    const tier = tierOf(stops);
    c[tier]++;
    if (tier === 'three' && stops[0] === 'red7') c.red7++;
  }
  console.log('as built before: a random draw'.padEnd(34), pct(spins - c.dud, spins).padStart(7), pct(c.dud, spins).padStart(7), pct(c.three, spins).padStart(12), pct(c.red7, spins).padStart(8), pct(c.pair, spins).padStart(7), pct(c.cherry, spins).padStart(7), '-'.padStart(10));
}

// ------------------------------------------------------------------------------------------------------- chapters

const options = (minigames) => ({
  abilities: abilityRegistryFrom(Object.values(data.ABILITIES)),
  items: itemRegistryFrom(Object.values(data.ITEMS)),
  dresspheres: dressphereRegistryFrom(Object.values(data.STANDARD_DRESSPHERES)),
  garmentGrids: garmentGridRegistryFrom(Object.values(data.GARMENT_GRIDS)),
  minigames,
  atbMode: 'wait',
});

function fallback(d) {
  const row = d.commands.find((c) => c.enabled && c.command.kind === 'attack') ?? d.commands.find((c) => c.enabled);
  if (!row) return { kind: 'defend', targets: [] };
  const target = row.validTargets[0];
  return { ...row.command, targets: target ? [target] : [] };
}

const TRIO = ['yuna', 'rikku', 'paine'];
/** The single spinner of the one-girl arms: `--spinner=yuna|rikku|paine` (Yuna by default). */
const SPINNER = String(args.spinner ?? 'yuna');
const ARMS = {
  shipped: { spinners: [] },
  random: { spinners: [SPINNER], player: null },
  'timed-red7': { spinners: [SPINNER], player: PLAYERS.greedy },
  'timed-cherry': { spinners: [SPINNER], player: PLAYERS.careful },
  // the Dud takes 75 percent of every ally's current HP, so a careful player does not gamble while anyone is hurt: the spinner
  // spins only when every living ally has at least `gate` of their max HP, and otherwise takes the shipped line's turn
  'careful-red7': { spinners: [SPINNER], player: PLAYERS.greedy, gate: 0.9 },
  'careful-cherry': { spinners: [SPINNER], player: PLAYERS.careful, gate: 0.9 },
  'trio-red7': { spinners: TRIO, player: PLAYERS.greedy },
  'trio-cherry': { spinners: TRIO, player: PLAYERS.careful },
};

const MAX_DECISIONS = 60000;

/** True when no gate is set, or every living ally has at least `gate` of their max HP. */
function healthyEnough(engine, gate) {
  if (!gate) return true;
  return Object.values(engine.state().combatants).every((c) => c.side !== 'party' || !c.alive || c.hp >= gate * c.stats.maxHp);
}

function runLink(engine, arm, state) {
  const last = {}; // the command each girl last submitted, which a minigame answer re-submits
  const player = ARMS[arm].player;

  /** Answer every request a batch of events raised, until a batch raises none. */
  const answerRequests = (first) => {
    let batch = first;
    for (let guard = 0; guard < 20; guard++) {
      const req = batch.find((e) => e.type === 'minigame-request');
      if (!req) return;
      const cmd = last[req.who];
      const reels = req.kind === 'ladyluck-reels';
      if (reels && player) {
        const r = playSpin(req.params, player, state.pressRng);
        const tier = tierOf(r.stops);
        batch = engine.submit({ ...cmd, extra: { kind: 'ladyluck-reels', reels: reelsOf(r.stops) } });
        // An empty batch is a refusal, not a spin: everything she aimed at died while she charged (the long CT), so the engine
        // keeps the turn and offers it again. It is not counted.
        if (batch.length === 0) { state.refused++; continue; }
        state.spins++;
        state.tiers[tier]++;
        // the engine must have resolved exactly the symbols the player stopped: a Dud message for a Dud, never for anything else
        const said = batch.find((e) => e.type === 'message');
        if (!said || (tier === 'dud') !== (said.text === 'Dud!')) state.disagree++;
      } else {
        // today's reels, and Trigger Happy: nobody is timing anything, so the bare re-submit and the engine rolls it
        batch = engine.submit(cmd);
        if (reels && batch.length > 0) state.spins++;
      }
    }
  };
  const submit = (actorId, command) => {
    last[actorId] = command;
    answerRequests(engine.submit(command));
  };

  for (let i = 0; i < MAX_DECISIONS; i++) {
    const d = engine.nextDecision();
    if (d.kind === 'battle-over') return d.result.outcome;
    if (d.kind === 'resolved') { answerRequests(d.events); continue; }
    if (d.kind === 'waiting') { answerRequests(engine.tick(Math.max(1, d.nextEventMs))); continue; }
    if (d.kind !== 'player-input') continue;
    if (ARMS[arm].spinners.includes(d.actorId) && healthyEnough(engine, ARMS[arm].gate)) {
      const row = d.commands.find((c) => c.enabled && c.command.kind === 'ability' && c.command.id === MAGIC_REELS);
      if (row) {
        const foe = row.validTargets.find((id) => engine.state().combatants[id]?.side === 'enemy') ?? row.validTargets[0];
        submit(d.actorId, { ...row.command, targets: foe ? [foe] : [] });
        continue;
      }
    }
    submit(d.actorId, intendedStrategy(d.actorId, d.commands, engine) ?? fallback(d));
  }
  return undefined;
}

function runChain(chapterId, seed, arm) {
  const ch = getChapter(chapterId);
  let party = ch.buildRef;
  const spinners = ARMS[arm].spinners;
  if (spinners.length) party = { ...party, members: party.members.map((m) => (spinners.includes(m.id) ? { ...m, currentDressphere: 'lady-luck' } : m)) };
  let group = ch.enemyGroupRef;
  const engine = new FFX2Engine(options(spinners.length > 0));
  let setup = { game: 'ffx2', party, enemies: group, triggers: [], seed, condition: 'normal', canEscape: false };
  engine.setSeed(seed);
  engine.init(setup);
  const state = { pressRng: new SeededRng(seed * 7919 + 17), spins: 0, refused: 0, disagree: 0, tiers: { dud: 0, cherry: 0, pair: 0, three: 0 } };
  let links = 0;
  for (;;) {
    const outcome = runLink(engine, arm, state);
    links++;
    if (outcome !== 'victory') return { win: false, links, ...state };
    const nextId = group.nextGroupId;
    if (!nextId) return { win: true, links, ...state };
    const next = data.ENEMY_GROUPS_BY_ID[nextId];
    setup = setupForNextLink(setup, next, engine.state(), seed + links);
    group = next;
    engine.setSeed(setup.seed);
    engine.init(setup);
  }
}

function chapters() {
  const seeds = Number(args.seeds ?? 200);
  const only = String(args.only ?? 'ffx2-vegnagun-shuyin,ffx2-trema').split(',');
  const labels = { 'ffx2-vegnagun-shuyin': 'Chapter V, the Farplane (the Vegnagun chain)', 'ffx2-trema': 'Chapter XIII, Via Infinito (Paragon, then Trema)' };
  for (const id of only) {
    console.log(`\nCHAPTER ${labels[id] ?? id}  seeds 1 to ${seeds}, Wait ATB, spinner in the one-girl arms: ${SPINNER}`);
    console.log('arm'.padEnd(14), 'clears'.padStart(10), 'rate'.padStart(7), '95% interval'.padStart(14), 'dead at link'.padStart(24), 'spins/run'.padStart(10), 'dud'.padStart(6), 'cherry'.padStart(7), 'pair'.padStart(6), '3 kind'.padStart(7), 'secs'.padStart(6), 'engine!='.padStart(9), 'refused'.padStart(8));
    for (const arm of Object.keys(ARMS)) {
      if (args.arms && !String(args.arms).split(',').includes(arm)) continue;
      const t0 = Date.now();
      let wins = 0;
      const lost = {};
      const tot = { spins: 0, refused: 0, disagree: 0, dud: 0, cherry: 0, pair: 0, three: 0 };
      for (let s = 1; s <= seeds; s++) {
        const r = runChain(id, s, arm);
        if (r.win) wins++;
        else lost[r.links] = (lost[r.links] ?? 0) + 1;
        tot.spins += r.spins;
        tot.disagree += r.disagree;
        tot.refused += r.refused;
        for (const k of ['dud', 'cherry', 'pair', 'three']) tot[k] += r.tiers[k];
      }
      const timed = ARMS[arm].player !== undefined && ARMS[arm].player !== null;
      const share = (k) => (timed && tot.spins ? pct(tot[k], tot.spins) : '-');
      console.log(
        arm.padEnd(14), `${wins}/${seeds}`.padStart(10), pct(wins, seeds).padStart(7), wilson(wins, seeds).padStart(14),
        JSON.stringify(lost).padStart(24), (tot.spins / seeds).toFixed(1).padStart(10),
        share('dud').padStart(6), share('cherry').padStart(7), share('pair').padStart(6), share('three').padStart(7), ((Date.now() - t0) / 1000).toFixed(0).padStart(6), (timed ? String(tot.disagree) : '-').padStart(9), (timed ? String(tot.refused) : '-').padStart(8),
      );
    }
  }
}

if (mode === 'pay') pay();
else if (mode === 'chapters') chapters();
else console.log('usage: node --experimental-transform-types tools/ladyluck-reels-bench.mjs pay|chapters [--spins=N] [--seeds=N] [--only=chapter,chapter]');
