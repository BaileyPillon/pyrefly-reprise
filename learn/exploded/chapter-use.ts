/**
 * Which shipped pieces Chapter II actually uses.
 *
 * The approved inventory frame
 * (`docs/concepts/atlas/c-scene-exploded/c3-inventory.png`) outlines the
 * chapter's own pieces in gold. That frame carried a hand-written list; this
 * module derives the same set from the game's own committed data instead
 * (AGENTS.md hard rule 6), so it can never drift from the chapter:
 *
 * - the **backdrop** is the chapter's `sceneKey`;
 * - the **party subjects and portraits** are the chapter build's own members
 *   (`spriteKey`, `portraitKey`) and its summonable aeons (`spriteKey`);
 * - the **enemy subjects** are every `spriteKey` the chapter's formation and
 *   its forms answer to;
 * - the **pause plate** is the one the file convention names for this
 *   chapter, `ch<number>-<id>`, and only when the art manifest really has it.
 *
 * Nothing is claimed for the audio tiles: a chapter names three music cues,
 * but the inventory groups music and SFX into family tiles, and "this family
 * is used" is not something the chapter's data says.
 */

import type { EnemyDef, EnemyGroupDef } from '../../src/battle/common/types.ts';
import type { Chapter, ChapterId } from '../../src/data/encounters.ts';
import { getChapter } from '../../src/data/encounters.ts';

/** The painted-subject and portrait ids one chapter names, plus the music cue keys it declares. */
export interface ChapterUse {
  /** `manifest.subjects` ids: the party, its aeons, and the enemy formation. */
  readonly subjects: ReadonlySet<string>;
  /** `manifest.portraits` ids the chapter build itself names. */
  readonly portraits: ReadonlySet<string>;
  /** `manifest.backdrops` ids: the chapter's own scene. */
  readonly backdrops: ReadonlySet<string>;
  /** `manifest.pause` ids: the chapter's own plate, when one exists. */
  readonly pause: ReadonlySet<string>;
  /** The music cue keys the chapter declares (scene, battle, any phase cue, victory). */
  readonly music: ReadonlySet<string>;
}

function combatantsOf(group: EnemyGroupDef): readonly EnemyDef[] {
  return [...group.enemies, ...(group.parts ?? [])];
}

/** Every painted subject a formation puts on the field: each combatant's own key, and every form's. */
function enemySubjects(group: EnemyGroupDef): readonly string[] {
  return combatantsOf(group).flatMap((enemy) => [enemy.spriteKey, ...(enemy.forms ?? []).map((form) => form.spriteKey)]);
}

/**
 * What `chapter` uses, as ids that can be matched against the art manifest.
 * `pauseIds` is the manifest's own pause list: the plate is claimed only if
 * the convention-named file is really shipped.
 */
export function chapterUse(chapter: Chapter, pauseIds: readonly string[] = []): ChapterUse {
  const build = chapter.buildRef;
  // Both party shapes carry `spriteKey` and `portraitKey`; only the FFX one has aeons
  // to summon, so the aeon paintings are added under that narrowing alone.
  const members: readonly { readonly spriteKey: string; readonly portraitKey: string }[] = build.members;
  const aeonKeys = build.game === 'ffx' ? build.aeons.map((aeon) => aeon.spriteKey) : [];
  const subjects = new Set<string>([
    ...members.map((member) => member.spriteKey),
    ...aeonKeys,
    ...enemySubjects(chapter.enemyGroupRef),
  ]);
  const portraits = new Set<string>(members.map((member) => member.portraitKey));
  const plate = `ch${chapter.number}-${chapter.id}`;
  return {
    subjects,
    portraits,
    backdrops: new Set<string>([chapter.sceneKey]),
    pause: new Set<string>(pauseIds.includes(plate) ? [plate] : []),
    music: new Set<string>(Object.values(chapter.music).filter((cue): cue is string => typeof cue === 'string')),
  };
}

/** The same, by chapter id. Throws rather than returning an empty set for an id the game does not have. */
export function chapterUseById(id: ChapterId, pauseIds: readonly string[] = []): ChapterUse {
  const chapter = getChapter(id);
  if (chapter === undefined) throw new Error(`chapter-use.ts: no chapter "${id}"`);
  return chapterUse(chapter, pauseIds);
}

/**
 * Whether one inventory piece is part of this chapter. Piece ids are
 * `assets.ts`'s own (`asset-subject-<id>` and friends); the eight HUD parts
 * all belong to the FFX battle HUD this frame draws
 * (`docs/handoff/presentation-ink-and-gold.md § Components`), so all eight
 * count, not only the ones this single frame happens to show.
 */
export function usedByChapter(pieceId: string, use: ChapterUse): boolean {
  if (pieceId.startsWith('asset-hud-')) return true;
  const rest = (prefix: string): string | undefined => (pieceId.startsWith(prefix) ? pieceId.slice(prefix.length) : undefined);

  const subject = rest('asset-subject-');
  if (subject !== undefined) return use.subjects.has(subject);
  const portrait = rest('asset-portrait-');
  if (portrait !== undefined) return use.portraits.has(portrait);
  const backdrop = rest('asset-backdrop-');
  if (backdrop !== undefined) return use.backdrops.has(backdrop);
  const plate = rest('asset-pause-');
  if (plate !== undefined) return use.pause.has(plate);
  return false;
}
