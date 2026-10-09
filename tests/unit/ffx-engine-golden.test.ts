/**
 * **FFX engine goldens**: every listed FFX chapter, two seeds each, played by the chapter's own
 * line through its whole chain; the digest of every link's full event log (JSON, every field) is
 * pinned. Written before `src/battle/ffx/engine.ts` was split under the 400-line house limit
 * (advisor v4, 2026-09-28), so the split is proved to change nothing (AGENTS.md rules 3 and 7).
 *
 * A digest that moves means the engine's behaviour moved: that is a change to explain, never a
 * number to re-pin without a reason.
 *
 * Game case: FFX only (the FFX-2 engine has `ffx2-atb-golden.test.ts`).
 */

import { describe, expect, it } from 'vitest';
import type { BattleSetup, BattleState, Command, Decision, EnemyGroupDef } from '../../src/battle/common/types.ts';
import { FFXEngine } from '../../src/battle/ffx/index.ts';
import { registerBattleContent } from '../../src/app/screens/BattleScreenContent.ts';
import { findEnemyGroup, setupForChapter, setupForNextLink } from '../../src/app/screens/BattleScreenSetup.ts';
import { CHAPTERS } from '../../src/data/encounters.ts';
import { intendedStrategy } from '../../src/engine/BattlePresenterStrategies.ts';

type Input = Extract<Decision, { kind: 'player-input' }>;

function fallback(d: Input): Command {
  const row = d.commands.find((c) => c.enabled && c.command.kind === 'attack') ?? d.commands.find((c) => c.enabled);
  if (!row) return { kind: 'defend', targets: [] } as Command;
  const t = row.validTargets[0];
  return { ...row.command, targets: t ? [t] : [] } as Command;
}

function fnv(s: string): string {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619) >>> 0;
  return h.toString(16);
}

/** Digests of each link's whole log, then the outcome. */
async function goldenOf(chapterId: string, seed: number): Promise<string> {
  await registerBattleContent();
  const chapter = CHAPTERS.find((c) => c.id === chapterId)!;
  let setup: BattleSetup = setupForChapter(chapter, seed);
  let group: EnemyGroupDef = chapter.enemyGroupRef;
  const e = new FFXEngine({ autoResolveMinigames: true });
  e.setSeed(setup.seed);
  e.init(setup);
  const parts: string[] = [];
  let link = 1;
  for (let step = 0; step < 200_000; step++) {
    const d = e.nextDecision();
    if (d.kind === 'resolved' || d.kind === 'waiting') continue;
    if (d.kind === 'battle-over') {
      parts.push(`${fnv(JSON.stringify(e.state().log))}:${d.result.outcome}`);
      if (d.result.outcome !== 'victory' || !group.nextGroupId || link >= 12) break;
      const next = await findEnemyGroup(group.nextGroupId);
      if (!next) break;
      setup = setupForNextLink(setup, next, e.state() as BattleState, seed + link);
      group = next;
      link += 1;
      e.setSeed(setup.seed);
      e.init(setup);
      continue;
    }
    e.submit(intendedStrategy(d.actorId, d.commands, e as never) ?? fallback(d));
  }
  return parts.join(' ');
}

/**
 * Recorded on advisor-v4 at cf3306eb (main 1a81a8ed merged), before the split. Chapters II
 * (Yunalesca) and III (Braska's Final Aeon) re-pinned 2026-09-29 in main's merge of advisor-v4: D-274
 * (578e7f22, research §6.4.3's aeon rows for II and III) moves exactly these four digests, proved by
 * running this file on 578e7f22^ (18/18) and 578e7f22 (these four values, the other 14 unchanged).
 * Chapter III re-pinned again 2026-09-30 by r34fix-odfail (FFX only): a failed Swordplay/Bushido now
 * resolves its sourced Fail row (research §5.3, §5.5). The line's auto-rolled Energy Rain fails once
 * in link 6 of seed 1 and once in link 6 of seed 7 and now deals 20 DmgCon instead of 26, which moves
 * exactly those links' digests (and seed 7's link 7, which starts from link 6's end state); every
 * outcome is still victory, and with the fail wiring stubbed out this file is 18/18 on the old values.
 * Chapters II and III re-pinned 2026-10-01 by r34fix-od5 (FFX only): a clean Bushido now picks its
 * (Immune) row per target from the target's own immunities (research §5.5; Bailey D-310/D-311). Every
 * moved digest is an auto-rolled successful Shooting Star on an Eject-immune target now dealing 27
 * DmgCon instead of 24: Yunalesca (seeds 1 and 7, link 1), Possessed Valefor (link 2 of both seeds)
 * and Braska's Final Aeon (seed 7, link 1). Old and new trees replayed side by side; no other digest
 * moved and every outcome is unchanged.
 * Chapter VII (Anima, Macalania) re-pinned 2026-10-03 by r37-small (PR-0258, FFX only): an overkill now doubles
 * the killed enemy's item drops (research ffx-vs-ffx2-presentation §9; `results.ts#OVERKILL_DROP_MULTIPLIER`).
 * The line overkills a Guado Guardian on both seeds, so the victory event's drops change and nothing else:
 * with the multiplier stubbed to 1 this file is 18/18 on the old values, and the other 16 digests never moved.
 * All 18 digests re-baselined 2026-10-08 by re-parity W1 ("game-code parity", FFX only): the hit roll, the damage
 * variance, the critical roll and the damage chain now come from the kernels proven against FFX.exe
 * (src/battle/ffx/kernel/), through src/battle/ffx/adapt/ and hit-apply.ts, drawn in the game's order (hit, variance,
 * critical; targets outer, hits inner) and fed the game's own command flags (src/data/ffx/command-records/). Every
 * log moves because the draw order and the formulas moved, which is the point, and
 * tests/unit/parity-ffx-engine-wiring.test.ts is the proof that the engine computes what the kernels compute. Four
 * outcomes moved, all on seeds that were not tuned: seymour-flux#7 victory -> defeat (Cross Cleave never misses in
 * the game's record), seymour-omnis#1 victory -> defeat, seymour-natus#1 and #7 defeat -> victory; the other 14 keep
 * their outcome. The per-chapter causes are in docs/handoff/re-parity-w1.md. The old values are in git history (the
 * commit before the one that moved them).
 * Chapter III re-baselined a second time the same day, same track (FFX only): the five possessed aeons' plain Attack runs
 * on the game's monster-side record 0x6000 (accuracy formula 2 on a byte of 90, physical, cannot crit) and not on the
 * party's Attack record, so about half of it misses, as the record says (the old engine never missed). That moves the
 * digests of the links where a possessed aeon attacks (seed 1: links 5 to 7; seed 7: links 3 to 7); every outcome is still
 * victory and no other digest moved.
 * Chapter II re-baselined 2026-10-08 by re-parity AI lane B ("game-script parity", FFX only): Yunalesca runs the game's own
 * script (research/re-ffx-ai-yunalesca-bfa.md section 2) through the engine's new hit events (hit-hooks.ts, hit-event.ts).
 * Her counters follow every action that reaches her, a form changes after the last hit of the action that ended it, her
 * anti-aeon Mind Blast and Osmose land on the aeon on the field, Form II's counter advances on aeon turns, and a pick draws
 * only with two or more candidates. Both digests move (yunalesca#1 victory -> defeat, #7 still a victory); no other
 * chapter's digest moved.
 * Chapter III re-baselined 2026-10-09 by re-parity AI lane B ("game-script parity", FFX only): Braska's Final Aeon, the Yu
 * Pagodas, the five possessed aeons and Yu Yevon run the game's own scripts (research/re-ffx-ai-yunalesca-bfa.md sections 3
 * to 6) through the same hit events. His gauge is the script's fixed arithmetic, his moves its tables, a Pagoda returns with
 * the damage it absorbed after two or three of its own turns, a possessed aeon aims and rolls as its script says, a
 * character the fayth revives acts next, and Yu Yevon casts Gravija on every turn after his first, on the front line and
 * himself. Both digests move (braskas-final-aeon#1 seven victories -> a defeat on link 1, #7 seven victories again); no other
 * chapter's digest moved.
 */
const GOLDEN: Record<string, string> = {
  'seymour-flux#1': '28692f2c:defeat',
  'seymour-flux#7': 'f923eb10:defeat',
  'yunalesca#1': '92593bcc:defeat',
  'yunalesca#7': 'a986c071:victory',
  'braskas-final-aeon#1': '8e66e41a:defeat',
  'braskas-final-aeon#7': '4d03bcf:victory ecf9d5ca:victory 73095ebb:victory 7da3a6c6:victory 769c43e:victory 56db843f:victory 4a48b320:victory',
  'seymour-anima-macalania#1': '15ecc081:victory',
  'seymour-anima-macalania#7': '86868cbf:victory',
  'evrae-airship#1': '14674509:victory',
  'evrae-airship#7': '3c97dd63:victory',
  'yojimbo-cavern#1': 'fce6b795:victory',
  'yojimbo-cavern#7': 'c3a419df:victory',
  'seymour-natus#1': 'd4682a0e:victory',
  'seymour-natus#7': '2133d3d8:victory',
  'seymour-omnis#1': 'b7b53dbe:defeat',
  'seymour-omnis#7': '1a2a42df:victory',
  'isaaru-via-purifico#1': 'd916c9d0:victory bc11f7e3:victory 42ea7beb:victory',
  'isaaru-via-purifico#7': 'b073037f:victory 584e6881:victory e0f5e2d6:victory',
};

describe('FFX engine goldens (every FFX chapter, the line, whole chain)', () => {
  const ids = ['seymour-flux', 'yunalesca', 'braskas-final-aeon', 'seymour-anima-macalania', 'evrae-airship', 'yojimbo-cavern', 'seymour-natus', 'seymour-omnis', 'isaaru-via-purifico'];
  for (const id of ids) {
    for (const seed of [1, 7]) {
      it(`${id} seed ${seed}`, async () => {
        const got = await goldenOf(id, seed);
        const want = GOLDEN[`${id}#${seed}`];
        if (want === undefined) {
          process.stderr.write(`[golden] '${id}#${seed}': '${got}',\n`);
          expect(got.length).toBeGreaterThan(0);
        } else {
          expect(got).toBe(want);
        }
      }, 300_000);
    }
  }
});
