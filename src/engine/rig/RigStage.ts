/**
 * The stage's one choice between the two kinds of figure (`BattlePresenterStage.add`): a {@link RigActor} when the figure has a gated rig and the switch allows it,
 * the painting set (`PaintedActor`) otherwise, exactly as before. A rig that fails to build for any reason (a texture missing, a shader patch that no longer applies,
 * the idle painting not the shape the rig was cut from) is a reason on record and the painting set: a rig can never take a figure off the field.
 */
import { PaintedActor, type PaintedActorOptions } from '../PaintedActor.ts';
import { isDresspherePainting } from '../BattlePresenterArt.ts';
import type { RigActor, RigAsset } from './RigActor.ts';
import { chooseRig, noteRigFailure, registerRigUse, rigSwitch } from './RigLoad.ts';

export interface FigureRequest {
  /** The combatant id (for the registry). */
  id: string;
  /** The art id the figure resolved to: the rig's subject. */
  artId: string;
  /** The resolved `{ pose: url }` map: the idle in it is the rig's costume. */
  poses: Readonly<Record<string, string>>;
  /** Exactly the options the stage gives `PaintedActor.create`. */
  opts: PaintedActorOptions;
  /** The hidden `fxRig` setting, live. Absent reads as on. */
  setting?: () => boolean;
  /** Test hooks handed to the rig's asset: an idle painting already loaded, and how a part PNG becomes a texture. */
  hooks?: Pick<RigAsset, 'idlePainting' | 'loadTexture'>;
}

export interface BuiltFigure {
  actor: PaintedActor;
  /** The actor, when it is a rig. */
  rig: RigActor | null;
}

export async function buildFigure(r: FigureRequest): Promise<BuiltFigure> {
  // a figure-less part (Vegnagun's rings) has no painting to replace
  if (r.opts.figure !== false) {
    const choice = await chooseRig(r.artId, r.poses['idle'], rigSwitch(r.setting), isDresspherePainting(r.artId));
    if (choice.asset) {
      try {
        // loaded on first use: a build with no rig on disk never fetches the rig code, and a stage that has no use for it never evaluates a class that extends PaintedActor
        const { RigActor: Rigged } = await import('./RigActor.ts');
        const rig = await Rigged.createRigged(r.opts, { ...choice.asset, ...r.hooks });
        registerRigUse(r.artId, r.id, rig);
        return { actor: rig, rig };
      } catch (e) {
        noteRigFailure(r.artId, e instanceof Error ? e.message : String(e));
      }
    }
  }
  return { actor: await PaintedActor.create(r.opts), rig: null };
}
