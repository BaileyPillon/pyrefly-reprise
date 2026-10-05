import { Vector3, type PerspectiveCamera } from 'three';
import type { Actor } from './geometry.ts';

/**
 * FFX-2: today's spherechange flourish (`ui/ffx2/SpherechangeFlourish.ts`: the light column, the motes, the
 * ring and the name plate) is anchored once, where the girl stands as the light starts; the close shot cuts in a
 * moment later, so the light and the plate would play over whoever stands there in the shot. While one is up it
 * follows its girl through the camera on screen (in the master that is where it already is). Its own anchors:
 * the head point and the feet, in viewport CSS px (`PaintedStage.project`).
 */
export function followFlourish(actors: readonly Actor[], cam: PerspectiveCamera, canvas: HTMLElement | null): void {
  if (!canvas || typeof document === 'undefined') return;
  const els = document.querySelectorAll<HTMLElement>('.ffx2sf[data-who]');
  if (!els.length) return;
  const r = canvas.getBoundingClientRect();
  if (!r.width || !r.height) return;
  cam.updateMatrixWorld();
  const px = (v: Vector3): { x: number; y: number } => {
    v.project(cam);
    return { x: r.left + (v.x * 0.5 + 0.5) * r.width, y: r.top + (-v.y * 0.5 + 0.5) * r.height };
  };
  for (const el of els) {
    const a = actors.find((x) => x.name === el.dataset['who']) as (Actor & { headPoint?: (out: Vector3) => unknown }) | undefined;
    if (!a?.headPoint) continue;
    const hv = new Vector3();
    a.headPoint(hv);
    const head = px(hv);
    const feet = px(a.position.clone());
    const scale = parseFloat(el.style.getPropertyValue('--sf-scale')) || 1;
    el.style.setProperty('--sf-x', `${head.x}px`);
    el.style.setProperty('--sf-head', `${head.y}px`);
    el.style.setProperty('--sf-feet', `${feet.y}px`);
    el.style.setProperty('--sf-body', `${Math.max(Math.abs(feet.y - head.y), 24 * scale)}px`);
  }
}

