/**
 * Option A7, the figures' rim light matched to the painting's key light. Today the rim is a
 * constant `0xbfe0ff` (`BattlePresenterStage`); under A it takes the painting's own key hue
 * (`BackdropPalette.key`) lifted to a luma of 0.85, at the per-game strength. No normal maps
 * (that is the declined `depth-normal-lighting`); the rim's side and width are unchanged.
 *
 * A phase beat that tints the rim (`PhaseLighting`, D-224) wins: a material whose rim colour
 * is no longer the one recorded (or the one written here) is left alone until it returns.
 * Switching A off puts every recorded rim back.
 */

import { Color, type Object3D, type ShaderMaterial } from 'three';

interface RimCells {
  rimColor: { value: Color };
  rimStrength: { value: number };
  rimWidth?: { value: number };
}

interface Record {
  u: RimCells;
  orig: Color;
  origStrength: number;
  origWidth: number | null;
  wrote: Color | null;
}

export class KeyRim {
  private readonly seen = new Map<ShaderMaterial, Record>();
  private scan = 0;

  /**
   * @param color the key-matched rim
   * @param strength the per-game strength
   * @param width a multiplier on the figure's own rim width (1 = unchanged)
   */
  apply(root: Object3D, color: Color, strength: number, width = 1): void {
    if (--this.scan <= 0) {
      this.scan = 20;
      root.traverse((o) => {
        const m = (o as Object3D & { material?: ShaderMaterial }).material;
        const u = m?.uniforms as unknown as RimCells | undefined;
        if (!m || !u || !u.rimColor || !u.rimStrength || this.seen.has(m)) return;
        if (!(u.rimColor.value instanceof Color)) return;
        this.seen.set(m, { u, orig: u.rimColor.value.clone(), origStrength: u.rimStrength.value, origWidth: u.rimWidth?.value ?? null, wrote: null });
      });
    }
    for (const r of this.seen.values()) {
      const now = r.u.rimColor.value;
      const ours = r.wrote && now.equals(r.wrote);
      if (!ours && !now.equals(r.orig)) {
        // Someone else (a phase beat) set it: follow them, and take this as the new base if it sticks.
        r.wrote = null;
        continue;
      }
      // Mostly the painting's key; a third of the stage's own rim stays so the figures keep their read.
      now.copy(r.orig).lerp(color, 0.7);
      r.u.rimStrength.value = strength;
      if (r.u.rimWidth && r.origWidth !== null) r.u.rimWidth.value = r.origWidth * width;
      r.wrote = now.clone();
    }
  }

  /** Put every rim back as it was. */
  restore(): void {
    for (const r of this.seen.values()) {
      if (r.wrote && r.u.rimColor.value.equals(r.wrote)) {
        r.u.rimColor.value.copy(r.orig);
        r.u.rimStrength.value = r.origStrength;
        if (r.u.rimWidth && r.origWidth !== null) r.u.rimWidth.value = r.origWidth;
      }
      r.wrote = null;
    }
  }

  forget(): void {
    this.seen.clear();
    this.scan = 0;
  }
}

/** The painting's key hue at a luma of 0.85 (the rim colour A uses). */
export function keyRimColor(keyHex: number, out = new Color()): Color {
  out.setHex(keyHex);
  const l = 0.2126 * out.r + 0.7152 * out.g + 0.0722 * out.b;
  const k = 0.85 / Math.max(0.02, l);
  out.setRGB(Math.min(1, out.r * k), Math.min(1, out.g * k), Math.min(1, out.b * k));
  return out;
}
