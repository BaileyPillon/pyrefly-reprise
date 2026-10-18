/**
 * The digest of a whole FFX chain (Last Summoning lane; **FFX only**): the chapter's own line plays every link on the real engine and the
 * full event log of each link is hashed (JSON, every field), then the outcome. The same shape as `ffx-engine-golden.test.ts#goldenOf`, with a
 * stronger hash (SHA-256, 16 hex characters a link) so a pin on twelve seeds is evidence rather than a checksum.
 *
 * Used by `tests/unit/chapters/last-summoning-iii-pin.test.ts`: Chapter III (Braska's Final Aeon, the five mandatory possessed aeons, Yu
 * Yevon) must play byte for byte as it did before the hidden chapter was built on top of its data and its engine.
 */

import { createHash } from 'node:crypto';
import type { BattleSetup, BattleState, Command, Decision, EnemyGroupDef } from '../../../src/battle/common/types.ts';
import { FFXEngine } from '../../../src/battle/ffx/index.ts';
import { registerBattleContent } from '../../../src/app/screens/BattleScreenContent.ts';
import { findEnemyGroup, setupForChapter, setupForNextLink } from '../../../src/app/screens/BattleScreenSetup.ts';
import { CHAPTERS } from '../../../src/data/encounters.ts';
import { intendedStrategy } from '../../../src/engine/BattlePresenterStrategies.ts';

type Input = Extract<Decision, { kind: 'player-input' }>;

/** The first enabled Attack, else the first enabled row, on its first valid target (the golden test's fallback). */
function fallback(d: Input): Command {
  const row = d.commands.find((c) => c.enabled && c.command.kind === 'attack') ?? d.commands.find((c) => c.enabled);
  if (!row) return { kind: 'defend', targets: [] } as Command;
  const t = row.validTargets[0];
  return { ...row.command, targets: t ? [t] : [] } as Command;
}

/** Sixteen hex characters of the SHA-256 of `s`. */
export function sha16(s: string): string {
  return createHash('sha256').update(s).digest('hex').slice(0, 16);
}

/** One chain's digest: each link's `hash:outcome`, space separated. */
export interface ChainDigest {
  /** `<sha16 of the link's whole log>:<outcome>` per link. */
  parts: string[];
  /** The ids of the formations fought, in order. */
  groups: string[];
  /** How many links were fought. */
  links: number;
}

/** Play a listed chapter's whole chain on one seed with the chapter's own line, and digest it. */
export async function chapterChainDigest(chapterId: string, seed: number): Promise<ChainDigest> {
  await registerBattleContent();
  const chapter = CHAPTERS.find((c) => c.id === chapterId)!;
  let setup: BattleSetup = setupForChapter(chapter, seed);
  let group: EnemyGroupDef = chapter.enemyGroupRef;
  const e = new FFXEngine({ autoResolveMinigames: true });
  e.setSeed(setup.seed);
  e.init(setup);
  const parts: string[] = [];
  const groups: string[] = [group.id];
  let link = 1;
  for (let step = 0; step < 400_000; step++) {
    const d = e.nextDecision();
    if (d.kind === 'resolved' || d.kind === 'waiting') continue;
    if (d.kind === 'battle-over') {
      parts.push(`${sha16(JSON.stringify(e.state().log))}:${d.result.outcome}`);
      if (d.result.outcome !== 'victory' || !group.nextGroupId || link >= 12) break;
      const next = await findEnemyGroup(group.nextGroupId);
      if (!next) break;
      setup = setupForNextLink(setup, next, e.state() as BattleState, seed + link);
      group = next;
      groups.push(group.id);
      link += 1;
      e.setSeed(setup.seed);
      e.init(setup);
      continue;
    }
    e.submit(intendedStrategy(d.actorId, d.commands, e as never) ?? fallback(d));
  }
  return { parts, groups, links: link };
}
