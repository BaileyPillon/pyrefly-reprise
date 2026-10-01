/**
 * The runner and the readings for the **Chapter XVII bench** (`sin-fins-core`: the Left Fin, the Right
 * Fin, then Sinspawn Genais with Sin's Core). **FFX only.** Test-only. Package B of
 * `docs/plans/sin-two-chapters-plan.md` §5.
 *
 * One battle per seed, first try, on the real FFX engine and the chapter's own data. A run is a link, or the
 * chain of links 1 to 3 on the carried party state (`setupForNextLink`, the screen's own carry). Every switch
 * the plan measures both ways is an option here and never a default someone tuned:
 *
 * - `range` — **S-8**: the Fins open FAR (the default) or NEAR;
 * - `negationOff` — **S-12** as a bound, not a proposal: the wiki Negation tunables off (both Fins and Core);
 * - `seam` — **REVIEW 6**: at a seam the party reopens with the build's line-up (the default, our estimate)
 *   or with the front row it ended the last link in.
 *
 * Human pace equals bench speed: FFX is CTB and the clock moves only on turns (the house rule,
 * `docs/plans/yojimbo-faithfulness-2026-09-26.md` §3). Measure, never tune.
 */

import type { AvailableCommand, BattleEngine, BattleEvent, BattleSetup, BattleState, Command, Decision, FFXCombatant, FFXPartyBuild } from '../../../src/battle/common/types.ts';
import { FFXContentRegistry, createFFXEngine } from '../../../src/battle/ffx/index.ts';
import { ALL_ABILITIES, ENEMY_GROUPS_BY_ID, ITEMS } from '../../../src/data/ffx/index.ts';
import { getChapter } from '../../../src/data/encounters.ts';
import { setupForChapter, setupForNextLink } from '../../../src/app/screens/BattleScreenSetup.ts';
import { SIN_NEGATION_OFF } from '../../../src/battle/ffx/ai/sin-negation.ts';
import { SIN_CORE_NEGATION_ON } from '../../../src/battle/ffx/ai/sin-genais-core-rules.ts';

export const content = new FFXContentRegistry();
content.addAbilities([...ALL_ABILITIES]);
content.addItems(Object.values(ITEMS));

export const CHAPTER_ID = 'sin-fins-core';
export const GROUPS = ['sin-left-fin', 'sin-right-fin', 'sin-genais-core'] as const;
export type LinkNo = 1 | 2 | 3;
export type Input = Extract<Decision, { kind: 'player-input' }>;
/** A player line: the command to submit for this decision, or `null` to press the fallback (Attack, else the first row). */
export type Line = (engine: BattleEngine, d: Input, link: LinkNo) => Command | null;

export interface RunOpts {
  seed: number;
  /** First link played (a fresh start on the build, statuses and HP full). Default 1. */
  startLink?: LinkNo;
  /** Last link played. Default 3 (the whole chain from `startLink`). */
  stopAfter?: LinkNo;
  /** S-8. Default 'far'. */
  range?: 'far' | 'near';
  /** S-12's bound: Negation off on both Fins and the Core. */
  negationOff?: boolean;
  /** REVIEW 6: 'build' (default) or 'front' (the line-up the last link ended in). */
  seam?: 'build' | 'front';
  /** Any other bench switch, set on every link's flags after init (the Core's S-13 tunables, REVIEW 8). */
  flags?: Record<string, unknown>;
  /** Open `startLink` on this setup instead of a rested one (a checkpoint retry replays the link-3 entry). */
  entry?: BattleSetup;
}

export interface LinkReading {
  link: LinkNo;
  outcome: string;
  /** Loss cause: '' on a win, else 'wipe:<the ability that killed the last member>', 'escape' (the 400-turn stalemate) or 'unresolved'. */
  cause: string;
  /** The engine's turn counter (every actor's turn), the length check against Chapter III's ~195. */
  turns: number;
  /** The player's decisions (party actions). */
  actions: number;
  negations: number;
  gravijas: number;
  /** A charged Gravija resolving at FAR: the dodge. */
  whiffs: number;
  /** Gravija resolved NEAR while the ship was FAR is impossible; this counts Gravija rows fired by the Core. */
  coreGravijas: number;
  genaisShells: number;
  /** Link 3 won with Genais alive. */
  winWithGenais: boolean;
  /** Party members alive (of the build's seven) and their HP fraction at the end of the link. */
  aliveAtEnd: number;
  hpFractionAtEnd: number;
  /** Aeon decisions at FAR, and how many had a damaging row that reaches the foe. */
  aeonFarDecisions: number;
  aeonFarReach: number;
  summonsAtFar: number;
  summons: number;
}

export interface ChainReading {
  seed: number;
  links: LinkReading[];
  /** Links won. */
  cleared: number;
  /** 'victory' if every link played was won, else the losing link's outcome. */
  outcome: string;
  /** The setup link 3 was entered on (the carried party state), when the run reached link 3. */
  link3Entry?: BattleSetup;
}

const alive = (c: FFXCombatant | undefined): boolean => !!c && c.hp > 0 && c.statuses?.['ko'] === undefined;
const foesOf = (s: BattleState): string[] => s.enemyIds.filter((id) => id !== 'cid');

export function linkOf(engine: BattleEngine): LinkNo {
  const ids = engine.state().enemyIds;
  return ids.includes('left-fin') ? 1 : ids.includes('right-fin') ? 2 : 3;
}

/** Pins that a Line never gets the same actor refused forever: 3 refusals in a row press the fallback, 3 more defend. */
function fallback(d: Input): Command {
  const row: AvailableCommand | undefined = d.commands.find((c) => c.enabled && c.command.kind === 'attack') ?? d.commands.find((c) => c.enabled);
  const target = row?.validTargets[0];
  return row ? ({ ...row.command, targets: target ? [target] : [] } as Command) : ({ kind: 'defend', targets: [] } as Command);
}

/** Read one finished link off the engine's log. */
function readLink(engine: BattleEngine, link: LinkNo, extra: Pick<LinkReading, 'actions' | 'aeonFarDecisions' | 'aeonFarReach' | 'summonsAtFar' | 'summons'>, members: string[]): LinkReading {
  const s = engine.state();
  const log: readonly BattleEvent[] = s.log;
  let negations = 0, gravijas = 0, whiffs = 0, coreGravijas = 0, genaisShells = 0;
  let current = '';
  let cause = '';
  for (const e of log) {
    if (e.type === 'action-start') {
      current = e.abilityId ?? e.command.kind;
      if (e.abilityId === 'sin-fin-gravija') gravijas++;
      else if (e.abilityId === 'sin-fin-gravija-far') whiffs++;
      else if (e.abilityId === 'sin-core-gravija') { gravijas++; coreGravijas++; }
      else if (e.abilityId === 'sin-genais-shell-in') genaisShells++;
    } else if (e.type === 'counter') {
      current = e.abilityId;
      if (e.abilityId === 'sin-fin-negation' || e.abilityId === 'sin-fin-negation-far' || e.abilityId === 'sin-core-negation') negations++;
    } else if (e.type === 'ko' && members.includes(e.targetId)) {
      cause = current || 'status';
    }
  }
  const outcome = s.result?.outcome ?? 'unfinished';
  const party = members.map((id) => s.combatants[id] as FFXCombatant | undefined);
  const up = party.filter(alive) as FFXCombatant[];
  const genais = s.combatants['sinspawn-genais'] as FFXCombatant | undefined;
  return {
    link,
    outcome,
    cause: outcome === 'victory' ? '' : outcome === 'defeat' ? `wipe:${cause}` : outcome === 'escape' ? 'escape' : 'unresolved',
    turns: s.turn,
    negations,
    gravijas,
    whiffs,
    coreGravijas,
    genaisShells,
    winWithGenais: link === 3 && outcome === 'victory' && alive(genais),
    aliveAtEnd: up.length,
    hpFractionAtEnd: up.length ? up.reduce((a, c) => a + c.hp / c.stats.maxHp, 0) / up.length : 0,
    ...extra,
  };
}

/** Whatever the party build offers, in link order. */
function linkSetup(chapterBuild: FFXPartyBuild, link: LinkNo, seed: number, triggers: BattleSetup['triggers']): BattleSetup {
  return { game: 'ffx', party: chapterBuild, enemies: ENEMY_GROUPS_BY_ID[GROUPS[link - 1]!]!, triggers, seed, condition: link === 1 ? 'normal' : 'scripted', canEscape: false };
}

/** Put the run's switches on a freshly initialised link. */
function applySwitches(engine: BattleEngine, o: RunOpts): void {
  const flags = engine.state().flags as Record<string, unknown>;
  if (o.range === 'near' && flags['airship.range'] !== undefined) flags['airship.range'] = 'near';
  if (o.negationOff) { flags[SIN_NEGATION_OFF] = true; flags[SIN_CORE_NEGATION_ON] = false; }
  for (const [k, v] of Object.entries(o.flags ?? {})) flags[k] = v;
}

/** REVIEW 6, the second reading: the next link opens with the front row the last one ended in. */
function withFrontRow(setup: BattleSetup, state: BattleState): BattleSetup {
  const p = setup.party as FFXPartyBuild;
  const front = state.activeIds.filter((id) => p.members.some((m) => m.id === id));
  if (front.length !== p.activeSlots.length) return setup;
  const reserve = p.members.map((m) => m.id).filter((id) => !front.includes(id));
  return { ...setup, party: { ...p, activeSlots: front as FFXPartyBuild['activeSlots'], reserve: reserve as FFXPartyBuild['reserve'] } };
}

/** Play `startLink` to `stopAfter` under `line`. */
export function runChain(line: Line, o: RunOpts): ChainReading {
  const chapter = getChapter(CHAPTER_ID);
  if (!chapter) throw new Error(`${CHAPTER_ID} is not registered`);
  const first = o.startLink ?? 1;
  const last = o.stopAfter ?? 3;
  const build = chapter.buildRef as FFXPartyBuild;
  const members = build.members.map((m) => m.id);
  let setup: BattleSetup = o.entry ?? (first === 1 ? setupForChapter(chapter, o.seed) : linkSetup(build, first, o.seed, chapter.scriptsRef?.mid ?? []));
  const engine = createFFXEngine({ content, autoResolveMinigames: true });
  const out: ChainReading = { seed: o.seed, links: [], cleared: 0, outcome: 'victory' };
  for (let link = first; link <= last; link++) {
    if (link === 3) out.link3Entry = setup;
    engine.init(setup);
    applySwitches(engine, o);
    const x = { actions: 0, aeonFarDecisions: 0, aeonFarReach: 0, summonsAtFar: 0, summons: 0 };
    let streakActor = '';
    let streak = 0;
    for (let step = 0; step < 20_000; step++) {
      const d = engine.nextDecision();
      if (d.kind === 'battle-over') break;
      if (d.kind !== 'player-input') continue;
      const st = engine.state();
      const far = st.flags['airship.range'] === 'far' && foesOf(st).some((id) => id === 'left-fin' || id === 'right-fin');
      const me = st.combatants[d.actorId];
      if (far && me?.side === 'aeon') {
        x.aeonFarDecisions++;
        const fin = foesOf(st)[0]!;
        if (d.commands.some((c) => c.enabled && ['attack', 'ability', 'overdrive'].includes(c.command.kind) && c.validTargets.includes(fin))) x.aeonFarReach++;
      }
      let cmd: Command | null = streak >= 6 ? ({ kind: 'defend', targets: [] } as Command) : streak >= 3 ? fallback(d) : line(engine, d, link as LinkNo);
      cmd ??= fallback(d);
      if (cmd.kind === 'summon') { x.summons++; if (far) x.summonsAtFar++; }
      const events = engine.submit(cmd);
      if (events.length === 0) { streak = d.actorId === streakActor ? streak + 1 : 1; streakActor = d.actorId; }
      else { streak = 0; streakActor = ''; x.actions++; }
    }
    const reading = readLink(engine, link as LinkNo, x, members);
    out.links.push(reading);
    if (reading.outcome !== 'victory') { out.outcome = reading.outcome; break; }
    out.cleared++;
    if (link < last) {
      const nextGroup = ENEMY_GROUPS_BY_ID[(GROUPS as readonly string[])[link]!]!;
      setup = setupForNextLink(setup, nextGroup, engine.state(), o.seed + link);
      if (o.seam === 'front') setup = withFrontRow(setup, engine.state());
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// What the bench prints
// ---------------------------------------------------------------------------

/** A line's advisor-card wrapper, for the bench to build once `registerBattleContent()` has run. */
export interface Agg {
  /** Fights started on this link. */
  n: number;
  wins: number;
  causes: Record<string, number>;
  turns: number;
  actions: number;
  negations: number;
  gravijas: number;
  whiffs: number;
  shells: number;
  winWithGenais: number;
  aeonFarDecisions: number;
  aeonFarReach: number;
  summons: number;
  summonsAtFar: number;
}

export const emptyAgg = (): Agg => ({ n: 0, wins: 0, causes: {}, turns: 0, actions: 0, negations: 0, gravijas: 0, whiffs: 0, shells: 0, winWithGenais: 0, aeonFarDecisions: 0, aeonFarReach: 0, summons: 0, summonsAtFar: 0 });

export function addLink(a: Agg, l: LinkReading): void {
  a.n++;
  if (l.outcome === 'victory') a.wins++; else a.causes[l.cause] = (a.causes[l.cause] ?? 0) + 1;
  a.turns += l.turns; a.actions += l.actions; a.negations += l.negations; a.gravijas += l.gravijas; a.whiffs += l.whiffs;
  a.shells += l.genaisShells; if (l.winWithGenais) a.winWithGenais++;
  a.aeonFarDecisions += l.aeonFarDecisions; a.aeonFarReach += l.aeonFarReach; a.summons += l.summons; a.summonsAtFar += l.summonsAtFar;
}

export const pct = (n: number, of: number): string => `${n}/${of} (${of ? Math.round((n * 1000) / of) / 10 : 0} %)`;
export const per = (n: number, of: number, d = 1): string => (of ? (n / of).toFixed(d) : '-');
export const fmtCauses = (c: Record<string, number>): string =>
  Object.entries(c).sort((x, y) => y[1] - x[1]).map(([k, v]) => `${k} ${v}`).join(', ') || '-';

/** Every seed of `1..seeds`, one run each. */
export function sweep(line: () => Line, o: Omit<RunOpts, 'seed'>, seeds: number): ChainReading[] {
  const out: ChainReading[] = [];
  for (let seed = 1; seed <= seeds; seed++) out.push(runChain(line(), { ...o, seed }));
  return out;
}

/** One link's Agg from a set of runs (`link` = the link the runs started on, read as fresh or as reached in a chain). */
export function aggLink(runs: readonly ChainReading[], link: LinkNo): Agg {
  const a = emptyAgg();
  for (const r of runs) { const l = r.links.find((x) => x.link === link); if (l) addLink(a, l); }
  return a;
}

/** The chain rows: chains won, where the losers fell, the length, and who walked into link 3. */
export function chainRow(runs: readonly ChainReading[]): string {
  const won = runs.filter((r) => r.outcome === 'victory');
  const lost = runs.filter((r) => r.outcome !== 'victory');
  const byLink = [1, 2, 3].map((k) => aggLink(runs, k as LinkNo));
  const causes: Record<string, number> = {};
  for (const r of lost) { const l = r.links[r.links.length - 1]!; const key = `L${l.link} ${l.cause}`; causes[key] = (causes[key] ?? 0) + 1; }
  const all = runs.reduce((s, r) => s + r.links.reduce((t, l) => t + l.turns, 0), 0);
  const intoThree = runs.map((r) => r.links.find((l) => l.link === 2 && l.outcome === 'victory')).filter((l): l is LinkReading => !!l);
  const alive = intoThree.length ? intoThree.reduce((s, l) => s + l.aliveAtEnd, 0) / intoThree.length : 0;
  const hp = intoThree.length ? intoThree.reduce((s, l) => s + l.hpFractionAtEnd, 0) / intoThree.length : 0;
  const wonTurns = won.length ? won.reduce((s, r) => s + r.links.reduce((t, l) => t + l.turns, 0), 0) / won.length : 0;
  return (
    `${pct(won.length, runs.length)} | ${byLink.map((a) => pct(a.wins, a.n)).join(' → ')} | ${fmtCauses(causes)} | ` +
    `${per(all, runs.length, 0)} (${won.length ? Math.round(wonTurns) : '-'} on a full clear) | ${alive.toFixed(1)} of 7 alive, mean ${Math.round(hp * 100)} % HP (n ${intoThree.length})`
  );
}

// ---------------------------------------------------------------------------
// Retries, with and without the link-3 checkpoint (SIN_LINK3_CHECKPOINT, ON as shipped since D-284)
// ---------------------------------------------------------------------------

export interface RetryReading {
  seed: number;
  /** 1-based attempt that won the chapter, or null within the attempts allowed. */
  wonOn: number | null;
  /** Engine turns spent over every attempt up to the win (or all of them). */
  turns: number;
  /** Per attempt: the link it opened on and the link it ended on. */
  attempts: Array<{ from: LinkNo; endedOn: LinkNo; outcome: string }>;
}

/**
 * Play the chapter up to `attempts` times. Attempt _k_ (0-based) reseeds its base seed as `seed + 10000 * k` (the
 * flow reseeds a retry). Without the checkpoint every retry starts at link 1 on the build. With it, once an attempt
 * has entered link 3, every later retry opens link 3 on the setup captured on entering it (the D-217 shape:
 * `BattleChainCheckpoint.resumeSetup`, the seed `base + link - 1`), items as they were then.
 */
export function runWithRetries(make: () => Line, o: Omit<RunOpts, 'seed' | 'startLink' | 'entry'>, seed: number, attempts: number, checkpoint: boolean): RetryReading {
  const out: RetryReading = { seed, wonOn: null, turns: 0, attempts: [] };
  let resume: BattleSetup | undefined;
  for (let k = 0; k < attempts; k++) {
    const base = seed + 10_000 * k;
    const r = resume
      ? runChain(make(), { ...o, seed: base, startLink: 3, entry: { ...resume, seed: base + 2 } })
      : runChain(make(), { ...o, seed: base });
    if (checkpoint && !resume && r.link3Entry) resume = r.link3Entry;
    out.turns += r.links.reduce((t, l) => t + l.turns, 0);
    const endedOn = r.links[r.links.length - 1]!.link;
    out.attempts.push({ from: r.links[0]!.link, endedOn, outcome: r.outcome });
    if (r.outcome === 'victory') { out.wonOn = k + 1; break; }
  }
  return out;
}
