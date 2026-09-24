/**
 * Headless drivers for the combat-fixes-0924 bench (`docs/plans/combat-fixes-0924-review.md`).
 *
 * - FFX-2 chapters IV, V and VI through their whole chain, Wait mode, 0 ms a menu (the bench speed
 *   every earlier FFX-2 bench used), with any {@link AutoStrategy}.
 * - FFX Chapter I (Seymour Flux) and Chapter III's first link (Braska's Final Aeon), CTB.
 *
 * A strategy only picks from rows the engine offered, so nothing here cheats. **Measure, never tune.**
 * Game case: FFX-2 helpers for (a), FFX helpers for (b) and (c) [AGENTS.md rule 14].
 */

import type {
  AbilityDef,
  AvailableCommand,
  BattleEngine,
  BattleEvent,
  BattleSetup,
  Command,
  EnemyGroupDef,
} from '../../../src/battle/common/types.ts';
import { FFX2Engine, defaultAbilities } from '../../../src/battle/ffx2/index.ts';
import * as x2 from '../../../src/data/ffx2/index.ts';
import { bevelleBuild } from '../../../src/data/ffx2/builds/bevelle.ts';
import { farplaneBuild } from '../../../src/data/ffx2/builds/farplane.ts';
import { chateauBuild } from '../../../src/data/ffx2/builds/chateau.ts';
import { LEBLANC_CHAIN_ORDER } from '../../../src/data/ffx2/enemies/leblanc-syndicate.ts';
import { VEGNAGUN_CHAIN_ORDER } from '../../../src/data/ffx2/ids.ts';
import { setupForNextLink } from '../../../src/app/screens/BattleScreenSetup.ts';
import type { AutoStrategy } from '../../../src/engine/BattlePresenter.ts';
import { FFXContentRegistry, createFFXEngine } from '../../../src/battle/ffx/index.ts';
import { ALL_ABILITIES, ENEMY_GROUPS_BY_ID, ITEMS } from '../../../src/data/ffx/index.ts';
import { gagazetBuild } from '../../../src/data/ffx/builds/gagazet.ts';
import { dreamsEndBuild } from '../../../src/data/ffx/builds/dreams-end.ts';
import { ffx2Options } from './ffx2ChapterDrive.ts';

export interface Run {
  outcome: string;
  logs: BattleEvent[][];
}

function fallback(commands: readonly AvailableCommand[]): Command {
  const row = commands.find((c) => c.enabled && c.command.kind === 'attack') ?? commands.find((c) => c.enabled);
  if (!row) return { kind: 'defend', targets: [] };
  const target = row.validTargets[0];
  return { ...row.command, targets: row.command.targets.length ? row.command.targets : target ? [target] : [] } as Command;
}

/** Answer every decision of one battle; returns the outcome. */
function runBattle(engine: BattleEngine, strategy: AutoStrategy, maxDecisions = 30_000): string {
  for (let i = 0; i < maxDecisions; i++) {
    const d = engine.nextDecision();
    if (d.kind === 'battle-over') return d.result.outcome;
    if (d.kind === 'waiting') {
      (engine as FFX2Engine).tick(Math.max(1, d.nextEventMs));
      continue;
    }
    if (d.kind !== 'player-input') continue;
    const picked = strategy(d.actorId, d.commands, engine);
    engine.submit(picked ?? fallback(d.commands));
  }
  return 'unfinished';
}

export type Ffx2Chapter = 4 | 5 | 6;

/** One FFX-2 chapter, every link, Wait mode, no retry. */
export function driveFfx2(chapter: Ffx2Chapter, seed: number, strategy: AutoStrategy): Run {
  const engine = new FFX2Engine(ffx2Options({ atbMode: 'wait' }));
  const order: readonly string[] =
    chapter === 4 ? ['ffx2-bahamut'] : chapter === 5 ? VEGNAGUN_CHAIN_ORDER : LEBLANC_CHAIN_ORDER;
  const party = chapter === 4 ? bevelleBuild : chapter === 5 ? farplaneBuild : chateauBuild;
  const first = x2.ENEMY_GROUPS_BY_ID[order[0]!];
  if (!first) throw new Error(`chapter ${chapter}: no group ${order[0]}`);
  let group: EnemyGroupDef = first;
  let setup: BattleSetup = { game: 'ffx2', party, enemies: group, triggers: [], seed, condition: 'normal', canEscape: false };
  engine.setSeed(seed);
  engine.init(setup);
  const logs: BattleEvent[][] = [];
  let links = 0;
  for (;;) {
    const outcome = runBattle(engine, strategy);
    logs.push([...engine.state().log]);
    links += 1;
    if (outcome !== 'victory' || !group.nextGroupId) return { outcome, logs };
    const next: EnemyGroupDef | undefined = x2.ENEMY_GROUPS_BY_ID[group.nextGroupId];
    if (!next) throw new Error(`chain points at ${group.nextGroupId} with no formation`);
    setup = setupForNextLink(setup, next, engine.state(), seed + links) as BattleSetup;
    group = next;
    engine.setSeed(setup.seed);
    engine.init(setup);
  }
}

/** The FFX-2 ability an id names: the data table first, then the engine's fallback table. */
export function ffx2Ability(id: string | undefined): AbilityDef | undefined {
  if (!id) return undefined;
  return (x2.ABILITIES as Record<string, AbilityDef>)[id] ?? defaultAbilities.get(id);
}

export interface MagicMisses {
  /** A party member's magical action evaded by an enemy. */
  partyMagicEvaded: number;
  /** An enemy's magical action evaded by a party member. */
  enemyMagicEvaded: number;
  partyMagicLanded: number;
  enemyMagicLanded: number;
}

/** Count `evaded` misses and landed damage from magical actions, by the side that cast them. */
export function magicMisses(logs: readonly BattleEvent[][]): MagicMisses {
  const out: MagicMisses = { partyMagicEvaded: 0, enemyMagicEvaded: 0, partyMagicLanded: 0, enemyMagicLanded: 0 };
  for (const log of logs) {
    const current = new Map<string, string | undefined>();
    const side = new Map<string, string>();
    for (const e of log) {
      if (e.type === 'action-start') {
        current.set(e.actorId, e.abilityId);
        continue;
      }
      if (e.type !== 'miss' && e.type !== 'damage') continue;
      const src = e.sourceId;
      if (!src) continue;
      const def = ffx2Ability(current.get(src));
      if (!def || def.damageType !== 'magical') continue;
      if (!side.has(src)) side.set(src, src.startsWith('yuna') || src.startsWith('rikku') || src.startsWith('paine') ? 'party' : 'enemy');
      const isParty = side.get(src) === 'party';
      if (e.type === 'miss' && e.reason === 'evaded') {
        if (isParty) out.partyMagicEvaded += 1;
        else out.enemyMagicEvaded += 1;
      } else if (e.type === 'damage' && e.amount > 0) {
        if (isParty) out.partyMagicLanded += 1;
        else out.enemyMagicLanded += 1;
      }
    }
  }
  return out;
}

const ffxContent = new FFXContentRegistry();
ffxContent.addAbilities(ALL_ABILITIES);
ffxContent.addItems(Object.values(ITEMS));

/** Chapter I, Seymour Flux on Mt. Gagazet (the Gagazet build). */
export function driveChapter1(seed: number, strategy: AutoStrategy): Run {
  const engine = createFFXEngine({ content: ffxContent, autoResolveMinigames: true });
  engine.init({ game: 'ffx', party: gagazetBuild, enemies: ENEMY_GROUPS_BY_ID['seymour-flux']!, triggers: [], seed, condition: 'normal', canEscape: false });
  const outcome = runBattle(engine, strategy, 8000);
  return { outcome, logs: [[...engine.state().log]] };
}

/** Chapter III's first link, Braska's Final Aeon (the Dream's End build). */
export function driveChapter3Bfa(seed: number, strategy: AutoStrategy): Run {
  const engine = createFFXEngine({ content: ffxContent, autoResolveMinigames: true });
  engine.init({ game: 'ffx', party: dreamsEndBuild, enemies: ENEMY_GROUPS_BY_ID['braskas-final-aeon']!, triggers: [], seed, condition: 'normal', canEscape: false });
  const outcome = runBattle(engine, strategy, 8000);
  return { outcome, logs: [[...engine.state().log]] };
}
