/**
 * Option A4, backdrop depth of field by **mip-biased sampling** in the painting's own
 * material: no extra pass, and no cut-out halo round the figures (the artefact that ruled out
 * a depth-of-field pass, research/visual-bible.md §6.4). The painted textures carry trilinear
 * mipmaps (`PaintedArt.ts`), so a bias of 1 reads one mip softer.
 *
 * The bias is strongest at the top of the painting (the far walls, the sky) and falls to a
 * third toward its bottom edge, the floor behind the party. The approved Ink & Gold line
 * "backdrop depth-of-field while a menu is open" is the focus pull: the bias eases up while a
 * command menu is open and down again when it closes (it snaps under Reduce motion).
 *
 * Game case: both, the same method. The painting's pixels are never changed: the bias is a
 * sampling choice at draw time, and at 0 the patched shader samples exactly as before.
 */

import type { Material, MeshBasicMaterial, Object3D } from 'three';

const PATCHED = Symbol('fxFocus');

export class BackdropFocus {
  /** Shared by every patched material. */
  readonly bias = { value: 0 };
  private current = 0;
  private menuEl: HTMLElement | null = null;
  private menuCheck = 0;
  private menuOpen = false;

  /** Patch the painting planes under `root` (idempotent). */
  patch(root: Object3D): number {
    let n = 0;
    root.traverse((o) => {
      if (o.name !== 'backdrop-painting' && !o.name.startsWith('backdrop-layer-')) return;
      const mat = (o as Object3D & { material?: Material }).material as (MeshBasicMaterial & { [PATCHED]?: boolean }) | undefined;
      if (!mat || mat[PATCHED] || !mat.map) return;
      mat[PATCHED] = true;
      // Layers sit nearer the camera than the painting, so they soften less.
      const depth = o.name === 'backdrop-painting' ? 1 : 0.6;
      const bias = this.bias;
      mat.onBeforeCompile = (shader) => {
        shader.uniforms['uFxBias'] = bias;
        shader.fragmentShader = shader.fragmentShader
          .replace('void main() {', `uniform float uFxBias;\nvoid main() {`)
          .replace(
            '#include <map_fragment>',
            `#ifdef USE_MAP
              float fxB = uFxBias * ${depth.toFixed(2)} * mix(0.33, 1.0, smoothstep(0.12, 0.62, vMapUv.y));
              vec4 sampledDiffuseColor = texture2D( map, vMapUv, fxB );
              diffuseColor *= sampledDiffuseColor;
            #endif`,
          );
      };
      mat.customProgramCacheKey = () => `fxFocus${depth}`;
      mat.needsUpdate = true;
      n++;
    });
    return n;
  }

  /** True while a battle command menu is on screen (checked every few frames). */
  private menuVisible(): boolean {
    if (typeof document === 'undefined') return false;
    if (--this.menuCheck > 0) return this.menuOpen;
    this.menuCheck = 6;
    if (!this.menuEl || !this.menuEl.isConnected) this.menuEl = document.querySelector<HTMLElement>('.ig-cmd-stack');
    const el = this.menuEl;
    this.menuOpen = !!el && !el.hidden && el.offsetParent !== null && el.getBoundingClientRect().height > 0 && getComputedStyle(el).opacity !== '0';
    return this.menuOpen;
  }

  /**
   * @param dt seconds
   * @param levels bias at rest and with a menu open
   * @param snap no easing (Reduce motion)
   */
  update(dt: number, levels: { rest: number; menu: number }, snap: boolean): void {
    const want = this.menuVisible() ? levels.menu : levels.rest;
    if (snap) this.current = want;
    else this.current += (want - this.current) * (1 - Math.exp(-dt / 0.09));
    this.bias.value = this.current;
  }

  get menu(): boolean {
    return this.menuOpen;
  }

  off(): void {
    this.current = 0;
    this.bias.value = 0;
  }
}
