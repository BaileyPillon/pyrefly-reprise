/**
 * CAMERA LAB at release 39: the shots a command menu can lead to, named by the grammar itself, so the art governor can have their masters
 * resident before the cut (`LabDirector.anticipate`, `StageArt.anticipateView`).
 *
 * The lab's close shots (HERO, HERO CLOSE, TARGET, CASTER LOW, LUNGE SIDE ...) magnify a figure two to three times more than today's camera,
 * so the painting a cut lands on must already be its 3x or 4x master. The governor's own live path (`ArtGovernor.update`) waits 0.3 s for a
 * need to last, then loads and swaps: a soft figure for a second after every cut. Asking for the view before the cut costs nothing (the same
 * measurement from a camera that is not on screen yet) and the load runs while the player is choosing.
 *
 * The list is built with `shotForBeat`, so it can never disagree with the grammar: it asks the same questions the director will ask, with the
 * beats a menu can lead to (the skill list, a target highlight, an attack, a spell and its impact, an item, the enemy turns that follow).
 *
 * Pure: no `three`, no DOM. Game case (rule 14): both games; FFX-2 answers 'keep' to the list and the target beats (it never cuts under an
 * open menu, D-316) and so asks only for the action and enemy-turn shots; FFX asks for all of them.
 */

import type { LabGame, ShotRequest } from './LabTypes.ts';
import { sameShot } from './LabTypes.ts';
import { shotForBeat, type GrammarContext } from './shotChoice.ts';

export interface LikelyInput {
  /** The figure whose menu is open (or, before the first menu, whoever may act first). */
  actorId: string;
  /** Standing enemies, the headline boss first. */
  enemies: readonly string[];
  /** Standing party members (the victims of an enemy action). */
  party: readonly string[];
}

/** The shots the beats ahead of `input.actorId`'s menu may ask for, each once. */
export function likelyShots(_game: LabGame, input: LikelyInput, ctx: GrammarContext): ShotRequest[] {
  const out: ShotRequest[] = [];
  const isEnemy = (id: string): boolean => input.enemies.includes(id);
  const add = (answer: ReturnType<typeof shotForBeat>): void => {
    if (answer !== 'keep' && !out.some((s) => sameShot(s, answer))) out.push(answer);
  };
  const { actorId } = input;
  add(shotForBeat({ kind: 'skill-list', actorId, open: true }, ctx, isEnemy));
  for (const e of input.enemies) {
    // A target highlight, then the action against it: a lunge, a spell's caster and its impact, an item.
    add(shotForBeat({ kind: 'target', actorId, targetId: e, enemy: true, level: 'sub' }, ctx, isEnemy));
    for (const pose of ['attack', 'cast', 'item']) add(shotForBeat({ kind: 'action', actorId, side: 'party', pose, targets: [e], big: false }, ctx, isEnemy));
    add(shotForBeat({ kind: 'spell-impact', actorId, targets: [e] }, ctx, isEnemy));
  }
  // The enemy turns that follow, and the boss's fight-ending attack.
  const victim = input.party[0] ?? actorId;
  for (const e of input.enemies) add(shotForBeat({ kind: 'action', actorId: e, side: 'enemy', pose: 'attack', targets: [victim], big: false }, ctx, isEnemy));
  const boss = input.enemies[0];
  if (boss) add(shotForBeat({ kind: 'action', actorId: boss, side: 'enemy', pose: 'attack', targets: [victim], big: true }, ctx, isEnemy));
  return out;
}
