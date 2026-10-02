/**
 * CAMERA LAB: MENU AT THE HERO. The command list keeps its Ink & Gold look and moves beside the
 * acting figure's projected torso, on the boss's side of it, re-anchored only when a cut lands.
 * It falls back to today's panel when it would cover the boss or another party member, when the
 * hero is off the frame, on a phone, or with the switch off.
 *
 * Only the list's anchor changes (inline `left`/`top` on the HUD's own command area, in its
 * 640x360 stage units); clearing them gives the panel back exactly. FFX: `.ffx-cmd-area`
 * (bottom-left by default). FFX-2: `.ffx2hud__command` (right-anchored by default).
 */

import type { LabGame } from '../../engine/lab/LabTypes.ts';

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface MenuAtHeroPorts {
  /** The figure's painted silhouette on screen, CSS pixels. */
  rect(id: string): Rect | null;
  /** Ids that the menu may not cover: the enemies and the other party members. */
  avoid(actorId: string): string[];
  /** The enemies (the boss side). */
  enemies(): string[];
}

const STAGE_W = 640;

function overlap(a: Rect, b: Rect): number {
  const w = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
  const h = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
  return w > 0 && h > 0 ? w * h : 0;
}

export class MenuAtHero {
  /** Where the list stands now: `hero` (moved) or `panel` (today's). */
  state: 'hero' | 'panel' = 'panel';
  reason = 'not anchored yet';

  constructor(
    private readonly root: HTMLElement,
    private readonly game: LabGame,
    private readonly ports: MenuAtHeroPorts,
  ) {}

  private menuEl(): HTMLElement | null {
    return this.root.querySelector<HTMLElement>(this.game === 'ffx' ? '.ffx-cmd-area' : '.ffx2hud__command');
  }

  private stageEl(): HTMLElement | null {
    return this.root.querySelector<HTMLElement>(this.game === 'ffx' ? '.ffxhud__stage' : '.ffx2hud__stage');
  }

  /** Today's panel: drop the inline anchor. */
  panel(reason: string): void {
    const el = this.menuEl();
    if (el) {
      for (const p of ['left', 'top', 'right', 'bottom'] as const) el.style.removeProperty(p);
      el.classList.remove('lab-menu-at-hero');
    }
    this.state = 'panel';
    this.reason = reason;
  }

  /** Anchor beside `actorId` (call on the frame after a cut lands), or fall back to the panel. */
  anchor(actorId: string | null, enabled: boolean): void {
    if (!enabled) return this.panel('switch off');
    if (document.documentElement.dataset['phoneBattle']) return this.panel('phone');
    if (!actorId) return this.panel('no actor');
    const el = this.menuEl();
    const stage = this.stageEl();
    const whole = this.ports.rect(actorId);
    if (!el || !stage || !whole) return this.panel('no menu or hero');
    const host = stage.getBoundingClientRect();
    const scale = host.width / STAGE_W;
    if (!(scale > 0)) return this.panel('stage not laid out');
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    if (whole.x + whole.w < 0 || whole.x > vw || whole.y > vh) return this.panel('hero off the frame');
    // The part of the hero on screen (a towering aeon runs off the top of the frame).
    const top0 = Math.max(0, whole.y);
    const hero: Rect = { x: whole.x, y: top0, w: whole.w, h: Math.min(vh, whole.y + whole.h) - top0 };

    // The boss side: toward the enemies' mean x on screen.
    const foes = this.ports.enemies().map((id) => this.ports.rect(id)).filter((r): r is Rect => !!r);
    const heroCx = hero.x + hero.w / 2;
    const foeCx = foes.length ? foes.reduce((s, r) => s + r.x + r.w / 2, 0) / foes.length : vw;
    const right = foeCx >= heroCx;

    // Measure the list where it is, then place it beside the torso, its top at the chest, or lower
    // (the waist, the hip) when a floating fiend or a head would be under it at the chest.
    this.panel('measuring');
    const box = el.getBoundingClientRect();
    const w = box.width || 130 * scale;
    const h = box.height || 160 * scale;
    const gap = 14 * scale;
    const torsoX = right ? hero.x + hero.w * 0.78 + gap : hero.x + hero.w * 0.22 - gap - w;
    const left = Math.min(vw - w - 8, Math.max(8, torsoX));
    let want: Rect | null = null;
    let blocker = '';
    for (const at of [0.28, 0.45, 0.6]) {
      const top = Math.min(vh - h - 8, Math.max(8, hero.y + hero.h * at));
      const spot: Rect = { x: left, y: top, w, h };
      // Never over the boss or another party member: no more than a quarter of a figure, and never
      // much of its head (the top fifth of its silhouette). An edge brushing past is tolerated.
      const hit = this.ports.avoid(actorId).find((id) => {
        const r = this.ports.rect(id);
        if (!r || r.w <= 0 || r.h <= 0) return false;
        const head: Rect = { x: r.x, y: r.y, w: r.w, h: r.h * 0.2 };
        return overlap(spot, r) > r.w * r.h * 0.25 || overlap(spot, head) > head.w * head.h * 0.2;
      });
      if (!hit) {
        want = spot;
        break;
      }
      blocker ||= hit;
    }
    if (!want) return this.panel(`would cover ${blocker}`);
    const { x: placeX, y: top } = want;

    el.classList.add('lab-menu-at-hero');
    el.style.left = `${(placeX - host.left) / scale}px`;
    el.style.top = `${(top - host.top) / scale}px`;
    el.style.right = 'auto';
    el.style.bottom = 'auto';
    this.state = 'hero';
    this.reason = right ? 'beside the hero, boss side right' : 'beside the hero, boss side left';
  }

  dispose(): void {
    this.panel('disposed');
  }
}
