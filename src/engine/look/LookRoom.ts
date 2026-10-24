/**
 * Demo looks: what the rig knows about the room it is drawing (the battle's diorama): the game, the painting, where the painting's own light is and what colour,
 * the fog's colour, and the grade's LUT for this look in this room (cached). Both games: everything comes from the room's own painting unless `LookGrades.ROOM_LOOKS`
 * names it.
 */
import { Data3DTexture, LinearFilter, Mesh, PlaneGeometry, Vector2, Vector3, type Camera, type Scene } from 'three';
import { srgbDecode } from '../figureTrue.ts';
import type { FxSceneInfo } from '../fx/a/GoldenHour.ts';
import { LUT_SIZE, hexRgb } from '../fx/a/LookLut.ts';
import { hex3, sceneLookA } from '../fx/a/sceneLooks.ts';
import type { LookName, LookStrength, Rgb } from './LookConfig.ts';
import { ROOM_LOOKS, lutBytes, lutKey, type GameKey, type GradeRecipe } from './LookGrades.ts';
import { findLight } from './LookLight.ts';

/** One room's light on the painting (0..1 from its top-left) and its colour. */
export interface RoomLight {
  u: number;
  v: number;
  color: Rgb;
  from: 'authored' | 'found' | 'table' | 'default';
}

/** sRGB channels to the linear light the chain works in. */
export const lin = (c: Rgb): Rgb => [srgbDecode(c[0]), srgbDecode(c[1]), srgbDecode(c[2])];
export const mixc = (a: Rgb, b: Rgb, t: number): Rgb => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

/** The light found on a painting, by the painting's image (the demo's prebuild finds it behind the picker, `primeRoomLight`; null: nothing bright enough was found). */
const foundLights = new WeakMap<object, RoomLight | null>();

type RoomImage = CanvasImageSource & { width: number; height: number };

/** The image on the room's backdrop-painting plane, if it has one. */
function paintingImage(scene: Scene): RoomImage | null {
  let painting: Mesh | null = null;
  scene.traverse((o) => {
    if (!painting && o.name === 'backdrop-painting' && (o as Mesh).isMesh) painting = o as Mesh;
  });
  const mat = (painting as Mesh | null)?.material as unknown as { map?: { image?: RoomImage } } | undefined;
  const img = mat?.map?.image;
  return img && img.width > 0 ? img : null;
}

/** Find the room's light on its painting ahead of the battle: the same 256 x 144 reduction and the same `findLight`, the reduction drawn in four strips (each its own task) because one draw of a 5376 x 3072 painting is 264 ms. True when a light is now known for the painting. */
export async function primeRoomLight(scene: Scene, pause: (ms?: number) => Promise<void>, more: () => boolean): Promise<boolean> {
  const img = paintingImage(scene);
  if (!img) return false;
  if (foundLights.has(img)) return true;
  try {
    const c = document.createElement('canvas');
    c.width = 256;
    c.height = 144;
    const ctx = c.getContext('2d', { willReadFrequently: true });
    if (!ctx) return false;
    const iw = (img as HTMLImageElement).naturalWidth || img.width;
    const ih = (img as HTMLImageElement).naturalHeight || img.height;
    const strips = 4;
    for (let i = 0; i < strips; i++) {
      if (!more()) return false;
      ctx.drawImage(img, 0, (ih * i) / strips, iw, ih / strips, 0, (144 * i) / strips, 256, 144 / strips);
      await pause(20);
    }
    const f = findLight(ctx.getImageData(0, 0, 256, 144).data, 256, 144);
    foundLights.set(img, f.score > 0.02 ? { u: f.u, v: f.v, color: f.color, from: 'found' } : null);
    return true;
  } catch {
    return false;
  }
}

export class LookRoom {
  scene: Scene | null = null;
  key = '';
  game: GameKey = 'ffx';
  info: FxSceneInfo | null = null;
  light: RoomLight = { u: 0.5, v: 0.1, color: [1, 0.9, 0.7], from: 'default' };
  painting: Mesh | null = null;
  fogRgb: Rgb = [0.3, 0.38, 0.5];
  private lut: Data3DTexture | null = null;
  private lutId = '';
  private readonly luts = new Map<string, Data3DTexture>();
  private readonly tmp = new Vector3();

  enter(info: FxSceneInfo, name: LookName): void {
    this.info = info;
    this.scene = info.scene;
    this.key = info.key;
    this.game = info.game === 'ffx2' ? 'ffx2' : 'ffx';
    this.painting = null;
    info.scene.traverse((o) => {
      if (!this.painting && o.name === 'backdrop-painting' && (o as Mesh).isMesh) this.painting = o as Mesh;
    });
    this.light = this.findRoomLight(info, name);
    const pal = info.palette ?? { key: 0xffe0b0, sky: 0x30405a };
    this.fogRgb = lin(ROOM_LOOKS[name][info.key]?.fog ?? mixc(hexRgb(pal.sky), hexRgb(pal.key), 0.3));
  }

  leave(): void {
    this.scene = null;
    this.key = '';
  }

  private findRoomLight(info: FxSceneInfo, name: LookName): RoomLight {
    const authored = ROOM_LOOKS[name][info.key]?.light;
    if (authored) return { ...authored, from: 'authored' };
    try {
      const mat = this.painting?.material as unknown as { map?: { image?: CanvasImageSource & { width: number; height: number } } } | undefined;
      const img = mat?.map?.image;
      if (img && img.width > 0 && foundLights.has(img)) {
        const known = foundLights.get(img);
        if (known) return { ...known, color: [...known.color] as Rgb };
      } else if (img && img.width > 0) {
        const c = document.createElement('canvas');
        c.width = 256;
        c.height = 144;
        const ctx = c.getContext('2d', { willReadFrequently: true });
        if (ctx) {
          ctx.drawImage(img, 0, 0, 256, 144);
          const f = findLight(ctx.getImageData(0, 0, 256, 144).data, 256, 144);
          foundLights.set(img, f.score > 0.02 ? { u: f.u, v: f.v, color: f.color, from: 'found' } : null);
          if (f.score > 0.02) return { u: f.u, v: f.v, color: f.color, from: 'found' };
        }
      }
    } catch {
      /* a texture whose image was released: fall through to the table */
    }
    const s = sceneLookA(info.key, this.game).shafts[0];
    if (s) return { u: s.u, v: s.v, color: hex3(s.color), from: 'table' };
    return { u: 0.5, v: 0.1, color: hexRgb(info.palette?.key ?? 0xffe0b0), from: 'default' };
  }

  /** The grade's LUT for `name` in this room (built once, kept for the last eight). */
  lutFor(name: LookName, strength: LookStrength = 'subtle', patch: Partial<GradeRecipe> | null = null, pro = false): Data3DTexture {
    const info = this.info!;
    const pal = info.palette ?? { key: 0xffe0b0, sky: 0x30405a };
    const id = lutKey(name, this.game, info.key, pal, strength, patch, pro);
    if (this.lut && id === this.lutId) return this.lut;
    let t = this.luts.get(id);
    if (!t) {
      t = new Data3DTexture(lutBytes(name, this.game, info.key, pal, strength, patch, pro), LUT_SIZE, LUT_SIZE, LUT_SIZE);
      t.minFilter = t.magFilter = LinearFilter;
      t.needsUpdate = true;
      this.luts.set(id, t);
      if (this.luts.size > 8) {
        const first = this.luts.keys().next().value as string;
        if (first !== id) {
          this.luts.get(first)?.dispose();
          this.luts.delete(first);
        }
      }
    }
    this.lut = t;
    this.lutId = id;
    return t;
  }

  /** The room's light on the painting, projected through the camera to the frame (uv, 0 bottom-left). */
  projectLight(camera: Camera, out: Vector2, at: { u: number; v: number } = this.light): void {
    const mesh = this.painting;
    const geo = mesh?.geometry as PlaneGeometry | undefined;
    const W = geo?.parameters?.width ?? 0;
    const H = geo?.parameters?.height ?? 0;
    if (mesh && W > 0) {
      mesh.updateWorldMatrix(true, false);
      this.tmp.set((at.u - 0.5) * W, (0.5 - at.v) * H, 0).applyMatrix4(mesh.matrixWorld).project(camera);
      out.set(this.tmp.x * 0.5 + 0.5, this.tmp.y * 0.5 + 0.5);
    } else out.set(at.u, 1 - at.v);
  }

  dispose(): void {
    for (const t of this.luts.values()) t.dispose();
    this.luts.clear();
    this.lut = null;
  }
}
