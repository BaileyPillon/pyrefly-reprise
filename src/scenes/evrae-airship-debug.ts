/**
 * A throwaway screen that stages the Fahrenheit's foredeck
 * ({@link buildEvraeAirshipPainted}) without a presenter, so the location, the
 * NEAR / FAR staging and the order loop can be looked at and screenshotted.
 * Same shape as `macalania-temple-debug.ts`.
 *
 * Game case: FFX only [AGENTS.md rule 14].
 *
 * Not registered by this track (the integrator adds one line to
 * `src/debug/api.ts`: `app.register('scene-evrae-airship-deck', () => new
 * EvraeAirshipSceneScreen())`). Until then it is registered at runtime from the
 * console after a Vite `import()` of this module, which is what the scene's
 * browser pass did.
 *
 * Beats: `far` / `near` (the range shift), `far!` / `near!` (snap), `attack`,
 * `hurt`, `inhale`, `rig:<name>`, and `battle`: the harness battle
 * (`evrae-airship-debug-battle.ts`), the real engine and HUD with the order
 * widget, run to the first Tidus or Rikku turn. `hud:off` hides the HUD for a
 * muted-UI frame (§12.3's bar).
 */

import { Vector3, type Camera, type Scene } from 'three';
import { Screen } from '../app/Screen.ts';
import type { PaintedActor } from '../engine/PaintedActor.ts';
import { EvraeHarnessBattle } from './evrae-airship-debug-battle.ts';
import { buildEvraeAirshipPainted, type EvraePainted } from './evrae-airship-painted.ts';

const PARTY_IDS = ['tidus', 'wakka', 'rikku'] as const;

export class EvraeAirshipSceneScreen extends Screen {
  readonly name = 'scene-evrae-airship-deck';

  private painted: EvraePainted | null = null;
  private battle: EvraeHarnessBattle | null = null;
  private hudLayer: HTMLElement | null = null;

  override async enter(): Promise<void> {
    const painted = await buildEvraeAirshipPainted(this.app.renderer.camera);
    this.painted = painted;
    this.app.renderer.applyPalette(painted.palette);
    const h = this.app.renderer.domElement.height || 900;
    painted.setPixelScale(Math.max(0.5, h / 900));
    await painted.ready;
    void this.app.fade('clear', 500);
  }

  /** Screen position of a staged figure's centre, for the HUD's projector. */
  private project(id: string): { x: number; y: number } | null {
    const p = this.painted;
    if (!p) return null;
    const i = PARTY_IDS.indexOf(id as (typeof PARTY_IDS)[number]);
    const actor: PaintedActor | undefined = i >= 0 ? p.party[i] : id === 'evrae' ? p.evrae : undefined;
    if (!actor) return null;
    const v = actor.centerPoint(new Vector3()).project(this.app.renderer.camera);
    const rect = this.app.renderer.domElement.getBoundingClientRect();
    return { x: rect.left + ((v.x + 1) / 2) * rect.width, y: rect.top + ((1 - v.y) / 2) * rect.height };
  }

  private startBattle(): boolean {
    const p = this.painted;
    if (!p || this.battle) return false;
    const layer = document.createElement('div');
    layer.dataset['role'] = 'evrae-harness-hud';
    layer.style.cssText = 'position:absolute;inset:0;';
    this.root.appendChild(layer);
    this.hudLayer = layer;
    this.battle = new EvraeHarnessBattle(layer, p.director, (id) => this.project(id));
    this.battle.runToOrder();
    return true;
  }

  override update(dt: number): void {
    this.painted?.update(dt);
    this.battle?.update(dt);
  }

  override render(): { scene: Scene; camera: Camera } | null {
    if (!this.painted) return null;
    return { scene: this.painted.scene, camera: this.app.renderer.camera };
  }

  override trigger(name: string): boolean {
    if (name === 'battle') return this.startBattle();
    if (name === 'hud:off' || name === 'hud:on') {
      if (this.hudLayer) this.hudLayer.style.visibility = name === 'hud:off' ? 'hidden' : 'visible';
      return !!this.hudLayer;
    }
    return this.painted?.trigger(name) ?? false;
  }

  override exit(): void {
    this.battle?.dispose();
    this.battle = null;
    this.hudLayer?.remove();
    this.hudLayer = null;
    this.painted?.dispose();
    this.painted = null;
  }

  override snapshot(): Record<string, unknown> {
    const p = this.painted;
    return {
      scene: 'evrae-airship-deck',
      backdropPlaceholder: p?.backdrop.placeholder ?? null,
      range: p?.director.current ?? null,
      shifting: p?.director.shifting ?? null,
      evrae: p
        ? {
            position: p.evrae.position.toArray().map((n) => Math.round(n * 100) / 100),
            scale: Math.round(p.evrae.scale.x * 1000) / 1000,
            pose: p.evrae.pose,
            alpha: Math.round(p.evrae.alpha * 100) / 100,
          }
        : null,
      rig: p?.battleCamera.rigName ?? null,
      assets: p?.assetReport ?? null,
      battle: this.battle?.report() ?? null,
    };
  }
}
