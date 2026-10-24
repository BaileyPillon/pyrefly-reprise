/**
 * THE ROOM'S DRESSING, BUILT BEHIND THE PICKER (r64-fixes; both games: Chapter I is FFX, Chapter IV is FFX-2; the conference demo only, `?pack=demo`, off with `?prebuild=off` or `?livingpre=off`).
 *
 * The fight prebuild (`prebuildFigures.ts`) left the room's dressing for the battle's bind: Option B "Living Paintings" builds its depth plates, the weather's fields, the haze, the lamps and the cast-shadow
 * quads there, and their programs link on the first draw (47 to 93 ms, four times, about 0.3 s and the 100 to 130 ms frames that were left, `docs/handoff/fight-prebuild.md` "What remains" 1). This builds the
 * same `Living` for the prebuilt scene the battle will take, with the same inputs (`BattleScreen.enter`'s own bind, made from the same scene, camera, renderer and battle camera), draws its parts once so their programs
 * are built, and parks it (`engine/fx/b/LivingPark.ts`); `bindLivingScene` adopts it when the battle binds that scene. Nothing about the room differs: it is the room the battle would have built, built earlier.
 */
import type { App } from '../App.ts';
import type { Chapter } from '../../data/encounters.ts';
import type { LoadedScene } from '../../scenes/index.ts';
import { queryWord } from '../../engine/motion/DemoGate.ts';
import { parkLivingScene, type LivingBind } from '../../engine/fx/b/LivingPaintings.ts';
import type { WarmupRenderer } from '../screens/BattleScreenWarmup.ts';
import { drawParts, type DrawStats } from './prebuildDraw.ts';

/** `?livingpre=off` (or `today`): the room is built at the battle's bind, as r63-play does. For an A/B in one build, or if the adopted room ever misbehaves at the booth. */
export function livingPrebuildFromSearch(search: string | undefined): boolean {
  const w = queryWord(search, 'livingpre');
  return !(w === 'off' || w === 'today' || w === '0');
}

/** The bind `BattleScreen.enter` makes for `scene` (the same fields from the same objects), so the parked room is the battle's own. */
export function livingBindFor(app: Pick<App, 'renderer'>, chapter: Chapter, scene: LoadedScene): LivingBind {
  return {
    key: scene.key,
    game: chapter.game,
    scene: scene.scene,
    camera: app.renderer.camera,
    rigName: () => scene.battleCamera.rigName,
    battleCamera: scene.battleCamera,
    renderer: (app.renderer as { renderer?: LivingBind['renderer'] }).renderer,
  };
}

/** Build and draw the room for `scene`. True when a room was parked (false: the room is not dressed at this tier, or the switch is off). */
export async function prebuildLiving(app: Pick<App, 'renderer'>, chapter: Chapter, scene: LoadedScene, r: WarmupRenderer, calm: () => boolean, stats: DrawStats, note: (what: string) => void): Promise<boolean> {
  if (!livingPrebuildFromSearch(typeof window !== 'undefined' ? window.location.search : undefined)) return false;
  const t0 = performance.now();
  const parts = await parkLivingScene(livingBindFor(app, chapter, scene));
  if (!parts) return false;
  note(`${chapter.id}: the room's dressing built behind the picker (${Math.round(performance.now() - t0)} ms, ${parts.length} parts)`);
  if (!calm()) return true; // a fight was picked: the battle's bind adopts what is built
  const t1 = performance.now();
  await drawParts(r, scene.scene, parts, calm, stats);
  note(`${chapter.id}: the room's programs built in ${Math.round(performance.now() - t1)} ms (${stats.slices} draws so far)`);
  return true;
}
