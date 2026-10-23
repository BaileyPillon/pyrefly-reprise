/**
 * WHAT THE HELD BREATH TURNS IN THE REST OF THE PICTURE WHILE A STAGED MOVE PLAYS, AND GIVES BACK AT THE LIFT (lane "pro-staging"; the plan is `engine/pro/staging/BreathPlan.ts`, the drawing `BreathView.ts`). Three hand-overs, all [ours]:
 *  - the look's tweaks (`engine/look/LookState.setLookTweak`): the figures' rim light, and Mega Flare's engine white-out and room flood, which would cover the girls inside the clear windows the layer cuts for them;
 *  - the look's point lights (`look/relight/RelightConfig.ts#POINT_KINDS`, read live each frame): Mega Flare's own light;
 *  - the spell layer's blast on the party (`engine/pro/staging/BlastTune.ts`): the white bloom and the white wash the effect lands on the girls (the review's M4).
 * Each saves what it found and puts exactly that back; if the look lane freezes or renames a table, that part is skipped and the girls keep the engine's own light.
 */
import type { DemoGame } from '../../../engine/motion/DemoGate.ts';
import { lookState, setLookTweak } from '../../../engine/look/LookState.ts';
import { POINT_KINDS } from '../../../engine/look/relight/RelightConfig.ts';
import { STAGED_BLAST, blastTune } from '../../../engine/pro/staging/BlastTune.ts';

/** The look's tweaks the held breath turns while a staged move is alive (the previous value comes back with the lift). */
const LOOK_TWEAKS: ReadonlyArray<{ name: string; mark?: number; tell: number; game?: DemoGame; move?: 'mega-flare' }> = [
  { name: 'bold.rim', mark: 1.7, tell: 2.4 }, // the figures' rim light: the boss wears a rim from the wind-up, and the party and the boss are lit by the same light the wash is made of
  { name: 'flare.white', tell: 0, game: 'ffx2', move: 'mega-flare' }, // Mega Flare's engine white-out would cover the party: the flood is this layer's, with a window around them
  { name: 'flare.flood', tell: 0.3, game: 'ffx2', move: 'mega-flare' }, // ... and the engine's own room flood (the lit surfaces up to 2.7 times over) would overexpose the girls inside those windows: it steps back, this layer's flood is the picture
];

/**
 * The look's point-light kinds turned down while the move plays. Mega Flare's own light (release 62, decision 173b: cool white, peak 2.1, over 2.4 times the reach) lights the three girls to white; inside the clear
 * windows that read as three blank bubbles. At 0.9 they stay lit by the beam and stay people. [ours]
 */
const POINT_TUNES: ReadonlyArray<{ kind: string; peak: number; game: DemoGame; move: 'mega-flare' }> = [{ kind: 'megaflare', peak: 0.9, game: 'ffx2', move: 'mega-flare' }];

export class LookTuning {
  private readonly saved = new Map<string, number | undefined>();
  private readonly savedPoints = new Map<string, number>();

  constructor(private readonly game: DemoGame) {}

  /** The look's tweaks for the move: the marker's at the mark, the tell's at the tell, everything back when `on` is false. */
  arm(move: string, on: boolean, stage: 'mark' | 'tell' = 'tell'): void {
    this.armPoints(move, on && stage === 'tell');
    try {
      for (const t of LOOK_TWEAKS) {
        if (on) {
          if (t.game !== undefined && t.game !== this.game) continue;
          if (t.move !== undefined && t.move !== move) continue;
          const value = stage === 'mark' ? t.mark : t.tell;
          if (value === undefined) continue;
          if (!this.saved.has(t.name)) this.saved.set(t.name, lookState.tweaks[t.name]);
          setLookTweak(t.name, value);
        } else if (this.saved.has(t.name)) {
          setLookTweak(t.name, this.saved.get(t.name) ?? null);
          this.saved.delete(t.name);
        }
      }
    } catch {
      /* the look is optional: a missing one costs the rim, never the move */
    }
  }

  /** The look's point lights, and the spell layer's blast on the party, turned down for the move's tell and given back with the lift. */
  private armPoints(move: string, on: boolean): void {
    const blast = move === 'mega-flare' && this.game === 'ffx2' && on;
    blastTune.megaFlareParty = blast ? STAGED_BLAST.megaFlareParty : 1;
    blastTune.megaFlareWash = blast ? STAGED_BLAST.megaFlareWash : 1;
    blastTune.actorBloom = blast ? STAGED_BLAST.actorBloom : 1;
    try {
      for (const t of POINT_TUNES) {
        const kind = (POINT_KINDS as Record<string, { peak: number }>)[t.kind];
        if (!kind) continue;
        if (on) {
          if (t.game !== this.game || t.move !== move || this.savedPoints.has(t.kind)) continue;
          this.savedPoints.set(t.kind, kind.peak);
          kind.peak = Math.min(kind.peak, t.peak);
        } else if (this.savedPoints.has(t.kind)) {
          kind.peak = this.savedPoints.get(t.kind)!;
          this.savedPoints.delete(t.kind);
        }
      }
    } catch {
      /* a frozen or renamed table: the girls keep the engine's light */
    }
  }
}
