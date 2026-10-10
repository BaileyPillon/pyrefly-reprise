/**
 * The runner and the readings for the **Sinspawn Gui bench** (the hidden Sinspawn Gui chapter, `sinspawn-gui`: the Ridge's first fight against
 * the full party, then the second with Yuna, Auron and the guest Seymour). **FFX only.** Test-only.
 *
 * One battle per seed on the real FFX engine and the chapter's own data, the two links chained exactly as the screen chains them
 * (`setupForNextLink`, the screen's own carry). Human pace equals bench speed: FFX is CTB and the clock moves only on turns. **Measure,
 * never tune**: the boss is the game's own rows (`research/re-ffx-ai-gui.md`); only the party estimate (`data/ffx/builds/mushroom-rock.ts`)
 * may move, and only inside its stated range.
 */

import type { AvailableCommand, BattleEngine, BattleEvent, BattleSetup, Command, Decision, FFXCombatant } from '../../../src/battle/common/types.ts';
import { FFXContentRegistry, createFFXEngine } from '../../../src/battle/ffx/index.ts';
import { ALL_ABILITIES, ENEMY_GROUPS_BY_ID, ITEMS } from '../../../src/data/ffx/index.ts';
import { getChapter } from '../../../src/data/encounters.ts';
import { setupForChapter, setupForNextLink } from '../../../src/app/screens/BattleScreenSetup.ts';

export const content = new FFXContentRegistry();
content.addAbilities([...ALL_ABILITIES]);
content.addItems(Object.values(ITEMS));

export const CHAPTER_ID = 'sinspawn-gui';
export const GROUPS = ['sinspawn-gui-1', 'sinspawn-gui-2'] as const;
export type LinkNo = 1 | 2;
export type Input = Extract<Decision, { kind: 'player-input' }>;
/** A player line: the command for this decision, or `null` to press the fallback (Attack, else the first row). */
export type Line = (engine: BattleEngine, d: Input, link: LinkNo) => Command | null;

export interface RunOpts {
  seed: number;
  /** First link played (a fresh start on the build). Default 1. */
  startLink?: LinkNo;
  /** Last link played. Default 2 (the whole chain from `startLink`). */
  stopAfter?: LinkNo;
  /** Open `startLink` on this setup instead of the chapter's (a checkpoint retry replays the link-2 entry). */
  entry?: BattleSetup;
  /** A hook on every freshly initialised link (flags, state probes). */
  onInit?: (engine: BattleEngine, link: LinkNo) => void;
}

export interface LinkReading {
  link: LinkNo;
  outcome: string;
  /** The engine's turn counter (every actor's turn). */
  turns: number;
  /** The player's decisions (party actions). */
  actions: number;
  /** Times both arms grew back. */
  regrowths: number;
  /** Times the arms fell (a part-destroyed event of an arm). */
  armKills: number;
  /** The head's relays: Thunder queued, Venom queued, Venom cancelled by a hit. */
  thunders: number;
  venoms: number;
  cancels: number;
  /** Body Attacks and Demis. */
  attacks: number;
  demis: number;
  /** Party members alive at the end (of those fighting) and their mean HP fraction. */
  aliveAtEnd: number;
  hpFractionAtEnd: number;
  /** Seymour's Requiems cast. */
  requiems: number;
  /** Overkill on the body (the six-Key-Sphere reward). */
  overkill: boolean;
  /** Loss cause: '' on a win, else 'wipe:<the ability that killed the last member>' or 'unresolved'. */
  cause: string;
}

export interface ChainReading {
  seed: number;
  links: LinkReading[];
  cleared: number;
  /** 'victory' if every link played was won, else the losing link's outcome. */
  outcome: string;
  /** The setup link 2 was entered on (the carried party state), when the run reached link 2. */
  link2Entry?: BattleSetup;
}

const fallback = (d: Input): Command => {
  const row: AvailableCommand | undefined = d.commands.find((c) => c.enabled && c.command.kind === 'attack') ?? d.commands.find((c) => c.enabled);
  const target = row?.validTargets[0];
  return row ? ({ ...row.command, targets: target ? [target] : [] } as Command) : ({ kind: 'defend', targets: [] } as Command);
};

const GUI_PARTS = new Set(['sinspawn-gui', 'sinspawn-gui-2', 'sinspawn-gui-head', 'sinspawn-gui-arm-left', 'sinspawn-gui-arm-right']);

function readLink(engine: BattleEngine, link: LinkNo, actions: number): LinkReading {
  const s = engine.state();
  const log: readonly BattleEvent[] = s.log;
  let regrowths = 0, armKills = 0, thunders = 0, venoms = 0, cancels = 0, attacks = 0, demis = 0, requiems = 0;
  let current = '';
  let cause = '';
  for (const e of log) {
    if (e.type === 'message' && /grow back/.test(e.text)) regrowths++;
    else if (e.type === 'message' && /stops shaking/.test(e.text)) cancels++;
    else if (e.type === 'part-destroyed' && /arm/.test(e.partId)) armKills++;
    else if (e.type === 'action-start') {
      current = e.abilityId ?? e.command.kind;
      if (e.abilityId === 'thunder' && GUI_PARTS.has(e.actorId)) thunders++;
      else if (e.abilityId === 'gui-venom') venoms++;
      else if (e.abilityId === 'demi' && GUI_PARTS.has(e.actorId)) demis++;
      else if (e.abilityId === 'requiem') requiems++;
      else if (e.command.kind === 'attack' && GUI_PARTS.has(e.actorId)) attacks++;
    } else if (e.type === 'ko') {
      const who = s.combatants[e.targetId];
      if (who?.side === 'party') cause = current || 'status';
    }
  }
  const outcome = s.result?.outcome ?? 'unfinished';
  const fighters = s.activeIds.concat(s.reserveIds).map((id) => s.combatants[id] as FFXCombatant | undefined).filter((c): c is FFXCombatant => !!c && !c.removed);
  const up = fighters.filter((c) => c.hp > 0 && c.statuses?.['ko'] === undefined);
  const body = (s.combatants['sinspawn-gui'] ?? s.combatants['sinspawn-gui-2']) as FFXCombatant | undefined;
  return {
    link,
    outcome,
    turns: s.turn,
    actions,
    regrowths,
    armKills,
    thunders,
    venoms,
    cancels,
    attacks,
    demis,
    aliveAtEnd: up.length,
    hpFractionAtEnd: up.length ? up.reduce((a, c) => a + c.hp / c.stats.maxHp, 0) / up.length : 0,
    requiems,
    overkill: !!body && (s.result?.overkilled ?? []).includes(body.id),
    cause: outcome === 'victory' ? '' : outcome === 'defeat' ? `wipe:${cause}` : 'unresolved',
  };
}

/** Play `startLink` to `stopAfter` under `line`. */
export function runChain(line: Line, o: RunOpts): ChainReading {
  const chapter = getChapter(CHAPTER_ID);
  if (!chapter) throw new Error(`${CHAPTER_ID} is not registered`);
  const first = o.startLink ?? 1;
  const last = o.stopAfter ?? 2;
  let setup: BattleSetup = o.entry ?? setupForChapter(chapter, o.seed);
  if (!o.entry && first === 2) setup = { ...setup, enemies: ENEMY_GROUPS_BY_ID[GROUPS[1]]!, condition: 'scripted', seed: o.seed };
  const engine = createFFXEngine({ content, autoResolveMinigames: true });
  const out: ChainReading = { seed: o.seed, links: [], cleared: 0, outcome: 'victory' };
  for (let link = first; link <= last; link++) {
    if (link === 2) out.link2Entry = setup;
    engine.init(setup);
    o.onInit?.(engine, link as LinkNo);
    let actions = 0;
    let streakActor = '';
    let streak = 0;
    for (let step = 0; step < 20_000; step++) {
      const d = engine.nextDecision();
      if (d.kind === 'battle-over') break;
      if (d.kind !== 'player-input') continue;
      let cmd: Command | null = streak >= 6 ? ({ kind: 'defend', targets: [] } as Command) : streak >= 3 ? fallback(d) : line(engine, d, link as LinkNo);
      cmd ??= fallback(d);
      const events = engine.submit(cmd);
      if (events.length === 0) { streak = d.actorId === streakActor ? streak + 1 : 1; streakActor = d.actorId; }
      else { streak = 0; streakActor = ''; actions++; }
    }
    const reading = readLink(engine, link as LinkNo, actions);
    out.links.push(reading);
    if (reading.outcome !== 'victory') { out.outcome = reading.outcome; break; }
    out.cleared++;
    if (link < last) setup = setupForNextLink(setup, ENEMY_GROUPS_BY_ID[(GROUPS as readonly string[])[link]!]!, engine.state(), o.seed + link);
  }
  return out;
}

export const pct = (n: number, of: number): string => `${n}/${of} (${of ? Math.round((n * 1000) / of) / 10 : 0} %)`;

/** Seeds `1..seeds`, one run each. */
export function sweep(line: () => Line, o: Omit<RunOpts, 'seed'>, seeds: number): ChainReading[] {
  const out: ChainReading[] = [];
  for (let seed = 1; seed <= seeds; seed++) out.push(runChain(line(), { ...o, seed }));
  return out;
}

/** One line of numbers for a set of runs: chains won, each link's wins, where the losers fell, mean turns of a win. */
export function summarise(runs: readonly ChainReading[]): string {
  const won = runs.filter((r) => r.outcome === 'victory');
  const byLink = [1, 2].map((k) => {
    const ls = runs.flatMap((r) => r.links.filter((l) => l.link === k));
    return pct(ls.filter((l) => l.outcome === 'victory').length, ls.length);
  });
  const causes: Record<string, number> = {};
  for (const r of runs.filter((x) => x.outcome !== 'victory')) {
    const l = r.links[r.links.length - 1]!;
    const key = `L${l.link} ${l.cause}`;
    causes[key] = (causes[key] ?? 0) + 1;
  }
  const turns = won.length ? Math.round(won.reduce((t, r) => t + r.links.reduce((u, l) => u + l.turns, 0), 0) / won.length) : 0;
  const lost = Object.entries(causes).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(', ') || '-';
  return `${pct(won.length, runs.length)} | links ${byLink.join(' -> ')} | ${lost} | ${turns} engine turns a full clear`;
}
