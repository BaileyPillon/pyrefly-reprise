import type { BattleEvent, CombatantId } from '../../battle/common/types.ts';

export type Projector = (id: CombatantId) => { x: number; y: number } | null;
export type SideResolver = (id: CombatantId) => 'party' | 'enemy' | 'aeon' | null;

const LIFETIME_MS = 1000;
const SPLASH_PATH =
  'M18 96 L58 34 L142 54 L206 8 L266 62 L352 42 L326 112 L364 166 L252 146 L182 182 L118 136 L36 158 Z';

/**
 * Damage numerals, restyled onto Ink & Gold's `.ig-damage` (`slabs.css`,
 * spec "Components" > "Damage numeral"): a 128px Cormorant italic numeral on
 * a gold ink-splash polygon. Spawned in an unscaled screen-space layer at
 * the position `setProjector`'s callback returns, since that position
 * already accounts for the 3D camera and is not expressed in the HUD's
 * 640x360 authoring grid.
 *
 * Only the primary case (damage/heal) gets the full splash treatment — the
 * spec quotes geometry for that case alone ("the most-seen UI element"); a
 * miss, an MP tick or an IMMUNE result render as a small plain chip instead
 * of competing splashes for events nobody needs to read from across the room.
 */
export class DamageNumbers {
  readonly el: HTMLElement;
  private projector: Projector | null = null;
  private sideOf: SideResolver | null = null;

  constructor() {
    this.el = document.createElement('div');
    this.el.className = 'ffx-numerals-layer';
    this.el.dataset['role'] = 'damage-numbers';
  }

  setProjector(project: Projector): void {
    this.projector = project;
  }

  /** Lets a `damage` event invert the splash (ivory numeral on ink) when the target is the party. */
  setSideResolver(sideOf: SideResolver): void {
    this.sideOf = sideOf;
  }

  /** Spawns a numeral for a damage/heal/miss/mp event; no-ops for every other event type. */
  spawn(event: BattleEvent): void {
    switch (event.type) {
      case 'damage':
        this.spawnDamage(event);
        return;
      case 'heal':
        this.spawnSplash(event.targetId, `+${event.amount}`, event.targetId);
        return;
      case 'mp-damage':
        this.spawnChip(event.targetId, `-${event.amount} MP`, 'ffx-numeral-chip--mp');
        return;
      case 'mp-heal':
        this.spawnChip(event.targetId, `+${event.amount} MP`, 'ffx-numeral-chip--mp');
        return;
      case 'miss':
        this.spawnChip(event.targetId, event.reason === 'evaded' ? 'MISS' : event.reason.toUpperCase(), 'ffx-numeral-chip--miss');
        return;
      default:
        return;
    }
  }

  private spawnDamage(event: Extract<BattleEvent, { type: 'damage' }>): void {
    if (event.affinity === 'immune') {
      this.spawnChip(event.targetId, 'IMMUNE', 'ffx-numeral-chip--miss');
      return;
    }
    const amount = Math.abs(event.amount);
    const text = event.amount < 0 ? `+${amount}` : `${amount}`;
    this.spawnSplash(event.targetId, text, event.targetId, event.hitIndex);
  }

  private spawnSplash(targetId: CombatantId, text: string, sideId: CombatantId, hitIndex = 0): void {
    const pos = this.projector?.(targetId);
    if (!pos) return;
    const inverted = this.sideOf?.(sideId) === 'party';
    const jitter = Math.round((Math.random() - 0.5) * 20);

    const el = document.createElement('div');
    el.className = `ig-damage${inverted ? ' ig-damage--enemy' : ''} ffx-damage--spawn`;
    el.style.left = `${pos.x + jitter + hitIndex * 6}px`;
    el.style.top = `${pos.y - 12 - hitIndex * 5}px`;
    el.innerHTML = `
      <svg class="ig-damage__splash" viewBox="0 0 380 190"><path d="${SPLASH_PATH}"/></svg>
      <span class="ig-damage__value">${text}</span>
    `;
    this.el.appendChild(el);
    requestAnimationFrame(() => el.classList.add('ffx-damage--settle'));
    window.setTimeout(() => el.remove(), LIFETIME_MS);
  }

  private spawnChip(targetId: CombatantId, text: string, extraClass: string): void {
    const pos = this.projector?.(targetId);
    if (!pos) return;
    const el = document.createElement('div');
    el.className = `ffx-numeral-chip ${extraClass} ffx-damage--spawn`;
    el.textContent = text;
    el.style.left = `${pos.x}px`;
    el.style.top = `${pos.y - 10}px`;
    this.el.appendChild(el);
    requestAnimationFrame(() => el.classList.add('ffx-damage--settle'));
    window.setTimeout(() => el.remove(), LIFETIME_MS);
  }
}
