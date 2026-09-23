/**
 * A throwaway screen that stages the Macalania Temple antechamber
 * ({@link buildMacalaniaTemplePainted}) without a battle, a HUD or a presenter,
 * so the location, the formation and Anima's arrival can be looked at and
 * screenshotted. Same shape as `leblanc-last-room-debug.ts`.
 *
 * Not registered by this track (the integrator adds one line to
 * `src/debug/api.ts`: `app.register('scene-macalania-temple', () => new
 * MacalaniaTempleSceneScreen())`). Until then it can be registered at runtime
 * from the console: `__pyrefly.app.register('scene-macalania-temple', ...)`
 * after a Vite `import()` of this module, which is what the scene's browser
 * pass did.
 *
 * Beats: `arrival` (Anima's rise, in real time), `arrival-at:<ms>` (jump to one
 * instant of it), `reset`, `attack`, `cast`, `hurt`, `rig:<name>`, `push-in`.
 *
 * **Concept B's tags** are drawn here, as DOM over the canvas, because they are
 * HUD rather than scene: once the arrival's `tagOn` beat lands, Seymour's grey
 * reticle reads "Cannot be targeted" and Anima's name lights gold. In a real
 * battle that belongs to the targeting HUD (decision C-2's `untargetable`
 * flag); this is the preview of what it should look like.
 */

import { Vector3, type Camera, type Scene } from 'three';
import { Screen } from '../app/Screen.ts';
import type { PaintedActor } from '../engine/PaintedActor.ts';
import { buildMacalaniaTemplePainted, type MacalaniaPainted } from './macalania-temple-painted.ts';

const TAG_CSS = `
.mac-tag{position:fixed;pointer-events:none;z-index:40;transform:translate(-50%,-100%);transition:opacity .45s ease;opacity:0}
.mac-tag.is-on{opacity:1}
.mac-tag__plate{font:700 13px/1 var(--ig-font-display,system-ui,sans-serif);letter-spacing:.3em;text-transform:uppercase;
  padding:9px 14px;white-space:nowrap;background:rgba(10,14,24,.84);color:#c9ccd6;border:1px solid rgba(160,166,180,.35)}
.mac-tag--gold .mac-tag__plate{font:italic 700 26px/1 var(--ig-font-serif,Georgia,serif);letter-spacing:0;text-transform:none;
  color:#f3e7c4;background:transparent;border:0;border-bottom:2px solid #d9b45a;padding:4px 16px}
.mac-reticle{position:fixed;pointer-events:none;z-index:39;border:0;opacity:0;transition:opacity .45s ease}
.mac-reticle.is-on{opacity:1}
.mac-reticle i{position:absolute;width:22px;height:22px;border-color:rgba(170,176,190,.7);border-style:solid;border-width:0}
.mac-reticle i:nth-child(1){left:0;top:0;border-left-width:2px;border-top-width:2px}
.mac-reticle i:nth-child(2){right:0;top:0;border-right-width:2px;border-top-width:2px}
.mac-reticle i:nth-child(3){left:0;bottom:0;border-left-width:2px;border-bottom-width:2px}
.mac-reticle i:nth-child(4){right:0;bottom:0;border-right-width:2px;border-bottom-width:2px}
`;

export class MacalaniaTempleSceneScreen extends Screen {
  readonly name = 'scene-macalania-temple';

  private painted: MacalaniaPainted | null = null;
  private dom: HTMLElement | null = null;
  private seymourTag: HTMLElement | null = null;
  private seymourReticle: HTMLElement | null = null;
  private animaTag: HTMLElement | null = null;

  override async enter(): Promise<void> {
    const painted = await buildMacalaniaTemplePainted(this.app.renderer.camera);
    this.painted = painted;
    this.app.renderer.applyPalette(painted.palette);
    const h = this.app.renderer.domElement.height || 900;
    painted.setPixelScale(Math.max(0.5, h / 900));
    this.mountTags();
    void this.app.fade('clear', 500);
  }

  private mountTags(): void {
    const root = document.createElement('div');
    root.dataset['role'] = 'macalania-tags';
    root.innerHTML =
      `<style>${TAG_CSS}</style>` +
      '<div class="mac-reticle"><i></i><i></i><i></i><i></i></div>' +
      '<div class="mac-tag"><div class="mac-tag__plate">Cannot be targeted</div></div>' +
      '<div class="mac-tag mac-tag--gold"><div class="mac-tag__plate">Anima</div></div>';
    this.app.uiRoot.appendChild(root);
    this.dom = root;
    this.seymourReticle = root.querySelector('.mac-reticle');
    const tags = root.querySelectorAll<HTMLElement>('.mac-tag');
    this.seymourTag = tags[0] ?? null;
    this.animaTag = tags[1] ?? null;
  }

  /** Screen-space box of an actor's painted silhouette, in CSS px. */
  private box(actor: PaintedActor): { l: number; t: number; r: number; b: number } | null {
    const canvas = this.app.renderer.domElement;
    const rect = canvas.getBoundingClientRect();
    const cam = this.app.renderer.camera;
    const quad = actor.contentQuad();
    let l = Infinity;
    let t = Infinity;
    let r = -Infinity;
    let b = -Infinity;
    const v = new Vector3();
    for (const q of quad) {
      v.copy(q).project(cam);
      const x = rect.left + ((v.x + 1) / 2) * rect.width;
      const y = rect.top + ((1 - v.y) / 2) * rect.height;
      l = Math.min(l, x);
      r = Math.max(r, x);
      t = Math.min(t, y);
      b = Math.max(b, y);
    }
    return Number.isFinite(l) ? { l, t, r, b } : null;
  }

  private placeTags(): void {
    const p = this.painted;
    if (!p || !this.seymourTag || !this.animaTag || !this.seymourReticle) return;
    const on = p.arrival()?.tagOn ?? false;
    for (const el of [this.seymourTag, this.animaTag, this.seymourReticle]) el.classList.toggle('is-on', on);
    if (!on) return;
    const s = this.box(p.seymour);
    if (s) {
      const pad = 10;
      Object.assign(this.seymourReticle.style, {
        left: `${s.l - pad}px`,
        top: `${s.t - pad}px`,
        width: `${s.r - s.l + pad * 2}px`,
        height: `${s.b - s.t + pad * 2}px`,
      });
      Object.assign(this.seymourTag.style, { left: `${(s.l + s.r) / 2}px`, top: `${s.t - pad - 8}px` });
    }
    const a = this.box(p.anima);
    if (a) {
      // Concept B: her name sits low on her left flank, under a gold rule.
      Object.assign(this.animaTag.style, { left: `${a.l + (a.r - a.l) * 0.28}px`, top: `${a.t + (a.b - a.t) * 0.72}px` });
    }
  }

  override update(dt: number): void {
    this.painted?.update(dt);
    this.placeTags();
  }

  override render(): { scene: Scene; camera: Camera } | null {
    if (!this.painted) return null;
    return { scene: this.painted.scene, camera: this.app.renderer.camera };
  }

  override trigger(name: string): boolean {
    if (name === 'push-in') {
      this.painted?.battleCamera.snapTo('intro');
      void this.painted?.battleCamera.moveTo('idle', 2400, 'cubicInOut');
      return true;
    }
    return this.painted?.trigger(name) ?? false;
  }

  override exit(): void {
    this.dom?.remove();
    this.dom = null;
    this.painted?.dispose();
    this.painted = null;
  }

  override snapshot(): Record<string, unknown> {
    const a = this.painted?.arrival() ?? null;
    return {
      scene: 'macalania-temple',
      backdropPlaceholder: this.painted?.backdrop.placeholder ?? null,
      rigs: this.painted ? Object.keys(this.painted.rigs) : [],
      assets: this.painted?.assetReport ?? null,
      arrival: a,
    };
  }
}
