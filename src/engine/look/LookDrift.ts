/**
 * Demo looks: the backdrop's slow idle drift, `?lookdrift=1` (its own flag, because the battle camera's grammar is a separate approved test; dev flag only, nothing ships).
 * The painting and its parallax layers move together by a few pixels (a slow sum of two sines, a period of 24 s), so the plate slides a little behind the fighters and the
 * nearer layers slide a touch more than the far sky: parallax, not a wobble. It stands still while a command menu is open (`lookState.commandOpen`, polled by
 * `debug/lookApi.ts`): the gate eases to 0 in about half a second and back. Both games; each room names how far its painting allows (`ROOM_BOLD.driftPx`).
 */
import { Vector3, type Camera, type Mesh, type Scene } from 'three';
import { driftPx, gateStep } from './LookBoldConfig.ts';

const NAMES = /^backdrop-(painting|layer-|wing-)/;

export class LookDrift {
  private scene: Scene | null = null;
  private meshes: Mesh[] = [];
  /** The world offset in x applied to every plate so far. */
  private applied = 0;
  private gate = 0;
  private t = 0;
  private readonly a = new Vector3();
  private readonly b = new Vector3();
  /** For the debug API. */
  readonly stats = { px: 0, gate: 0, meshes: 0 };

  private collect(scene: Scene): void {
    this.release();
    this.scene = scene;
    this.meshes = [];
    scene.traverse((o) => {
      if (NAMES.test(o.name) && (o as Mesh).isMesh) this.meshes.push(o as Mesh);
    });
  }

  private shift(dx: number): void {
    if (Math.abs(dx) < 1e-9) return;
    for (const m of this.meshes) {
      m.position.x += dx;
      m.updateMatrix();
      m.matrixWorldNeedsUpdate = true;
    }
    this.applied += dx;
  }

  /** One frame: `painting` is the main plate (for the pixel scale), `amp` the room's reach in px at 900p, `still` true while a command menu is open. */
  update(scene: Scene, camera: Camera, painting: Mesh | null, amp: number, dt: number, W: number, scale: number, still: boolean): void {
    if (scene !== this.scene) this.collect(scene);
    if (!painting || !this.meshes.length) return;
    this.t += dt;
    this.gate = gateStep(this.gate, still ? 0 : 1, dt, 0.5);
    // world units per pixel at the main plate's depth: project its centre and a point one world unit to its side
    painting.updateWorldMatrix(true, false);
    this.a.setFromMatrixPosition(painting.matrixWorld);
    this.b.copy(this.a).x += 1;
    this.a.project(camera);
    this.b.project(camera);
    const ndcPerUnit = Math.abs(this.b.x - this.a.x);
    if (!(ndcPerUnit > 1e-6)) return;
    const px = driftPx(this.t, amp, 24, this.gate) * scale;
    const want = (px * 2) / Math.max(1, W) / ndcPerUnit;
    this.shift(want - this.applied);
    this.stats.px = Math.round(px * 100) / 100;
    this.stats.gate = Math.round(this.gate * 100) / 100;
    this.stats.meshes = this.meshes.length;
  }

  /** Put every plate back where it was. */
  release(): void {
    if (this.meshes.length) this.shift(-this.applied);
    this.applied = 0;
    this.meshes = [];
    this.scene = null;
    this.gate = 0;
  }
}
