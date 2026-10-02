/**
 * CAMERA LAB: the grammar table as one pure function (`docs/plans/camera-lab-review.md`,
 * "The grammar"): which shot a beat asks for, per style and per game.
 *
 * | Beat                    | Persona                         | Clair Obscur                         |
 * |-------------------------|---------------------------------|--------------------------------------|
 * | FFX turn starts         | HERO (hip, wide, still)         | HERO (chest, normal lens, drift)     |
 * | FFX-2, any menu open    | PARTY SHOULDER (held)           | same, slow drift                     |
 * | Skill or magic list     | no change                       | HERO CLOSE (closer, lower)           |
 * | Picking an enemy target | no change                       | TARGET (TARGET CUT on)               |
 * | Physical attack         | LUNGE SIDE, held through the hit| same, slow-down on the hit           |
 * | Spell or skill          | CASTER LOW, then IMPACT WIDE    | same, drifting                       |
 * | Item                    | ITEM CLOSE                      | same                                 |
 * | Enemy turn              | ENEMY FRONT                     | ENEMY BEHIND PARTY                   |
 * | Big attack              | COLOSSUS                        | same, slow-down on the hit           |
 * | Victory                 | VICTORY (finisher)              | same                                 |
 * | After an action         | next HERO (FFX) / PARTY SHOULDER (FFX-2)                               |
 *
 * Pure: no `three`, no DOM. Whether a cut may happen at all (holds, FFX-2's open menu, yields)
 * is `LabDirectorCore`'s job; this only names the shot.
 */

import type { LabGame, LabStyle, ShotKind, ShotRequest } from './LabTypes.ts';

/** A beat as the grammar reads it (the director normalises presenter beats and HUD state into these). */
export type GrammarBeat =
  /** FFX: a party member's command menu opens. */
  | { kind: 'turn'; actorId: string }
  /** FFX-2: a girl's command menu opens (one held master for every girl, no hand-off). */
  | { kind: 'menu-master' }
  /** FFX: the skill or magic list opened (`open`) or closed back to the top-level list. */
  | { kind: 'skill-list'; actorId: string; open: boolean }
  /** FFX: the target highlight moved; `targetId` null = back to the list (`level` says which). */
  | { kind: 'target'; actorId: string; targetId: string | null; enemy: boolean; level: 'top' | 'sub' }
  /** An action starts. `big` = an Overdrive or a boss special. */
  | {
      kind: 'action';
      actorId: string;
      side: 'party' | 'enemy' | 'aeon' | null;
      pose: string;
      targets: readonly string[];
      big: boolean;
    }
  /** The spell pair's second shot: the impact. */
  | { kind: 'spell-impact'; actorId: string; targets: readonly string[] }
  /** The action ended and nothing else is starting. */
  | { kind: 'after-action' }
  /** The battle is won; `finisher` = the last party member who acted. */
  | { kind: 'victory'; finisher: string | null };

export interface GrammarContext {
  game: LabGame;
  style: LabStyle;
  targetCut: boolean;
  /** The boss a hero shot looks past (the headline enemy). */
  bossId: string | null;
  /** True when every standing party figure can show its rear painting (VIEWS on, painting loaded). */
  allPartyRear: boolean;
}

/** `'keep'` = the shot on screen stays (no cut). */
export type GrammarAnswer = ShotRequest | 'keep';

function make(
  kind: ShotKind,
  subject: string | null,
  target: string | null,
  ctx: GrammarContext,
  slow = false,
): ShotRequest {
  const clair = ctx.style === 'clair';
  return { kind, subject, target, drift: clair, slowOnHit: clair && slow };
}

/** The FFX-2 master: over the girls' shoulders, or today's wide master when one of them has no rear painting. */
export function masterShot(ctx: GrammarContext): ShotRequest {
  return make(ctx.allPartyRear ? 'party-shoulder' : 'party-front', null, ctx.bossId, ctx);
}

/** The shot a menu at this level asks for (FFX), when nothing is being aimed at. */
export function menuShot(actorId: string, level: 'top' | 'sub', ctx: GrammarContext): ShotRequest {
  const close = level === 'sub' && ctx.style === 'clair';
  return make(close ? 'hero-close' : 'hero', actorId, ctx.bossId, ctx);
}

/** The boss when it is among `targets`, else the first enemy among them, else the boss. */
function strikeTarget(targets: readonly string[], ctx: GrammarContext, isEnemy?: (id: string) => boolean): string | null {
  if (ctx.bossId && targets.includes(ctx.bossId)) return ctx.bossId;
  const first = targets.find((t) => (isEnemy ? isEnemy(t) : true));
  return first ?? targets[0] ?? ctx.bossId;
}

/**
 * The grammar: the shot `beat` asks for under `ctx`, or `'keep'`.
 *
 * `isEnemy` lets an action against a mixed target list strike the enemy; without it the first
 * target is used.
 */
export function shotForBeat(beat: GrammarBeat, ctx: GrammarContext, isEnemy?: (id: string) => boolean): GrammarAnswer {
  const clair = ctx.style === 'clair';
  switch (beat.kind) {
    case 'turn':
      return ctx.game === 'ffx' ? make('hero', beat.actorId, ctx.bossId, ctx) : masterShot(ctx);

    case 'menu-master':
      return masterShot(ctx);

    case 'skill-list':
      // FFX-2 never cuts with a menu open (D-316); Persona keeps its frame while the list is up.
      if (ctx.game === 'ffx2' || !clair) return 'keep';
      return menuShot(beat.actorId, beat.open ? 'sub' : 'top', ctx);

    case 'target':
      if (ctx.game === 'ffx2' || !clair || !ctx.targetCut) return 'keep';
      if (beat.targetId === null) return menuShot(beat.actorId, beat.level, ctx);
      // Ally targets keep the current shot; the reticle does the work.
      return beat.enemy ? make('target', beat.targetId, beat.actorId, ctx) : 'keep';

    case 'action': {
      if (beat.side === 'enemy') {
        const victim = beat.targets[0] ?? null;
        if (beat.big) return make('colossus', beat.actorId, victim, ctx, true);
        // Clair Obscur's enemy turn looks from behind the party: only when every one of them can show her back.
        return make(clair && ctx.allPartyRear ? 'enemy-behind-party' : 'enemy-front', beat.actorId, victim, ctx);
      }
      const target = strikeTarget(beat.targets, ctx, isEnemy);
      const strikesFoe = beat.targets.length === 0 || beat.targets.some((t) => (isEnemy ? isEnemy(t) : true));
      // An Overdrive is the party's big attack: the colossus angle on what it strikes (one on the
      // party, Mighty Guard say, is shot low on its caster instead).
      if (beat.big) return strikesFoe ? make('colossus', target ?? ctx.bossId, beat.actorId, ctx, true) : make('caster-low', beat.actorId, target, ctx);
      if (beat.pose === 'attack') return make('lunge-side', beat.actorId, target, ctx, true);
      if (beat.pose === 'cast') return make('caster-low', beat.actorId, target, ctx);
      if (beat.pose === 'item') return make('item-close', beat.actorId, target, ctx);
      return 'keep'; // Defend, Switch and the like keep the frame
    }

    case 'spell-impact': {
      const target = strikeTarget(beat.targets, ctx, isEnemy);
      return make('impact-wide', target, beat.actorId, ctx);
    }

    case 'after-action':
      // FFX holds until the next beat names a shot (the next hero shot or an enemy turn).
      return ctx.game === 'ffx2' ? masterShot(ctx) : 'keep';

    case 'victory':
      return make('victory', beat.finisher, ctx.bossId, ctx);
  }
}

/** True for the first shot of the spell pair (a caster/impact pair is one beat with two shots). */
export function opensSpellPair(shot: ShotRequest): boolean {
  return shot.kind === 'caster-low';
}
