/**
 * CAMERA LAB (a test harness, branch `camera-lab`; D-318): the shared shapes.
 *
 * Bailey, 2026-10-02: "let's build a playable test of it before we incorporate it in the
 * whole game please" (the Clair Obscur / Persona camera research). The lab plays Chapter I
 * (FFX) and Chapter IV (FFX-2) with a per-beat camera and live switches. It exists only
 * behind `?camera=lab`; without the flag nothing here is constructed or called.
 *
 * The presenter reaches the lab through one optional port, {@link LabCameraPort}: it says
 * which beat is playing and nothing else. Types only, so a presenter file importing this
 * stays free of `three` and the DOM (hard rule 1).
 *
 * Game case (rule 14): both games, as a test. FFX cuts between held shots on beats (the one
 * sourced shape); FFX-2 never cuts while a girl's menu is open (D-316). Every placement is ours.
 */

export type LabStyle = 'persona' | 'clair';
export type LabGame = 'ffx' | 'ffx2';
export type LabChapterId = 'seymour-flux' | 'ffx2-bahamut';

/** The four live switches (the lab panel and the battle chip flip them). */
export interface LabSwitches {
  /** Persona: still, hip height, wide lens. Clair Obscur: chest height, normal lens, slow drift. */
  style: LabStyle;
  /** Rear three-quarter paintings when the camera is behind a figure (false: today's paintings only). */
  views: boolean;
  /** The command list beside the acting figure (false: today's panel). Phones always keep the panel. */
  menuAtHero: boolean;
  /** Clair Obscur: a cut to the highlighted enemy while a target is picked. */
  targetCut: boolean;
}

export const DEFAULT_LAB_SWITCHES: Readonly<LabSwitches> = Object.freeze({
  style: 'persona',
  views: true,
  menuAtHero: true,
  targetCut: true,
});

/** Why the lab hands the camera back to the presenter's own authored moment. */
export type LabYieldReason = 'opening' | 'camera-event' | 'form-change' | 'script' | 'defeat';

/**
 * One beat, as the presenter plays it. The presenter emits these and nothing else; the
 * director (`LabDirectorCore`) turns them into shots.
 */
export type LabBeat =
  /** A command menu is about to open for this actor (a human turn). */
  | { kind: 'menu-open'; actorId: string }
  /** That menu closed (a command was chosen, or the menu was abandoned). */
  | { kind: 'menu-close'; actorId: string }
  /** An action begins: `pose` is the painted pose the beat picked (`attack`, `cast`, `item`...). */
  | {
      kind: 'action';
      actorId: string;
      side: 'party' | 'enemy' | 'aeon' | null;
      pose: string;
      targets: readonly string[];
      commandKind: string;
      abilityId: string | null;
      abilityName: string | null;
    }
  /** A blow lands (the first hit of an action, or a later one). */
  | { kind: 'impact'; targetId: string; hitIndex: number; heavy: boolean }
  /** The action is over. */
  | { kind: 'action-end' }
  /** A boss winds up a fight-ending attack: the presenter's own zoom and vignette play (the lab yields). */
  | { kind: 'telegraph'; enemyId: string; stage: 1 | 2; name: string | null }
  /** The presenter plays an authored camera moment; the lab yields until its next beat. */
  | { kind: 'yield'; reason: LabYieldReason }
  /** The battle is won. */
  | { kind: 'victory' }
  /** A figure's painting set changed (an FFX-2 spherechange): its rear painting no longer applies. */
  | { kind: 'art'; id: string; artId: string };

/** The presenter's one way into the lab. Optional on `PresenterDeps`; absent outside `?camera=lab`. */
export interface LabCameraPort {
  beat(beat: LabBeat): void;
}

/** The shots the grammar uses (`docs/plans/camera-lab-review.md`, "The grammar"). */
export type ShotKind =
  /** FFX turn: behind and beside the actor, the boss readable. */
  | 'hero'
  /** Clair Obscur skill list: closer and lower than `hero`. */
  | 'hero-close'
  /** FFX-2 menu master: high over the girls' shoulders (P2h). */
  | 'party-shoulder'
  /** FFX-2 menu master when a girl has no rear painting: today's wide master. */
  | 'party-front'
  /** Clair Obscur target pick: close, slightly low, on the highlighted enemy from the party's side. */
  | 'target'
  /** Physical attack: low three-quarter side of the lunge, held through the hit. */
  | 'lunge-side'
  /** Spell or skill, first shot: low on the caster. */
  | 'caster-low'
  /** Spell or skill, second shot: wide three-quarter on the impact. */
  | 'impact-wide'
  /** Item: close on the actor. */
  | 'item-close'
  /** Persona enemy turn: front three-quarter close on the enemy, from the party's side. */
  | 'enemy-front'
  /** Clair Obscur enemy turn: wide, low, behind the party, the boss large. */
  | 'enemy-behind-party'
  /** Big attack (Overdrive, boss special): low colossus angle on the boss. */
  | 'colossus'
  /** Victory: low hero portrait of the finisher. */
  | 'victory';

/** A shot the grammar asks for: what to frame, and how it lives once cut to. */
export interface ShotRequest {
  kind: ShotKind;
  /** The figure the shot is about (the actor, the enemy, the finisher). */
  subject: string | null;
  /** What the subject faces or strikes (the boss for a hero shot, the hit target for an action). */
  target: string | null;
  /** Clair Obscur's slow drift inside the shot (REDUCE MOTION turns it off). */
  drift: boolean;
  /** Clair Obscur's short slow-down on the first hit landing under this shot. */
  slowOnHit: boolean;
}

/** Shots are the same when their kind and subjects are: a re-request of the shot on screen is not a cut. */
export function sameShot(a: ShotRequest | null, b: ShotRequest | null): boolean {
  if (!a || !b) return a === b;
  return a.kind === b.kind && a.subject === b.subject && a.target === b.target;
}
