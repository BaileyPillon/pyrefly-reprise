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

/**
 * One small coloured glyph per element, drawn as a CSS diamond rather than
 * an emoji/icon-font glyph (no icon asset for these exists, and an emoji's
 * own fixed colour couldn't carry the WEAK/RES/NULL/ABS state tint below).
 * Hexes are `research/visual-bible.md` \u00a73.3's magic-list chip colours (the
 * one place FFX element colour is specified); Gravity isn't a castable
 * spell there, so its colour is `[estimate]`, kept a cool neutral so it
 * doesn't fight the five verified ones.
 */
const ELEMENT_COLOR: Record<Exclude<ElementId, 'none'>, string> = {
  fire: '#F2712E',
  ice: '#6EC8F0',
  lightning: '#F2D24A',
  water: '#3A8FD0',
  holy: '#FFF2C0',
  gravity: '#9C8FAE',
};

const SENSOR_ELEMENTS: Exclude<ElementId, 'none'>[] = ELEMENT_IDS.filter(
  (e): e is Exclude<ElementId, 'none'> => e !== 'none',
);

/**
 * Per-state colour, `research/visual-bible.md` \u00a73.5's Sensor spec ("WEAK
 * `#F2C21E`, RES `#6C7B90`, NULL `#4E86C8`, ABS `#7EE8B0`, or blank for
 * neutral"). Ink & Gold's "one accent" rule would rather only WEAK stood
 * out, but distinguishing all four is the whole point of this panel
 * (playability-round-1.md #10) \u2014 a neutral chip already stays unlabelled
 * and dim, so the accent-elsewhere rule still holds for the common case.
 */
const AFFINITY_COLOR: Record<'weak' | 'resist' | 'immune' | 'absorb', string> = {
  weak: '#F2C21E',
  resist: '#6C7B90',
  immune: '#4E86C8',
  absorb: '#7EE8B0',
};

/** `AFFINITY_COLOR` at 25% alpha, for the chip background ("colour-code the
 * cell background too ... so the weakness is findable without reading",
 * §4.11) — precomputed rather than parsed at render time since the four
 * inputs are fixed. */
const AFFINITY_BG: Record<'weak' | 'resist' | 'immune' | 'absorb', string> = {
  weak: 'rgba(242, 194, 30, 0.25)',
  resist: 'rgba(108, 123, 144, 0.25)',
  immune: 'rgba(78, 134, 200, 0.25)',
  absorb: 'rgba(126, 232, 176, 0.25)',
};

/**
 * The Sensor readout. Not part of Ink & Gold's mocked component set (no
 * scan/sensor panel was mocked) -- composed locally from its ink/paper/gold
 * tokens as a small info card. Reads the combatant's own state directly (HP,
 * affinities, immunity flags) rather than depending on the `sensor` event's
 * free-text `text` field, so the six elemental chips are always faithful to
 * the data the engine actually computed.
 *
 * Each chip carries an element glyph (`ELEMENT_COLOR`) plus, for a
 * non-neutral affinity, the visual bible's own WEAK/RES/NULL/ABS colour
 * (`AFFINITY_COLOR`/`AFFINITY_BG`, §3.5 + §4.11) rather than Ink & Gold's
 * "one accent" rule of gold-for-weak-and-neutral-otherwise this panel used
 * to follow — distinguishing all four states, not just weaknesses, is
 * exactly what playability-round-1.md #10 asked for.
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
          const style =
            affinity === 'normal'
              ? ''
              : ` style="background:${AFFINITY_BG[affinity]};color:${AFFINITY_COLOR[affinity]}"`;
          const icon = `<i class="ffx-sensor__chip-icon" style="background:${ELEMENT_COLOR[el]}"></i>`;
          const text = label ? `${ELEMENT_LABEL[el]} ${label}` : ELEMENT_LABEL[el];
          return `<span class="ffx-sensor__chip ${cls}"${style}>${icon}${text}</span>`;
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
