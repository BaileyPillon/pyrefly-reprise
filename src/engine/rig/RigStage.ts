/**
 * The stage's one choice between the two kinds of figure (`BattlePresenterStage.add`): a {@link RigActor} when the figure has a gated rig and the switch allows it,
 * the painting set (`PaintedActor`) otherwise, exactly as before. A rig that fails to build for any reason (a texture missing, a shader patch that no longer applies,
 * the idle painting not the shape the rig was cut from) is a reason on record and the painting set: a rig can never take a figure off the field.
 */
import { PaintedActor, type PaintedActorOptions } from '../PaintedActor.ts';
import { characterUrl, isDresspherePainting } from '../BattlePresenterArt.ts';
import { paintedPoses } from '../EnemyActionPose.ts';
import type { RigActor, RigAsset } from './RigActor.ts';
import { chooseRig, noteRigFailure, registerRigUse, rigSwitch, type ChooseContext } from './RigLoad.ts';
import { partyRigAllowed } from '../motion/PartyRigsSwitch.ts';

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
  /** The query string the switch reads (tests); default the page's. */
  search?: string;
  /** Whether the art manifest lists a rig for the subject (tests); default the loaded manifest. */
  listed?: (subject: string) => Promise<boolean>;
  /** Test hooks handed to the rig's asset: an idle painting already loaded, and how a part PNG becomes a texture. */
  hooks?: Pick<RigAsset, 'idlePainting' | 'loadTexture'>;
  /** Test overrides of what `chooseRig` is told (the device's scale and budget, the manifest's tiers, the painted poses). */
  choose?: ChooseContext;
}

export interface BuiltFigure {
  actor: PaintedActor;
  /** The actor, when it is a rig. */
  rig: RigActor | null;
}

/**
 * The rig half of {@link buildFigure}: a built rigged figure, or `null` when the figure is the painting set (no gated rig, the switch off, a figure-less part, a rig that failed to build).
 * `PaintedStage.add` calls this and then creates the painting set ITSELF, so a painted figure is made by the same single `await PaintedActor.create` it always was: the rig adds its awaits
 * before the figure exists, never after (the entrance census counts the ticks between a built figure and the presenter's first fade of it, `tests/unit/entrance-census.test.ts`).
 */
export async function tryRigFigure(r: FigureRequest): Promise<BuiltFigure | null> {
  // a figure-less part (Vegnagun's rings) has no painting to replace; the two party pilots (Tidus, Rikku's Dark Knight) draw as a rig only behind `?partyrigs=on`, in their own chapter (`motion/PartyRigsSwitch.ts`)
  if (r.opts.figure !== false && partyRigAllowed(r.artId)) {
    const choice = await chooseRig(r.artId, r.poses['idle'], rigSwitch(r.setting, r.search), isDresspherePainting(r.artId), r.listed, { painted: [...paintedPoses(r.artId, r.poses, characterUrl)], ...r.choose });
    if (choice.asset) {
      try {
        // loaded on first use: a build with no rig on disk never fetches the rig code, and a stage that has no use for it never evaluates a class that extends PaintedActor
        const { RigActor: Rigged } = await import('./RigActor.ts');
        const rig = await Rigged.createRigged(r.opts, { ...choice.asset, ...r.hooks });
        registerRigUse(r.artId, r.id, rig);
        return { actor: rig, rig };
      } catch (e) {
        choice.asset.release?.(); // the texture memory it reserved (a RigActor that got far enough gave it back in dispose; the release is once-only)
        noteRigFailure(r.artId, e instanceof Error ? e.message : String(e));
      }
    }
  }
  return null;
}

/** The figure for a request: a rig when it has one, the painting set otherwise. */
export async function buildFigure(r: FigureRequest): Promise<BuiltFigure> {
  return (await tryRigFigure(r)) ?? { actor: await PaintedActor.create(r.opts), rig: null };
}
