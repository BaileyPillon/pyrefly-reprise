import { SENSOR_HOME } from './colossusPin.ts';

/**
 * Where FFX's Sensor card stands while the table's colossus master does (`colossusPin.ts`, Seymour Natus, option N): the card is a read-out
 * that opens on a reveal and folds itself after seven seconds, pinned by the stylesheet in the lane the fiends stand in, so under a boss grown
 * to a colossus it covered a third of him (round 19, PR-0312). The table names the place it stands at instead, in the stage's own grid px.
 *
 * Written as two CSS custom properties the stylesheet adds to the card's own `left` and `top` (`ffx-hud.css`, beside `--ffx-sensor-dx`, the
 * steer while a target cursor is up, and `--ffx-sensor-cdx`, the clear of the turn rail): those two still apply on top, so the card still steps
 * off the fiend a cursor is on. Removed the moment the pin ends (a fight with no pin, the switch off, the phone). Presentation only (rule 1).
 * Game case: FFX only (the card is FFX's own; FFX-2 shows an enemy on the boss strip).
 */
export class SensorPin {
  private last = '';

  /** Every frame: the card's CSS left and top (grid px) while a pinned master stands, else null. */
  update(card: readonly [number, number] | null): void {
    if (typeof document === 'undefined') return;
    const el = document.querySelector<HTMLElement>('.ffx-sensor');
    if (!el) {
      this.last = '';
      return;
    }
    const px = card ? `${(card[0] - SENSOR_HOME[0]).toFixed(1)}px` : '';
    const py = card ? `${(card[1] - SENSOR_HOME[1]).toFixed(1)}px` : '';
    const key = px + py;
    if (key === this.last && (!card || el.style.getPropertyValue('--ffx-sensor-px') === px)) return;
    this.last = key;
    this.write(el, px, py);
  }

  private write(el: HTMLElement, px: string, py: string): void {
    if (px) {
      el.style.setProperty('--ffx-sensor-px', px);
      el.style.setProperty('--ffx-sensor-py', py);
      // A flag (1 while the pin stands) the stylesheet multiplies by: the pinned card is as wide as its three chip columns need at a small window
      // (`hud-floor.css`), so it keeps the two chip rows it has at 1600x900 and clears Natus's wing tips (PR-0406).
      el.style.setProperty('--ffx-sensor-pin', '1');
    } else {
      el.style.removeProperty('--ffx-sensor-px');
      el.style.removeProperty('--ffx-sensor-py');
      el.style.removeProperty('--ffx-sensor-pin');
    }
  }

  dispose(): void {
    if (typeof document === 'undefined') return;
    const el = document.querySelector<HTMLElement>('.ffx-sensor');
    if (el) this.write(el, '', '');
    this.last = '';
  }
}
