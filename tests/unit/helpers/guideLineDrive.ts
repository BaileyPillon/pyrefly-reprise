/**
 * Headless driver for the strategy guide's own line (`src/engine/tactics/guide-line.ts`): plays any
 * registered chapter through the app's own chapter setup, every link of a chain, answering each open
 * decision with a pluggable strategy.
 *
 * Shared by `guide-line.test.ts` (legality at every decision), `guide-line-words.test.ts` (the panel's
 * real text on real boards) and `guide-line-bench.test.ts` (the measurement). **Game case: both**
 * [AGENTS.md rule 14]: FFX chapters run on the CTB engine, FFX-2 chapters on the ATB engine in Wait
 * mode with no decision time (the bench speed every FFX-2 bench uses).
 *
 * A strategy only picks among rows the engine offered, so nothing here cheats. **Measure, never tune.**
 */

import type {
  AvailableCommand,
  BattleEngine,
  BattleSetup,
  BattleState,
  Command,
  EnemyGroupDef,
} from '../../../src/battle/common/types.ts';
import { CHAPTERS, type Chapter } from '../../../src/data/encounters.ts';
import { setupForChapter, setupForNextLink } from '../../../src/app/screens/BattleScreenSetup.ts';
import { FFXContentRegistry, createFFXEngine } from '../../../src/battle/ffx/index.ts';
import { FFX2Engine } from '../../../src/battle/ffx2/index.ts';
import { ALL_ABILITIES, ENEMY_GROUPS_BY_ID as FFX_GROUPS, ITEMS } from '../../../src/data/ffx/index.ts';
import { ENEMY_GROUPS_BY_ID as FFX2_GROUPS } from '../../../src/data/ffx2/index.ts';
import type { AutoStrategy } from '../../../src/engine/BattlePresenter.ts';
import { ffx2Options } from './ffx2ChapterDrive.ts';

/** One open decision, as the driver hands it to a strategy and to the observer. */
export interface PlayedDecision {
  state: Readonly<BattleState>;
  actorId: string;
  commands: AvailableCommand[];
  /** What the strategy chose (`null` when it declined and the fallback played). */
  picked: Command | null;
  /** 1-based link of the chain this decision belongs to. */
  link: number;
}

export interface PlayResult {
  /** `'victory'`, `'defeat'`, ..., or `'cap'` when the decision cap ran out first. */
  outcome: string;
  decisions: number;
  links: number;
}

export interface PlayOptions {
  /** Stop after this many player decisions (default 6000: a whole chain). */
  maxDecisions?: number;
  /** Called at every open decision, before the command is submitted. */
  onDecision?: (d: PlayedDecision, engine: BattleEngine) => void;
}

const ffxContent = new FFXContentRegistry();
ffxContent.addAbilities(ALL_ABILITIES);
ffxContent.addItems(Object.values(ITEMS));

const GROUPS: Readonly<Record<string, EnemyGroupDef>> = { ...FFX_GROUPS, ...FFX2_GROUPS };

/** Every chapter the guide covers, in play order: the listed ones, FFX and FFX-2. */
export function guidedChapters(): readonly Chapter[] {
  return CHAPTERS.filter((c) => c.game === 'ffx' || c.game === 'ffx2');
}

function fallback(commands: readonly AvailableCommand[]): Command {
  const row = commands.find((c) => c.enabled && c.command.kind === 'attack') ?? commands.find((c) => c.enabled);
  if (!row) return { kind: 'defend', targets: [] };
  const target = row.validTargets[0];
  return { ...row.command, targets: row.command.targets.length ? row.command.targets : target ? [target] : [] } as Command;
}

/** The registered engine for the chapter's game, set up for `seed`. */
function engineFor(chapter: Chapter, seed: number): { engine: BattleEngine; setup: BattleSetup } {
  const setup = setupForChapter(chapter, seed);
  const engine: BattleEngine =
    chapter.game === 'ffx'
      ? createFFXEngine({ content: ffxContent, autoResolveMinigames: true })
      : new FFX2Engine(ffx2Options({ atbMode: 'wait' }));
  engine.setSeed(seed);
  engine.init(setup);
  return { engine, setup };
}

/** Play one chapter to its end (every link) with `strategy`. */
export function playChapter(
  chapterId: string,
  seed: number,
  strategy: AutoStrategy,
  options: PlayOptions = {},
): PlayResult {
  const chapter = CHAPTERS.find((c) => c.id === chapterId);
  if (!chapter) throw new Error(`no chapter ${chapterId}`);
  const cap = options.maxDecisions ?? 6000;
  const started = engineFor(chapter, seed);
  const engine = started.engine;
  let setup = started.setup;
  let group: EnemyGroupDef = setup.enemies;
  let decisions = 0;
  let links = 1;
  for (let guard = 0; guard < 400_000 && decisions < cap; guard++) {
    const d = engine.nextDecision();
    if (d.kind === 'battle-over') {
      const outcome = d.result.outcome;
      const next = group.nextGroupId ? GROUPS[group.nextGroupId] : undefined;
      if (outcome !== 'victory' || !next) return { outcome, decisions, links };
      setup = setupForNextLink(setup, next, engine.state(), seed + links);
      group = next;
      links += 1;
      engine.setSeed(setup.seed);
      engine.init(setup);
      continue;
    }
    if (d.kind === 'waiting') {
      (engine as FFX2Engine).tick(Math.max(1, d.nextEventMs));
      continue;
    }
    if (d.kind !== 'player-input') continue;
    decisions += 1;
    const picked = strategy(d.actorId, d.commands, engine);
    options.onDecision?.({ state: engine.state(), actorId: d.actorId, commands: d.commands, picked, link: links }, engine);
    engine.submit(picked ?? fallback(d.commands));
  }
  return { outcome: 'cap', decisions, links };
}

/** Is `command` something the offered rows allow: an enabled row of the same kind and id, aimed at legal targets? */
export function isLegal(command: Command, commands: readonly AvailableCommand[]): boolean {
  const id = 'id' in command ? String((command as { id?: unknown }).id) : '';
  return commands.some((row) => {
    if (!row.enabled || row.command.kind !== command.kind) return false;
    const rowId = 'id' in row.command ? String((row.command as { id?: unknown }).id) : '';
    if (rowId !== id) return false;
    if (command.kind === 'switch' && row.command.kind === 'switch') return row.command.extra.inId === command.extra.inId;
    return command.targets.every((t) => row.validTargets.includes(t));
  });
}
