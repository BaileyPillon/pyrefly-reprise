import type { AnyCombatant, ElementId } from '../../battle/common/types.ts';
import { ELEMENT_IDS } from '../../battle/common/types.ts';

const ELEMENT_LABEL: Record<ElementId, string> = {
  fire: 'FIRE',
  ice: 'ICE',
  lightning: 'THUNDER',
  water: 'WATER',
  holy: 'HOLY',
  gravity: 'GRAV',
  none: '\u2014',
};

const SENSOR_ELEMENTS: ElementId[] = ELEMENT_IDS.filter((e) => e !== 'none');

/**
 * The Sensor readout. Not part of Ink & Gold's mocked component set (no
 * scan/sensor panel was mocked) -- composed locally from its ink/paper/gold
 * tokens as a small info card, reusing gold only for a genuine weakness
 * (the one piece of this readout worth drawing the eye to) and neutral
 * paper/ink tones for everything else, so it doesn't compete with the
 * accent's meaning elsewhere. Reads the combatant's own state directly (HP,
 * affinities, immunity flags) rather than depending on the `sensor` event's
 * free-text `text` field, so the six elemental chips are always faithful to
 * the data the engine actually computed.
 */
export class SensorPanel {
  readonly el: HTMLElement;

  constructor() {
    this.el = document.createElement('div');
    this.el.className = 'ffx-sensor';
    this.el.hidden = true;
    this.el.dataset['role'] = 'sensor-panel';
  }

  show(target: AnyCombatant): void {
    const sensorImmune = target.immunityFlags.includes('immune-to-sensor');
    const maxHp = target.stats.maxHp || 1;
    const hpFrac = sensorImmune ? 0 : Math.max(0, Math.min(1, target.hp / maxHp));
    const hpText = sensorImmune ? '- - -' : `${target.hp} / ${maxHp}`;
    const chips = sensorImmune
      ? ''
      : SENSOR_ELEMENTS.map((el) => {
          const affinity = target.affinities[el] ?? 'normal';
          const label =
            affinity === 'weak'
              ? 'WEAK'
              : affinity === 'resist'
                ? 'RES'
                : affinity === 'immune'
                  ? 'NULL'
                  : affinity === 'absorb'
                    ? 'ABS'
                    : '';
          const cls = affinity === 'normal' ? '' : `ffx-sensor__chip--${affinityClass(affinity)}`;
          return `<span class="ffx-sensor__chip ${cls}">${ELEMENT_LABEL[el]} ${label}</span>`;
        }).join('');

    this.el.innerHTML = `
      <div class="ffx-sensor__name">${escapeHtml(target.name)}</div>
      <div class="ffx-sensor__hp">HP&nbsp;&nbsp;${hpText}</div>
      <div class="ffx-sensor__bar"><i style="width:${(hpFrac * 100).toFixed(1)}%"></i></div>
      ${sensorImmune ? '<div class="ffx-sensor__failed">SENSOR FAILED</div>' : `<div class="ffx-sensor__chips">${chips}</div>`}
    `;
    this.el.hidden = false;
  }

  hide(): void {
    this.el.hidden = true;
  }
}

function affinityClass(a: string): string {
  if (a === 'weak') return 'weak';
  if (a === 'resist') return 'res';
  if (a === 'immune') return 'null';
  if (a === 'absorb') return 'abs';
  return '';
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}
