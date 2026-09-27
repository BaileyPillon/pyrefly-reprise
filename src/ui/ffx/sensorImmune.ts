/**
 * D-221 (supersedes D-196's FFX side): a Sensor-immune target's plate.
 *
 * Retail FFX prints "Immune to sensors." beside the enemy's name in the top
 * HELP bar while a Sensor-immune enemy is targeted
 * (`research/observed-ffx-steam-2026-09-26.md` §2.3, Spherimorph, Steam HD
 * Remaster). So the plate opens on such a target with its name and that line,
 * and nothing Sensor would have read: no HP figure, no bar, no element chips.
 *
 * GAME-AWARE (AGENTS.md rule 14): **FFX only.** `immunityFlags` and the Sensor
 * panel are FFX's; FFX-2's Trema immunity is not sourced by that session and is
 * untouched.
 */
import type { AnyCombatant } from '../../battle/common/types.ts';

/** The retail line, word for word. */
export const IMMUNE_TO_SENSORS = 'Immune to sensors.';

export function isSensorImmune(target: AnyCombatant): boolean {
  return (target.immunityFlags ?? []).includes('immune-to-sensor');
}

/** The plate body for a Sensor-immune target: the name, then the canon line. */
export function sensorImmuneBodyHtml(name: string): string {
  const safe = name.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
  return `
      <div class="ffx-sensor__name">${safe}</div>
      <div class="ffx-sensor__immune">${IMMUNE_TO_SENSORS}</div>
    `;
}
