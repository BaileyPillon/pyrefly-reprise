/**
 * BATCH 2 + BATCH 3 TOGETHER: THE CROSS-LANE CHECKS THAT NEED THE WHOLE LIST (release 71, branch `booth-b3`, the merge of `booth-b2` with `booth-ffx-b3a`, `booth-ffx-b3b` and `booth-ffx2-b3`; both games for the checks).
 *
 * Each lane tested its own chapters against the others as they were on its base. These read the merged list from the source (`TREATED_CHAPTERS`), so a chapter that joins is covered with no edit:
 *
 *  1. THE F1 RIBBON'S BOSS (`HeadlineBoss.ts`, `HudF1.sync`): for EVERY link of EVERY treated chapter, in both games, the foe the ribbon names is the formation's declared boss when one is on the field and
 *     otherwise the first visible non-part foe; a declared boss is a foe of its own formation; and the only links where the ribbon's foe and the formation's written `headline` disagree are the ones listed
 *     in `HEADLINE_DISAGREES` (a finding carried to the driver, not a defect this merge can fix without a data row).
 *  2. `ProAutoStage.SCRIPTED_RIGS` stays FFX-2's: no row names a chapter that is not FFX-2, and every row names a treated FFX-2 chapter.
 *  3. THE HOLD GUARD: a chapter on both `TREATED_CHAPTERS` and `SwapSwitch.SCOPE_EXCEPTIONS` holds `smear` (`booth-hold-guard` reads the two lists; the merged list is fourteen).
 *  4. THE KNOCK-OUT RULE'S INVARIANT over the merged list is in `tests/unit/engine/booth-b2-ko-rule.test.ts`; here, that no treated chapter's hold names a piece outside `TREATED_PIECES`.
 *
 * THE r70 VERDICT PASS (2026-10-31, `docs/handoff/booth-b3.md` section 12) took four chapters back off the list (the list is ten). The ribbon walk is a function of the data and not of the list, so it still walks the withdrawn four (`BRANCH`):
 * the ribbon of each is pinned for the day one line puts it back. The hold and the stand-down tables keep the withdrawn chapters' rows, unread.
 */
import { afterEach, describe, expect, it } from 'vitest';
import type { BattleState, Combatant, EnemyGroupDef } from '../../src/battle/common/types.ts';
import { headlineEnemy } from '../../src/battle/common/headlineEnemy.ts';
import { getChapter } from '../../src/data/encounters.ts';
import { findEnemyGroup } from '../../src/app/screens/BattleScreenSetup.ts';
import { TREATED_CHAPTERS, TREATED_PIECES, PIECE_HOLDS, setTreatedScope, treatedHold } from '../../src/engine/motion/DemoGate.ts';
import { SCRIPTED_RIGS } from '../../src/engine/procam/ProAutoStage.ts';
import { SCOPE_EXCEPTIONS } from '../../src/engine/motion/SwapSwitch.ts';
import { WITHDRAWN_R70 } from './booth-r70-withdrawn.ts';

afterEach(() => setTreatedScope(null));

/** Every chapter the branch built a treatment for: the ten on the list and the four the r70 verdicts took back off it (the ribbon's boss does not depend on the list). */
const BRANCH: readonly string[] = [...Object.keys(TREATED_CHAPTERS), ...Object.keys(WITHDRAWN_R70)];

/** The state `headlineEnemy` reads, as a link begins: its formation's foes, parts and waiting forms flagged as the data flags them. */
function opening(group: EnemyGroupDef): BattleState {
  const combatants: Record<string, Combatant> = {};
  for (const e of group.enemies) combatants[e.id] = { id: e.id, name: e.name, side: 'enemy', removed: false, flags: { ...e.flags } } as unknown as Combatant;
  return { combatants, enemyIds: group.enemies.map((e) => e.id) } as unknown as BattleState;
}

interface Link {
  readonly chapter: string;
  readonly index: number;
  readonly group: string;
  readonly declared: string | undefined;
  readonly ribbon: string | undefined;
  readonly ribbonName: string | undefined;
  readonly headline: string | undefined;
}

async function links(chapterId: string): Promise<Link[]> {
  const out: Link[] = [];
  let g: EnemyGroupDef | null = getChapter(chapterId)!.enemyGroupRef;
  const seen = new Set<string>();
  while (g && !seen.has(g.id)) {
    seen.add(g.id);
    const state = opening(g);
    const boss = headlineEnemy(state, g.bossId);
    out.push({ chapter: chapterId, index: out.length + 1, group: g.id, declared: g.bossId, ribbon: boss?.id, ribbonName: boss?.name, headline: g.headline });
    g = g.nextGroupId ? await findEnemyGroup(g.nextGroupId) : null;
  }
  return out;
}

/**
 * The links where the foe the ribbon names is not the foe the formation's written `headline` names. Chapter XI's second link stages the Magus Sisters, and the ribbon (and the card, were it shown there) names
 * the first sister; a declared `bossId` is the data row that would name them differently, and none is owed by this merge (an open question of `docs/handoff/booth-b3.md`).
 */
const HEADLINE_DISAGREES: Readonly<Record<string, readonly number[]>> = { 'ffx2-fallen-aeons': [2] };

describe('the F1 ribbon names the right foe in every link of every treated chapter, both games', () => {
  it('every treated chapter has a chain the walk can follow, and its first link is the chapter\'s own', async () => {
    for (const id of BRANCH) {
      const ls = await links(id);
      expect(ls.length, id).toBeGreaterThan(0);
      expect(ls[0]!.group, id).toBe(getChapter(id)!.enemyGroupRef.id);
    }
  });

  it('a declared boss is a foe of its own formation, named by the ribbon when it stands on the field; otherwise the first visible non-part foe is named', async () => {
    for (const id of BRANCH) {
      for (const l of await links(id)) {
        expect(l.ribbon, `${id} link ${l.index}`).toBeDefined();
        if (l.declared !== undefined) {
          const g = (await findEnemyGroup(l.group))!;
          expect(g.enemies.map((e) => e.id), `${id} link ${l.index} declared ${l.declared}`).toContain(l.declared);
          const onField = g.enemies.find((e) => e.id === l.declared && !e.flags.hidden && !e.flags.isPart);
          expect(l.ribbon, `${id} link ${l.index}`).toBe(onField ? l.declared : l.ribbon);
        }
      }
    }
  });

  it('the declared bosses of the treated chapters are exactly Chapter VII\'s Seymour (the others name the first visible foe), and the ribbon of no treated link is a part or a waiting form', async () => {
    const declared: string[] = [];
    for (const id of BRANCH) {
      for (const l of await links(id)) {
        if (l.declared !== undefined) declared.push(`${id}:${l.index}:${l.declared}`);
        const g = (await findEnemyGroup(l.group))!;
        const foe = g.enemies.find((e) => e.id === l.ribbon)!;
        expect(foe.flags.isPart ?? false, `${id} link ${l.index} ${l.ribbon}`).toBe(false);
        expect(foe.flags.hidden ?? false, `${id} link ${l.index} ${l.ribbon}`).toBe(false);
      }
    }
    expect(declared).toEqual(['seymour-anima-macalania:1:seymour-macalania']);
  });

  it('where a formation writes a headline for its reveal plate, the ribbon agrees with it except in the listed links', async () => {
    const disagree: Record<string, number[]> = {};
    for (const id of BRANCH) {
      for (const l of await links(id)) {
        if (l.headline === undefined || l.ribbonName === undefined) continue;
        const same = l.headline.toLowerCase().includes(l.ribbonName.toLowerCase()) || l.ribbonName.toLowerCase().includes(l.headline.toLowerCase());
        if (!same) (disagree[id] ??= []).push(l.index);
      }
    }
    expect(disagree).toEqual(HEADLINE_DISAGREES);
  });
});

describe('the follower\'s stand-down table and the hold guard over the merged list', () => {
  it('SCRIPTED_RIGS names only treated FFX-2 chapters (FFX has no follower), and holds a row for Chapter XI and for Chapter XIII', () => {
    const ids = Object.keys(SCRIPTED_RIGS);
    expect(ids.sort()).toEqual(['ffx2-fallen-aeons', 'ffx2-trema']);
    for (const id of ids) expect(TREATED_CHAPTERS[id]?.game ?? WITHDRAWN_R70[id]?.game, id).toBe('ffx2'); // both are treated FFX-2 chapters since booth-ffx2-b4-sky put Chapter XI back
    expect(Object.keys(TREATED_CHAPTERS).filter((id) => ids.includes(id)).sort()).toEqual(['ffx2-fallen-aeons', 'ffx2-trema']);
    // and both hold the camera, so neither stand-down is read while the follower is held (Chapter XI: it crops Yuna; Chapter XIII: it undoes the giants frame)
    for (const id of ids) expect(treatedHold(id, 'cam'), id).toBeDefined();
  });

  it('every chapter on both the treated list and the swap exceptions holds the smear (the merged list was fourteen; the r70 verdicts left ten; booth-ffx2-b4-sky put Chapters V and XI back: twelve, and neither is a swap exception)', () => {
    expect(Object.keys(TREATED_CHAPTERS)).toHaveLength(12);
    const exceptions = Object.keys(SCOPE_EXCEPTIONS);
    const both = Object.keys(TREATED_CHAPTERS).filter((id) => exceptions.includes(id));
    expect(both).toEqual(['yunalesca']); // evrae-airship, sin-face and ffx2-ixion-djose are exceptions that the treatment has not reached
    for (const id of both) expect(treatedHold(id, 'smear'), id).toBeDefined();
  });

  it('every hold in the table names a real piece, and none belongs to the booth pair or an unlisted chapter', () => {
    for (const [id, rows] of Object.entries(PIECE_HOLDS)) {
      expect(TREATED_CHAPTERS[id] ?? WITHDRAWN_R70[id], id).toBeDefined(); // a withdrawn chapter's rows stay, unread
      expect(['seymour-flux', 'ffx2-bahamut'], id).not.toContain(id);
      for (const piece of Object.keys(rows)) expect(TREATED_PIECES, `${id} ${piece}`).toContain(piece);
    }
  });
});
