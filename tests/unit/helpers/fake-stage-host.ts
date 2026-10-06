/**
 * Fakes for the texture stager's tests (release 39.1, "r391-stalls"): a renderer and a WebGL context that behave as three 0.186 does where `TextureStager.ts` depends on it. `initTexture`
 * makes one GL texture per `Source` (a second texture that shares the source shares the GL texture, with a count of users), `dispose()` gives a user back, and the last user frees the GL
 * texture. The context records every sub-image upload with the pixel-store state at that moment.
 */
import { SRGBColorSpace, Texture } from 'three';
import type { StageHost, StageRequest } from '../../../src/engine/TextureStager.ts';

export interface GlTex {
  id: number;
  freed: boolean;
  users: number;
}

export class FakeGl {
  readonly TEXTURE_2D = 3553;
  readonly TEXTURE0 = 33984;
  readonly RGBA = 6408;
  readonly UNSIGNED_BYTE = 5121;
  readonly UNPACK_FLIP_Y_WEBGL = 37440;
  readonly UNPACK_PREMULTIPLY_ALPHA_WEBGL = 37441;
  readonly UNPACK_ALIGNMENT = 3317;
  readonly UNPACK_SKIP_ROWS = 3314;
  lost = false;
  store = new Map<number, number | boolean>();
  bound: GlTex | null = null;
  /** Every texSubImage2D: the texture, the row and rows, and the sub-rectangle state at the moment of the call. */
  subs: Array<{ tex: number; y: number; rows: number; width: number; skip: number; flip: unknown; premul: unknown; source: unknown }> = [];
  mipmaps: number[] = [];
  isContextLost(): boolean {
    return this.lost;
  }
  texSubImage2D(_target: number, _level: number, _x: number, y: number, width: number, rows: number, _format: number, _type: number, source: unknown): void {
    this.subs.push({ tex: this.bound!.id, y, rows, width, skip: Number(this.store.get(this.UNPACK_SKIP_ROWS) ?? 0), flip: this.store.get(this.UNPACK_FLIP_Y_WEBGL), premul: this.store.get(this.UNPACK_PREMULTIPLY_ALPHA_WEBGL), source });
  }
  generateMipmap(): void {
    this.mipmaps.push(this.bound!.id);
  }
}

export class FakeHost implements StageHost {
  readonly gl = new FakeGl();
  readonly log: string[] = [];
  readonly glTextures: GlTex[] = [];
  /** What three keeps: one GL texture per source, shared by every texture on that source. */
  private readonly bySource = new WeakMap<object, GlTex>();
  private readonly initialised = new WeakSet<Texture>();
  private readonly records = new WeakMap<object, Record<string, unknown>>();
  /** The uploads a texture made through `initTexture`: what the image was and whether data was ready. */
  readonly uploads: Array<{ tex: number; image: unknown; dataReady: boolean }> = [];
  /** A host whose renderer keeps no `__webglTexture`: the band path cannot find the GL texture. */
  hideHandle = false;
  private seq = 0;

  readonly state = {
    bindTexture: (_type: number, tex: WebGLTexture, slot?: number): void => {
      this.log.push(`bind:${(tex as unknown as GlTex).id}@${slot}`);
      this.gl.bound = tex as unknown as GlTex;
    },
    unbindTexture: (): void => {
      this.log.push('unbind');
      this.gl.bound = null;
    },
    pixelStorei: (name: number, value: number | boolean): void => {
      this.gl.store.set(name, value);
    },
  };
  readonly properties = {
    get: (o: unknown): unknown => {
      let r = this.records.get(o as object);
      if (!r) this.records.set(o as object, (r = {}));
      return r;
    },
  };

  getContext(): WebGLRenderingContext {
    return this.gl as unknown as WebGLRenderingContext;
  }

  initTexture(texture: Texture): void {
    this.log.push(`init:${texture.name}`);
    const rec = this.properties.get(texture) as Record<string, unknown>;
    let gl = this.bySource.get(texture.source);
    if (!gl) {
      gl = { id: ++this.seq, freed: false, users: 0 };
      this.glTextures.push(gl);
      this.bySource.set(texture.source, gl);
      this.uploads.push({ tex: gl.id, image: texture.image, dataReady: texture.source.dataReady });
    }
    if (!this.initialised.has(texture)) {
      this.initialised.add(texture);
      gl.users++;
      texture.addEventListener('dispose', () => {
        this.initialised.delete(texture);
        this.records.delete(texture);
        gl!.users--;
        if (gl!.users === 0) {
          gl!.freed = true;
          this.bySource.delete(texture.source);
          this.log.push(`free:${gl!.id}`);
        }
      });
    }
    if (!this.hideHandle) rec['__webglTexture'] = gl;
  }
}

export function bitmap(width: number, height: number): ImageBitmap & { closed: number } {
  const b = { width, height, closed: 0, close() { b.closed++; } };
  return b as unknown as ImageBitmap & { closed: number };
}

export function painting(name = 'pose'): Texture {
  const t = new Texture({ width: 100, height: 100 } as unknown as HTMLImageElement);
  t.name = name;
  t.colorSpace = SRGBColorSpace;
  t.anisotropy = 8;
  t.needsUpdate = true;
  return t;
}

export function request(target: Texture, w = 4096, h = 4096, urgent = false): StageRequest & { bitmap: ReturnType<typeof bitmap> } {
  return { target, image: { width: w, height: h }, bitmap: bitmap(w, h), urgent };
}
