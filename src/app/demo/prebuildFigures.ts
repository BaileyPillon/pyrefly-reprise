/**
 * THE DEMO'S FIGHTS, FIGURES AND ALL, BUILT BEHIND THE TITLE AND THE PICKER (lane "prebuild", 2026-10-24; both games: Chapter I is FFX, Chapter IV is FFX-2; `?demo=1&pack=demo`, off with `?prebuild=off`).
 *
 * r63-play's warm (`demoWarm.ts`) builds each fight's STAGE behind the picker: the paintings read, the diorama built, its programs compiled and drawn once. What it leaves for the battle's entry is the figures:
 * `PaintedStage.add` builds each one (`PaintedActor.create`), its pose paintings go up on the frame that first draws them, the look reads each painting's alpha on its first sight, and its programs link on that
 * draw. Measured on the served build with the whole stage warm done, that is the larger part of the 0.6 to 2 s of frame time the first 9 s of a fight still lose (frames of 100 to 530 ms). This does that work
 * ahead of the press, a piece at a time, in the order it pays:
 *
 * 1. the room's light on its painting (`LookRoom.primeRoomLight`: 264 ms in one frame at the battle's entry, here four strips of about 65 ms);
 * 2. the opening state of the fight, from an engine made for it (the same `setupForChapter` and `createEngine` the battle calls; `battlePreload.ts` makes one for the same reason);
 * 3. each figure the stage would stage (the party, the aeons, the formation, the parts: `PaintedStage.stage`), asked for exactly as `PaintedStage.add` asks (`StageFigureRequest.figureSpec`), built by the same
 *    calls (`tryRigFigure`, else `PaintedActor.create`) and PARKED (`FigureCache.ts`) under the fingerprint of the question;
 * 4. every figure's idle painting up, then their programs built (`prebuildDraw.ts`), then the looks' alpha reads of those paintings (`AlphaPrime.ts`, `geometry.primeAlpha`), then the other poses up.
 *
 * The battle's `add` takes a parked figure when its own question has the same fingerprint (another party, height or rig switch builds its own, as before). One step is one figure, or one painting, or one
 * draw, so the warm's loop (`demoWarm.ts`) looks at the pad and at the picker's cursor between them, and a press stops it at the next boundary. Nothing is built unless the stage was (the figures need the
 * diorama's room: its slots, its ground), and a figure that finishes after the fight began is disposed, never parked (`calm`).
 */
import type { PerspectiveCamera } from 'three';
import type { App } from '../App.ts';
import type { Chapter } from '../../data/encounters.ts';
import type { AnyCombatant, BattleState } from '../../battle/common/types.ts';
import { artCandidatesFor, resolveArt } from '../../engine/BattlePresenterArt.ts';
import { figureKind, figureSpec, type FigureEnv } from '../../engine/StageFigureRequest.ts';
import { tryRigFigure, type BuiltFigure } from '../../engine/rig/RigStage.ts';
import { unregisterRigUse } from '../../engine/rig/RigLoad.ts';
import { PaintedActor } from '../../engine/PaintedActor.ts';
import { groundLumaOf } from '../../engine/ContactShadow.ts';
import { dropParked, hasParked, parkFigure, parkedActors } from '../../engine/FigureCache.ts';
import { demoChapter } from '../../engine/motion/DemoGate.ts';
import { setCurvesChapter } from '../../engine/motion/CurvesSwitch.ts';
import { readExtents } from '../../engine/look/AlphaPrime.ts';
import { primeRoomLight } from '../../engine/look/LookRoom.ts';
import { primeAlpha } from '../../engine/fx/mix/geometry.ts';
import { readRigFigures } from '../accessFlags.ts';
import { setupForChapter } from '../screens/BattleScreenSetup.ts';
import { createEngine } from '../screens/BattleScreenWiring.ts';
import { prebuildScene, hasPrebuilt } from '../../scenes/prebuilt.ts';
import type { LoadedScene } from '../../scenes/index.ts';
import type { WarmupRenderer } from '../screens/BattleScreenWarmup.ts';
import { drawFigures, isWarmed, newDrawStats, uploadFigure, type DrawStats } from './prebuildDraw.ts';
import { prebuildLiving } from './prebuildLiving.ts'; // r64-fixes: the room's dressing, built behind the picker and adopted at the battle's bind

/** What a plan reads of the app: its renderer and the screen that is up. */
export type PrebuildApp = Pick<App, 'renderer'> & { readonly current: { readonly name: string } | null };

/** The figures the stage would stage for `state` (`PaintedStage.stage`): the active party, the aeons, the enemies, the visible parts. */
export function stageableCombatants(state: BattleState): AnyCombatant[] {
  const ids = new Set<string>([...state.activeIds, ...(state.aeonIds ?? (state.aeonId ? [state.aeonId] : [])), ...state.enemyIds]);
  for (const c of Object.values(state.combatants)) if (c.flags.isPart && !c.flags.hidden && !c.removed) ids.add(c.id);
  return [...ids].map((id) => state.combatants[id]).filter((c): c is AnyCombatant => !!c && !c.flags.hidden && !c.removed);
}

/** The opening states made so far (a chapter's does not change between fights). */
const openings = new Map<string, Promise<BattleState>>();

function openingState(chapter: Chapter): Promise<BattleState> {
  let held = openings.get(chapter.id);
  if (!held) {
    held = createEngine(chapter.game, setupForChapter(chapter, 1), { automated: true }).then((e) => e.state() as BattleState);
    held.catch(() => openings.delete(chapter.id));
    openings.set(chapter.id, held);
  }
  return held;
}

/**
 * Name `chapterId` for the figures' construction, as `BattleScreen.enter` does before it stages (`setCurvesChapter`: the figures' rig and look read the demo chapter as they are built), and put back what
 * was there afterwards, but ONLY while the warm is still calm. THE RACE (review 2, 2026-10-24: 2 to 5 of 13 timed Chapter IV presses): the press can land while a figure is being built, and the battle
 * names the SAME chapter for itself (`BattleScreen.enter`). The old guard was `demoChapter() === chapterId`, which is true then too, so the restore wiped the battle's own chapter and the whole fight ran
 * with every new piece off (and a cyan outline on Bahamut). A fight has begun when `calm()` is false (`stopDemoWarm` has run by the time a fight starts), so a restore is made only when `calm()` still holds
 * and the chapter is still the one this named; otherwise the chapter belongs to the battle (same chapter or another) and is left alone.
 */
export async function withDemoChapter<T>(chapterId: string, calm: () => boolean, work: () => Promise<T>): Promise<T> {
  const before = demoChapter();
  setCurvesChapter(chapterId);
  try {
    return await work();
  } finally {
    if (calm() && demoChapter() === chapterId) setCurvesChapter(before);
  }
}

/**
 * A figure was built for the cache: park it while the warm is calm; when a fight was picked while it was being made, dispose it (the battle builds its own) and let go of the rig registry's entry for it
 * (`registerRigUse` in `tryRigFigure` named it live; `FigureCache.release` does the same for a parked one that is dropped). True when it was parked.
 */
export function parkOrDispose(scope: string, id: string, fingerprint: string, built: BuiltFigure, calm: () => boolean): boolean {
  if (!calm()) {
    try {
      unregisterRigUse(id);
    } catch {
      /* no rig registered */
    }
    built.actor.dispose();
    return false;
  }
  parkFigure(scope, id, fingerprint, built);
  return true;
}

export interface PrebuildPlan {
  /** One step of the essentials: the room's light, a figure built, one figure's idle painting, the programs, the looks' reads, the splash crops. True while more is left; false when done or when it cannot be done. */
  step(): Promise<boolean>;
  /** One step of the rest: a figure's other poses. After every fight's essentials. */
  stepRest(): Promise<boolean>;
  readonly stats: DrawStats;
}

/**
 * The prebuild of one fight. `calm` is the warm's own "the title or the picker is still up and no fight was picked"; `pause` is its task boundary with a look at the pad. One plan at a time per chapter; a
 * plan that was abandoned (a fight was picked) leaves what it parked, and the next plan for the chapter skips what is parked and warmed.
 */
export function newPrebuildPlan(app: PrebuildApp, chapter: Chapter, calm: () => boolean, pause: (ms?: number) => Promise<void>, note: (what: string) => void = () => undefined, splash: () => Promise<boolean> = async () => false): PrebuildPlan {
  const stats = newDrawStats();
  let todo: Array<() => Promise<boolean>> | null = null;
  let later: Array<() => Promise<boolean>> = [];
  let env: FigureEnv | null = null;
  let scope = '';

  const renderer = (): WarmupRenderer => app.renderer as unknown as WarmupRenderer;
  const actorsNow = (): PaintedActor[] => parkedActors(scope);

  const inChapter = <T>(work: () => Promise<T>): Promise<T> => withDemoChapter(chapter.id, calm, work);

  async function buildOne(c: AnyCombatant): Promise<void> {
    const kind = figureKind(c);
    const ns = env!.slots.artNamespace;
    const art = await resolveArt(artCandidatesFor(c, ns), kind);
    const spec = figureSpec(env!, c, art);
    if (hasParked(scope, c.id, spec.fingerprint)) return;
    const made: BuiltFigure = (await tryRigFigure(spec.request)) ?? { actor: await PaintedActor.create(spec.request.opts), rig: null };
    parkOrDispose(scope, c.id, spec.fingerprint, made, calm);
  }

  /** The work, in the order it pays: the room's light (the biggest single stall), the figures, their idle paintings and programs, the looks' reads of those, then the other poses. */
  function planWork(scene: LoadedScene, combatants: AnyCombatant[]): { essential: Array<() => Promise<boolean>>; rest: Array<() => Promise<boolean>> } {
    const work: Array<() => Promise<boolean>> = [];
    const rest: Array<() => Promise<boolean>> = [];
    work.push(async () => {
      const t0 = performance.now();
      if (await primeRoomLight(scene.scene, pause, calm)) note(`${chapter.id}: room light found (${Math.round(performance.now() - t0)} ms in strips)`);
      return true;
    });
    for (const c of combatants) {
      work.push(async () => {
        const t0 = performance.now();
        await inChapter(() => buildOne(c));
        note(`${chapter.id}: ${c.id} built (${Math.round(performance.now() - t0)} ms)`);
        return true;
      });
    }
    for (let k = 0; k < combatants.length; k++) {
      work.push(async () => {
        const a = actorsNow()[k];
        if (!a || isWarmed(a)) return true;
        return uploadFigure(renderer(), a, pause, calm, stats, 'idle');
      });
    }
    work.push(async () => {
      const actors = actorsNow().filter((a) => !isWarmed(a));
      if (actors.length && !(await drawFigures(renderer(), scene.scene, actors, calm, stats))) return false;
      note(`${chapter.id}: ${actors.length} figures' idle paintings up and programs built in ${stats.slices} draws (longest task ${Math.round(stats.longestTaskMs)} ms, ${stats.textures} paintings, ${Math.round(stats.uploadedMB)} MB)`);
      return true;
    });
    // r64-fixes: the room's dressing (Living Paintings), built for the scene the battle will take and its programs drawn once; the battle's bind adopts it
    work.push(async () => {
      await prebuildLiving(app, chapter, scene, renderer(), calm, stats, note);
      return calm();
    });
    // the looks' alpha reads of each figure's idle painting (one task each)
    for (let k = 0; k < combatants.length; k++) {
      work.push(async () => {
        const tex = actorsNow()[k]?.heldTextures()[0];
        if (tex) {
          readExtents(tex);
          await pause(12);
          if (calm()) primeAlpha(tex as unknown as { uuid: string; image?: unknown });
        }
        return true;
      });
    }
    // the portraits' splash crops the fight's first splash would make (the warm's own step, run here so it does not wait for the other poses)
    work.push(async () => {
      if (await splash()) note(`${chapter.id}: splash crops`);
      return true;
    });
    // then the other poses of each figure (after every fight's essentials)
    for (let k = 0; k < combatants.length; k++) {
      rest.push(async () => {
        const a = actorsNow()[k];
        if (!a) return true;
        const ok = await uploadFigure(renderer(), a, pause, calm, stats, 'rest');
        if (ok) note(`${chapter.id}: figure ${k + 1} of ${combatants.length}: the other poses up (${stats.textures} paintings, ${Math.round(stats.uploadedMB)} MB so far)`);
        return ok;
      });
    }
    return { essential: work, rest };
  }

  return {
    stats,
    async step(): Promise<boolean> {
      try {
        const scene = hasPrebuilt(chapter.sceneKey) ? await prebuildScene(chapter.sceneKey, app.renderer.camera as PerspectiveCamera) : null;
        if (!scene) return false; // the stage was taken by a battle, or never built: nothing to put the figures in
        scope = scene.key;
        if (!todo || !env) {
          const state = await openingState(chapter);
          const combatants = stageableCombatants(state);
          env = { slots: scene.slots, rim: undefined, rigs: readRigFigures, groundLuma: groundLumaOf(scene.scene), game: state.game };
          const planned = planWork(scene, combatants);
          todo = planned.essential;
          later = planned.rest;
          note(`${chapter.id}: opening state, ${combatants.length} figures to build`);
          return true;
        }
        const next = todo.shift();
        if (!next) return false;
        if (!(await next())) return false;
        return todo.length > 0;
      } catch (e) {
        note(`${chapter.id}: prebuild stopped: ${String(e).slice(0, 100)}`);
        return false;
      }
    },
    async stepRest(): Promise<boolean> {
      try {
        const next = later.shift();
        if (!next) return false;
        if (!(await next())) return false;
        return later.length > 0;
      } catch (e) {
        note(`${chapter.id}: prebuild (other poses) stopped: ${String(e).slice(0, 100)}`);
        return false;
      }
    },
  };
}

/** Dispose every parked figure (a page leaving, tests). */
export function resetPrebuild(): void {
  dropParked();
  openings.clear();
}
