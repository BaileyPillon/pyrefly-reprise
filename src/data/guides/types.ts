/**
 * Shapes for the in-battle strategy guide's **written** content.
 *
 * One file per chapter under `src/data/guides/`, each one a plain data module
 * with no imports beyond this file and the shared battle contracts — the same
 * rule every other `src/data/**` module follows, so the guide text can be read
 * and checked against `research/*.md` without running the game.
 *
 * The split of labour matters and is easy to get wrong:
 *
 *  * **This layer says why.** It never decides what the player should do. The
 *    recommendation itself comes from the chapter's shipped tactic
 *    (`src/engine/tactics/*.ts`), run read-only by
 *    `src/engine/tactics/guide.ts`. A hint here only *explains* a command the
 *    tactic already chose.
 *  * **Every sentence cites.** `cite` is the research section the claim comes
 *    from, in the corpus's own citation form (`ffx-seymour-flux §6 row 4`), so
 *    a guide line that drifts from the research is findable by grep. The guide
 *    is the one surface in the game that makes explicit claims about canon
 *    mechanics *to the player*, so an uncited sentence here is a bug.
 *
 * If a hint has no match the panel simply prints the command and its target
 * with no reason line, which is strictly better than inventing one.
 */

import type { CombatantId, CommandKind, StatusId } from '../../battle/common/types.ts';

/** When a {@link GuideHint} applies. Every field present must match. */
export interface GuideHintMatch {
  /**
   * Menu labels this hint explains, matched case-insensitively against the
   * offered row's `AvailableCommand.label` ("Holy Water", "Cheer", "Bio").
   */
  labels?: readonly string[];
  /** Command kinds this hint explains, for rows with no stable label (`attack`, `summon`, `defend`). */
  kinds?: readonly CommandKind[];
  /** Only when the aimed target carries this status — how "cure the Zombie" differs from "cure the poison". */
  targetHas?: StatusId;
  /** Only when the aimed target does NOT carry this status. */
  targetLacks?: StatusId;
  /** Only when the acting character is this combatant. */
  actorId?: CombatantId;
  /**
   * Only when the command is aimed at this combatant. A stat line about one
   * enemy ("Logos' Evasion 40") keys here, never on {@link bossId}: in a
   * three-on-three fight that one is true whenever he is in the fight at all,
   * whoever the swing is aimed at [PR-0144].
   */
  targetId?: CombatantId;
  /** Only while this boss is the one on the field (chain chapters). */
  bossId?: CombatantId;
  /** Only while the chapter's primary boss is at or below this fraction of its max HP. */
  bossBelowHp?: number;
  /** Only while the chapter's primary boss is above this fraction of its max HP. */
  bossAboveHp?: number;
  /**
   * Only while `BattleState.flags` holds every one of these key/value pairs —
   * an AI script's or a story trigger's own encounter-scoped state
   * (`EnemyFields`/`Tactic` read the same map), for a hint that depends on
   * something no menu label captures. `evrae.ts`'s "holds a breath and the
   * ship is FAR" line is the reason this exists: the label a `harmlessTurn()`
   * pick lands on (Potion / Eye Drops / Echo Screen) is the same whether or
   * not a breath is actually charged, so the label alone over-fires.
   */
  flags?: Readonly<Record<string, number | string | boolean>>;
}

/**
 * One sentence explaining why the tactic picked a command.
 *
 * `{target}` and `{actor}` interpolate to combatant display names. Hints are
 * tried in array order and the first match wins, so a chapter lists its
 * situational lines (Zombie is on the target; the boss is in phase 2) above
 * its general ones.
 */
export interface GuideHint {
  when: GuideHintMatch;
  /** Present tense, one sentence, no trailing full stop needed. */
  text: string;
  cite: string;
}

/** What the boss is winding up, keyed by the `charge` event's own state text. */
export interface GuideWatch {
  /**
   * The `charge` event's `name`, matched case-insensitively.
   *
   * `'#'` is the wildcard for a **numeric** telegraph: Bahamut's Mega Flare
   * countdown emits the remaining turn count *as* the state text
   * (`src/battle/ffx2/ai/bahamut.ts`), so there is no name to key on.
   */
  name: string;
  /** What actually lands when the clock runs out. */
  payload: string;
  /** What to do about it, in one sentence. */
  advice: string;
  cite: string;
}

/** A phase or form note, shown under WATCH. */
export interface GuidePhase {
  /** Only while this combatant is on the field. Omit for the chapter's primary boss. */
  bossId?: CombatantId;
  /** Only while that boss is above this fraction of its max HP. */
  aboveHpFraction?: number;
  /** Only while that boss is at or below this fraction of its max HP. */
  belowHpFraction?: number;
  /** Only while that boss is in this form (`EnemyFields.formIndex`, 0-based). */
  formIndex?: number;
  /** Short headline, e.g. "PHASE 2 - BELOW HALF". */
  label: string;
  /** One sentence on what changed. */
  note: string;
  cite: string;
}

/** One RULES bullet: the standing truths of the encounter. */
export interface GuideRule {
  text: string;
  /**
   * The same rule as one line, for a rail too short to hold the paragraph.
   *
   * This is not a nicety. With an FFX command menu open the measured rail is
   * about 156 grid px and the five paragraphs alone are 224, so the full RULES
   * section cannot be on screen at the moment the player is choosing — and
   * that is the only moment they are looking at it. The panel renders both and
   * lets `.sgd--compact` pick (`src/ui/common/strategy-guide.css`), so what
   * gets dropped when space runs out is the elaboration, never the rule.
   *
   * Write it as the rule's own headline clause — an instruction, not a topic:
   * "Kill Seymour, not the mount", not "About the mount". Keep it inside
   * {@link RULE_SHORT_MAX} so it stays one line at the rail's width.
   */
  short: string;
  cite: string;
}

/** One line at the rail's 132px width in the 5.3px text face, with margin to spare. */
export const RULE_SHORT_MAX = 52;

/** Everything the panel can say about one chapter. */
export interface ChapterGuide {
  /** Chapter id from `src/data/encounters.ts`. */
  id: string;
  /** Panel headline, e.g. "SEYMOUR FLUX". */
  title: string;
  /**
   * Every boss id this chapter can field, primary first.
   *
   * The panel finds its chapter by asking which of these is on the board, so a
   * chained chapter must list **all** of its links — the same reason
   * `src/engine/tactics/index.ts` registers one tactic under every chain id.
   */
  bossIds: readonly CombatantId[];
  /** 3-5 bullets. The standing truths, not the turn-by-turn. */
  rules: readonly GuideRule[];
  /** Explanations for the commands the tactic picks. First match wins. */
  hints: readonly GuideHint[];
  /** Telegraph answers, keyed by the `charge` event's state text. */
  watch: readonly GuideWatch[];
  /** Phase/form notes. First match wins. */
  phases: readonly GuidePhase[];
}
