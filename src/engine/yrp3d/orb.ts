/**
 * **The gathering orb** (the hidden 3D Bahamut chapter, FFX-2 only): the light that swells at Bahamut's chest while he holds the `cast` pose (his Mega Flare; end-state frame C's "gathering light orb at his chest"). One additive
 * sprite with a procedural radial texture (a white core, a violet halo, a thin ring), no image file: it is a glow, drawn into a `DataTexture` so it needs no canvas and runs under a test. The strength is the model's cast glow
 * (`./layout.ts` `castGlow`), so the orb and the emissive swell together and let go together.
 *
 * Needs three.js only. Game case: FFX-2 only.
 */

import { AdditiveBlending, Color, DataTexture, LinearFilter, RGBAFormat, Sprite, SpriteMaterial, UnsignedByteType } from 'three';

const SIZE = 64;

/** The orb's texture: white core to violet halo to nothing at the edge, with a faint ring at 0.62 of the radius. Premultiplied for additive blending (the colour carries the alpha). */
export function orbTexture(): DataTexture {
  const data = new Uint8Array(SIZE * SIZE * 4);
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const r = Math.hypot((x + 0.5) / SIZE - 0.5, (y + 0.5) / SIZE - 0.5) * 2; // 0 at the centre, 1 at the edge
      const core = Math.exp(-((r / 0.22) ** 2));
      const halo = Math.max(0, 1 - r) ** 2.2 * 0.8;
      const ring = Math.exp(-(((r - 0.62) / 0.045) ** 2)) * 0.45;
      const i = (y * SIZE + x) * 4;
      const v = Math.min(1, core + halo * 0.6 + ring);
      data[i] = Math.round(255 * Math.min(1, v * (0.78 + 0.22 * core)));
      data[i + 1] = Math.round(255 * Math.min(1, v * (0.55 + 0.45 * core)));
      data[i + 2] = Math.round(255 * Math.min(1, v));
      data[i + 3] = Math.round(255 * Math.min(1, v));
    }
  }
  const t = new DataTexture(data, SIZE, SIZE, RGBAFormat, UnsignedByteType);
  t.minFilter = LinearFilter;
  t.magFilter = LinearFilter;
  t.generateMipmaps = false;
  t.needsUpdate = true;
  return t;
}

/** The orb: a sprite that is hidden at strength 0 and grows and brightens with it. */
export class Orb {
  readonly sprite: Sprite;
  private readonly map = orbTexture();
  private readonly material: SpriteMaterial;

  constructor(colour: number = 0xc99bff) {
    this.material = new SpriteMaterial({ map: this.map, color: new Color(colour), blending: AdditiveBlending, transparent: true, depthWrite: false, fog: false, toneMapped: false });
    this.sprite = new Sprite(this.material);
    this.sprite.name = 'yrp-orb';
    this.sprite.visible = false;
    this.sprite.renderOrder = 20;
  }

  /** Place the orb on a figure `height` tall: the chest, a little in front of it (yaw space: +Z is the way it faces). */
  place(height: number): void {
    this.sprite.position.set(0, height * 0.62, height * 0.2);
  }

  /** `strength` 0..1 (the cast glow); `height` the figure's: the radius swells from nothing to 0.42 of it. */
  set(strength: number, height: number): void {
    const s = Math.min(1, Math.max(0, strength));
    this.sprite.visible = s > 0.01;
    this.sprite.scale.setScalar(height * (0.1 + 0.74 * s));
    this.material.opacity = Math.min(1, s * 1.25);
  }

  dispose(): void {
    this.sprite.removeFromParent();
    this.material.dispose();
    this.map.dispose();
  }
}
