/**
 * Drives the hidden Last Summoning's chain on the real engine (FFX only; test-only): the party of the chapter's record fights the possession links in an order the caller picks, each link set up exactly as
 * the chain loop sets it (`setupForChapter` for the first, `setupForNextLink` for the rest, the engine re-initialised), with the chapter's own line (`intendedStrategy`) or a naive one. It records what the
 * chapter's bench and chain tests read: the formations fought, the outcome of each link, the turns and ticks it took, the party's state at its end and whether one of the player's aeons stood at the end.
 */

import type { BattleEngine, BattleSetup, BattleState, Command, Decision, EnemyGroupDef, FFXCombatant } from '../../../src/battle/common/types.ts';
import { FFXEngine } from '../../../src/battle/ffx/index.ts';
import { registerBattleContent } from '../../../src/app/screens/BattleScreenContent.ts';
import { setupForChapter, setupForNextLink } from '../../../src/app/screens/BattleScreenSetup.ts';
import { getChapter } from '../../../src/data/encounters.ts';
import { lastSummoningGroup } from '../../../src/data/ffx/enemies/last-summoning-chain.ts';
import { LAST_SUMMONING_ID, OFFERING_NEXT_ID, type OfferingKey, groupIdForPick, linkGroupId } from '../../../src/data/ffx/last-summoning-ids.ts';
import { intendedStrategy } from '../../../src/engine/BattlePresenterStrategies.ts';

export type Line = 'intended' | 'naive';

type Input = Extract<Decision, { kind: 'player-input' }>;

/** One fought link. */
export interface LinkRecord {
  /** 1-based position in the chain. */
  link: number;
  /** The formation's id (`last-summoning:<order>`). */
  group: string;
  /** The aeon that was fought, or `'yu-yevon'` for the last link. */
  fought: OfferingKey | 'yu-yevon';
  outcome: string;
  /** Player turns taken (the party's and the aeons'). */
  turns: number;
  /** The engine's tick clock at the end of the link (the link's length). */
  ticks: number;
  /** How many of the three active members were knocked out at the end. */
  partyDown: number;
  /** One of the player's aeons stood on the field when the link ended. */
  aeonStanding: boolean;
  /** The ids of the player's aeons summoned during the link, in order. */
  summoned: string[];
}

/** One whole chain. */
export interface ChainRun {
  order: OfferingKey[];
  seed: number;
  line: Line;
  links: LinkRecord[];
  /** `victory` when Yu Yevon fell, the first non-victory outcome otherwise, `cap` if the turn cap stopped it. */
  outcome: string;
  /** The final engine state (the last link's), for assertions. */
  last: BattleState;
}

/** The first enabled Attack, else the first enabled row, on its first valid target: the naive line (the golden test's fallback). */
function naive(d: Input): Command {
  const row = d.commands.find((c) => c.enabled && c.command.kind === 'attack') ?? d.commands.find((c) => c.enabled);
  if (!row) return { kind: 'defend', targets: [] } as Command;
  const t = row.validTargets[0];
  return { ...row.command, targets: t ? [t] : [] } as Command;
}

/** The chapter's first setup, standing on the link of `order[0]` instead of the placeholder opener (what the chain loop does after the first offering). */
export async function firstLinkSetup(order: readonly OfferingKey[], seed: number): Promise<{ setup: BattleSetup; group: EnemyGroupDef }> {
  await registerBattleContent();
  const chapter = getChapter(LAST_SUMMONING_ID)!;
  const group = lastSummoningGroup(linkGroupId([order[0]!]))!;
  return { setup: { ...setupForChapter(chapter, seed), enemies: group, canEscape: false }, group };
}

export function newEngine(setup: BattleSetup): FFXEngine {
  const engine = new FFXEngine({ autoResolveMinigames: true });
  engine.setSeed(setup.seed);
  engine.init(setup);
  return engine;
}

/** The party's three active members. */
export function activeMembers(engine: BattleEngine): FFXCombatant[] {
  const s = engine.state();
  return s.activeIds.map((id) => s.combatants[id] as FFXCombatant);
}

/**
 * Play the chain for `order` (all the keys, in the order the player gives them up) on one seed. `maxTurns` bounds the player turns of the whole chain. With `stopAfter` the chain stops after that many links
 * (a bench of the early links need not play the rest).
 */
export async function playOrder(
  order: readonly OfferingKey[],
  seed: number,
  opts: { line?: Line; maxTurns?: number; stopAfter?: number } = {},
): Promise<ChainRun> {
  const line = opts.line ?? 'intended';
  const maxTurns = opts.maxTurns ?? 4000;
  let { setup, group } = await firstLinkSetup(order, seed);
  const engine = newEngine(setup);
  const links: LinkRecord[] = [];
  let outcome = 'cap';
  let turns = 0;
  let linkTurns = 0;
  let summoned: string[] = [];
  let pos = 0; // how many offerings have been answered
  for (let step = 0; step < 1_000_000 && turns < maxTurns; step++) {
    const d: Decision = engine.nextDecision();
    if (d.kind === 'resolved' || d.kind === 'waiting') continue;
    if (d.kind === 'battle-over') {
      const state = engine.state();
      const fought = pos < order.length ? order[pos]! : ('yu-yevon' as const);
      const isYuYevon = group.id.endsWith('+yu-yevon');
      links.push({
        link: links.length + 1,
        group: group.id,
        fought: isYuYevon ? 'yu-yevon' : fought,
        outcome: d.result.outcome,
        turns: linkTurns,
        ticks: state.ticks,
        partyDown: activeMembers(engine).filter((c) => !c.alive).length,
        aeonStanding: state.aeonId !== null && (state.combatants[state.aeonId]?.alive ?? false),
        summoned,
      });
      outcome = d.result.outcome;
      if (outcome !== 'victory' || !group.nextGroupId) break;
      if (opts.stopAfter !== undefined && links.length >= opts.stopAfter) break;
      let nextId = group.nextGroupId;
      if (nextId === OFFERING_NEXT_ID) {
        pos += 1;
        nextId = groupIdForPick(order.slice(0, pos), order[pos]!);
      }
      const next = lastSummoningGroup(nextId);
      if (!next) throw new Error(`last-summoning drive: no formation for ${nextId}`);
      setup = setupForNextLink(setup, next, state, seed + links.length);
      group = next;
      linkTurns = 0;
      summoned = [];
      engine.setSeed(setup.seed);
      engine.init(setup);
      continue;
    }
    turns += 1;
    linkTurns += 1;
    const command = line === 'naive' ? naive(d) : (intendedStrategy(d.actorId, d.commands, engine as never) ?? naive(d));
    if (command.kind === 'summon') summoned.push(command.id);
    engine.submit(command);
  }
  return { order: [...order], seed, line, links, outcome: links.length > 0 && links.every((l) => l.outcome === 'victory') && links.at(-1)!.fought === 'yu-yevon' ? 'victory' : outcome, last: engine.state() };
}

/** Every key, in the offering's own order. */
export const ALL_KEYS: readonly OfferingKey[] = ['valefor', 'ifrit', 'ixion', 'shiva', 'bahamut', 'anima', 'yojimbo', 'sisters'];
