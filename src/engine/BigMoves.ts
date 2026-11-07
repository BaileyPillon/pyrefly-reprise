/**
 * WHAT COUNTS AS A BIG MOVE, per game (Bailey, 2026-11-07: "A: only on big moves"; the driver's call 221b: each game's list comes from the sources, the narrowest sourced list where the sources do not settle it).
 * A party member's big move slams the member's portrait in and names the move (`BigMoveCutIn.ts`); every other turn start and every other action shows no portrait.
 *
 * Game case (rule 14): the portrait rule is both games, each with its own list; neither game's list leaks into the other.
 *
 * FFX (`research/ffx-vs-ffx2-presentation.md` section 7, [verified: 2 sources]): the game itself singles out two aeon moments, the summon and the aeon's Overdrive; a character's Overdrive is the same kind of moment (the task's own
 * list: "Overdrives, aeon summons and Overdrives, and anything the sources name"). Its Config menu's Aeons row plays "each aeon's full summon and Overdrive animations once, then the short version every time after"
 * (the Spherechange row has the same first-time-in-full rule, section 6), so the portrait does likewise: the full slam the first time a member does a big move in a fight, a quick flash after. Listed: command kind
 * `overdrive` (a character's, or an aeon's: both go through the Overdrive command) and `summon`. Not listed: Specials, Skills and magic (the sources read for this change call none of them out as a moment of their own),
 * and a fiend's moves (the fiends have their own banners, the held breath and the telegraph).
 *
 * FFX-2 has no Overdrive and no summon. The sources name one family of party moments the game itself dresses up: the special dresspheres (Floral Fallal, Machina Maw, Full Throttle), "its own unique animation"
 * for the change into one (`ffx-vs-ffx2-presentation.md` section 6, [single source: FF Wiki, *Dressphere*]) and, in each, the top move of the main body, the 30 AP, long-charge, whole-field finisher
 * (`ffx2-combat-core.md` sections 2.9.2 and 3.15: Great Whirl twelve hits, Vajra power 80 to all, Sword Dance 48 x 2 to all, "the strongest thing in the game per action"; all three are `CT, RT` and listed among the long charges).
 * Listed, so, and nothing more: the change into a special dressphere (Special Dress Up; it rides the engine's `spherechange` event, which carries `special`: the engine emits no `action-start` for a dress change) and those three moves. The ordinary dress change (the "signature FFX-2 sequence", `ffx2-combat-core.md` section 6.6, already has the HUD's
 * flourish and comes every few turns), Trigger Happy, Lady Luck, Mascot's Moogle Beam and the rest of the long charges are NOT listed: the sources do not call them out the way they call out these, and each would
 * bring the random pop-up back. That is the open question for Bailey (`docs/handoff/ui-marker-portraits.md`).
 *
 * Pure: no DOM, no `three` (hard rule 1).
 */
import type { Command, GameId } from '../battle/common/types.ts';

export type BigMoveKind = 'overdrive' | 'summon' | 'special';

/** One big move, ready for the cut-in: whose portrait, what to call the move, and the line above it. */
export interface BigMove {
  kind: BigMoveKind;
  /** The portrait's id (`art/portraits/<id>.png`): the member, never a special dressphere's part. */
  portraitId: string;
  /** The member's own name (the ghost behind the slab). */
  who: string;
  /** The move's name, as the slab sets it. */
  title: string;
  /** The line above the name, in capitals: "TIDUS · OVERDRIVE". */
  tag: string;
}

/** The ability ids of the three finishers, and the girl each special dressphere is (`data/ffx2/dresspheres/special/*`: `owner`). */
const FFX2_FINISHERS: Readonly<Record<string, { owner: string; ownerName: string }>> = Object.freeze({
  'x2-floral-fallal-great-whirl': { owner: 'yuna', ownerName: 'Yuna' },
  'x2-machina-maw-vajra': { owner: 'rikku', ownerName: 'Rikku' },
  'x2-full-throttle-sword-dance': { owner: 'paine', ownerName: 'Paine' },
});

/** The special dresspheres' display names (`data/ffx2/dresspheres/special/*`). */
const SPECIAL_NAMES: Readonly<Record<string, string>> = Object.freeze({
  'floral-fallal': 'Floral Fallal',
  'machina-maw': 'Machina Maw',
  'full-throttle': 'Full Throttle',
});

/** The change into a special dressphere, from the engine's `spherechange` event (`special` is set only by Special Dress Up): FFX-2's, the girl's own portrait; null for an ordinary change and for any other game. */
export function dressUpMoveOf(game: GameId | undefined, who: { id: string; name: string }, to: string, special: string | undefined): BigMove | null {
  if (game !== 'ffx2' || special === undefined) return null;
  return { kind: 'special', portraitId: who.id, who: who.name, title: SPECIAL_NAMES[to] ?? to, tag: `${upper(who.name)} · SPECIAL DRESS UP` };
}

/** What the cut-in needs to know about the action that is starting. */
export interface ActionFacts {
  game: GameId | undefined;
  command: Command;
  abilityId?: string | undefined;
  abilityName?: string | undefined;
  actorId: string;
  /** The actor's display name. */
  actorName: string;
  /** For a summon: the aeon's display name, when the state knows it. */
  aeonName?: string | undefined;
}

const upper = (s: string): string => s.toUpperCase();

/** The big move this action is, or null (most actions: attacks, skills, magic, items, defends, a dress change). Only the actor's own side decides whether it is shown (`BigMoveCutIn`). */
export function bigMoveOf(a: ActionFacts): BigMove | null {
  if (a.game === 'ffx') {
    if (a.command.kind === 'overdrive') {
      return { kind: 'overdrive', portraitId: a.actorId, who: a.actorName, title: a.abilityName || 'Overdrive', tag: `${upper(a.actorName)} · OVERDRIVE` };
    }
    if (a.command.kind === 'summon') {
      const aeon = a.aeonName || a.abilityName || 'Summon';
      return { kind: 'summon', portraitId: a.actorId, who: a.actorName, title: aeon, tag: `${upper(a.actorName)} · SUMMON` };
    }
    return null;
  }
  if (a.game === 'ffx2') {
    const finisher = a.abilityId === undefined ? undefined : FFX2_FINISHERS[a.abilityId];
    if (finisher && (a.command.kind === 'ability' || a.command.kind === 'overdrive')) {
      return { kind: 'special', portraitId: finisher.owner, who: finisher.ownerName, title: a.abilityName || a.abilityId || 'Special', tag: `${upper(finisher.ownerName)} · SPECIAL` };
    }
    return null;
  }
  return null;
}
