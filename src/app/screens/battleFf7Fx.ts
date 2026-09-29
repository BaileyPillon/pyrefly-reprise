/**
 * FF7's effects in the battle (FF7 only; Bailey, 2026-09-27, "I'll go with all
 * of your recommendations": D-260 Spectacle built on A3 plus, D-244 B1's white
 * hit flash and knock-back). What the stage gets for game `'ff7'`:
 *
 * - the FF7 effects (`engine/spellfx/ff7/`) through the house spell-FX layer,
 *   its overlay, its playback-speed clock and its quality tiers: full, the
 *   phone tier (60 % density, the particle cap), and `low` (Low effects: the
 *   plain impact bloom only);
 * - the **calm version** under reduced motion (the pause's setting or the OS):
 *   the flash rules say calm, so the effects thin their particles to 40 % and
 *   drop the haze, the streaks and every wash; no camera shake, no flash frame;
 * - at each blow's mark (`onLand`): the white hit flash on the target, a short
 *   knock-back on the boss, the effect's colour cast onto every fighter with
 *   distance (A3's cast light), and on the two big hits (Tail Laser, Braver) a
 *   short camera shake and **one** white flash frame (about 17 ms, once per action).
 *
 * The DOM side of the battle (a flash-frame layer beside the canvas); the
 * presenter still imports no DOM (rule 1).
 */

import type { Renderer } from '../../engine/Renderer.ts';
import type { BattleStage, PlaybackSpeed } from '../../engine/BattlePresenterPorts.ts';
import type { StageSpellFxOptions } from '../../engine/spellfx/stageSpellFx.ts';
import { DEFAULT_FLASH_PARAMS, resolveFxQuality, type FlashParams } from '../../engine/spellfx/SpellFxParams.ts';
import { SPEED_RATE } from '../../engine/spellfx/SpellFxSpecials.ts';
import type { SpellFxId } from '../../engine/spellfx/SpellFxRegistry.ts';
import type { LandOpts } from '../../engine/spellfx/SpellFxLayer.ts';
import { FF7_BIG_HITS, type Ff7FxId } from '../../engine/spellfx/ff7/ff7FxSpecs.ts';
import { readSetting } from '../SaveData.ts';
import { prefersReducedMotion } from '../../ui/common/transitions/reduceMotion.ts';

/** The calm flash rules: no wash survives, actor glows capped, one wash per action. */
export const FF7_CALM_FLASH: Readonly<FlashParams> = Object.freeze({
  washCap: 0,
  whiteWashTo: '#FFF1D6',
  oneWashPerAction: true,
  actorCap: 0.35,
  singleBolt: true,
});

/** The cast light (our estimate): peak at the blow, lost over `falloffPx` of screen, held `ms`; the target's own. */
/** How much of the flash floor B1's white hit flash drops (0 = the house flash); the cast light drops all of it. Ours. */
export const FF7_HIT_FLOOR_CUT = 0.5;
export const FF7_CAST = { peak: 0.9, falloffPx: 1700, ms: 680, target: 0.75, afterWhiteMs: 150 } as const;

/** Each effect's light, cast onto the fighters and used for the tint. Ours. */
export const FF7_FX_LIGHT: Readonly<Record<Ff7FxId, number>> = {
  'ff7-bolt': 0xffe070,
  'ff7-ice': 0xa8e8ff,
  'ff7-cure': 0xa8ffcc,
  'ff7-slash': 0xdce9ff,
  'ff7-shot': 0xffc070,
  'ff7-braver': 0xdce9ff,
  'ff7-bigshot': 0xff9a40,
  'ff7-scope': 0xff4646,
  'ff7-rifle': 0xffc070,
  'ff7-tail': 0x8cdcff,
  'ff7-laser': 0x78d8ff,
  'ff7-down': 0xffb060,
};

const isFf7Fx = (fx: SpellFxId): fx is Ff7FxId => fx.startsWith('ff7-');

/** Whether the calm version is on. */
export function ff7Calm(): boolean {
  return prefersReducedMotion();
}

/** One white frame over the field (not the HUD), removed on the next painted frame. */
export function flashFrame(canvas: HTMLCanvasElement | null): void {
  const host = canvas?.parentElement;
  if (!host || typeof requestAnimationFrame !== 'function') return;
  const el = document.createElement('div');
  el.className = 'ff7-flash-frame';
  el.style.cssText = 'position:absolute;inset:0;background:#fff;opacity:0.82;pointer-events:none;z-index:5';
  host.appendChild(el);
  requestAnimationFrame(() => requestAnimationFrame(() => el.remove()));
}

/**
 * Where FF7's effects may draw: below the top message window while it is up (repair item 10: Bolt crossed the
 * translucent window; FF7 keeps its windows over the field). The band's windows are opaque and cover the rest.
 * Null (the whole frame) when no message is up.
 */
export function ff7FxClip(canvas: HTMLCanvasElement | null): { x: number; y: number; w: number; h: number } | null {
  const win = canvas && typeof document !== 'undefined' ? document.querySelector('.ff7hud .ff7-win[data-win="message"]') : null;
  if (!canvas || !win) return null;
  const c = canvas.getBoundingClientRect();
  const r = win.getBoundingClientRect();
  if (!c.height || r.height <= 0) return null;
  const top = Math.max(0, Math.min(c.height, r.bottom - c.top));
  return { x: 0, y: top, w: c.width, h: c.height - top };
}

/** The director: what each landing does to the fighters and the frame. */
export class Ff7FxDirector {
  private lastBigAction: number | null = null;
  /** Counts, for the tests and the capture: flash frames and shakes played. */
  readonly played = { flashFrames: 0, shakes: 0, hits: 0 };

  constructor(
    private readonly stage: () => BattleStage | null,
    private readonly rate: () => number,
    private readonly canvas: () => HTMLCanvasElement | null,
    private readonly calm: () => boolean = ff7Calm,
    private readonly later: (fn: () => void, ms: number) => void = (fn, ms) => void setTimeout(fn, ms),
  ) {}

  onLand(fx: SpellFxId, target: string, ms: number, o: LandOpts): void {
    if (!isFf7Fx(fx) || fx === 'ff7-scope') return; // the lock-on is calm by design: no hit, no flash, no shake
    const r = this.rate();
    const wait = Math.max(0, Math.round(ms / (Number.isFinite(r) && r > 0 ? r : 1)));
    const action = o.action ?? -1;
    this.later(() => this.hit(fx, target, action), wait);
  }

  private hit(fx: Ff7FxId, target: string, action: number): void {
    const stage = this.stage();
    if (!stage) return;
    const calm = this.calm();
    this.played.hits++;
    const actor = stage.actor(target);
    const heal = fx === 'ff7-cure';
    // B1: the white hit flash, and a short knock-back on the boss. Neither flash lifts the painting's darks to a flat
    // pale veil (the cast has no floor, the white pop half of it): a lifted dark lower body read as see-through (P3P-1).
    actor?.flash(heal ? 0xc8ffe0 : 0xffffff, heal ? 320 : 150, calm ? 0.35 : 0.95, FF7_HIT_FLOOR_CUT);
    if (!heal && stage.sideOf(target) === 'enemy') void actor?.lunge(fx === 'ff7-braver' || fx === 'ff7-bigshot' ? -0.55 : -0.3, 240);
    // A3's cast light: the effect's colour on every fighter, falling off with distance on screen, and on the
    // target itself once the white flash has passed (repair item 5: the cast was too faint to see in live frames).
    const at = stage.project(target, 'chest');
    const light = FF7_FX_LIGHT[fx];
    for (const id of stage.staged()) {
      if (id === target) continue;
      const p = stage.project(id, 'chest');
      if (!p || !at) continue;
      const d = Math.hypot(p.x - at.x, p.y - at.y);
      const peak = Math.max(0, FF7_CAST.peak - d / FF7_CAST.falloffPx) * (calm ? 0.5 : 1);
      if (peak > 0.04) stage.actor(id)?.flash(light, FF7_CAST.ms, peak, 1);
    }
    if (!heal) this.later(() => this.stage()?.actor(target)?.flash(light, FF7_CAST.ms, FF7_CAST.target * (calm ? 0.5 : 1), 1), FF7_CAST.afterWhiteMs);
    if (calm || !FF7_BIG_HITS.has(fx) || this.lastBigAction === action) return;
    this.lastBigAction = action;
    stage.camera.shake(fx === 'ff7-braver' ? 0.12 : 0.09, 340);
    this.played.shakes++;
    flashFrame(this.canvas());
    this.played.flashFrames++;
  }
}

/** The stage's spell-FX options for an FF7 battle. */
export function ff7SpellFxOptions(
  renderer: Renderer,
  speed: (() => PlaybackSpeed | undefined) | undefined,
  stage: () => BattleStage | null,
): Pick<StageSpellFxOptions, 'game' | 'overlay' | 'quality' | 'flash' | 'rate' | 'onLand' | 'clip'> & { director: Ff7FxDirector } {
  const rate = (): number => SPEED_RATE(speed?.() ?? 'normal');
  const director = new Ff7FxDirector(stage, rate, () => renderer.renderer.domElement);
  return {
    game: 'ff7',
    rate,
    overlay: (draw) => renderer.addOverlay(draw),
    // Reduced motion keeps the effects (calm); only Low effects falls back to the plain bloom.
    quality: () =>
      resolveFxQuality({ lowEffects: readSetting('lowEffects') === true, reduceMotion: false, width: window.innerWidth, height: window.innerHeight }),
    flash: () => (ff7Calm() ? FF7_CALM_FLASH : DEFAULT_FLASH_PARAMS),
    onLand: (fx, target, ms, o) => director.onLand(fx, target, ms, o),
    clip: () => ff7FxClip(renderer.renderer.domElement),
    director,
  };
}
