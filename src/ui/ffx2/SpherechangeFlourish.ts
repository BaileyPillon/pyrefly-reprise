/**
 * The spherechange transformation — FFX-2's signature moment, and until now
 * the one the game skipped.
 *
 * A spherechange costs the girl her **whole turn** (`ffx2-combat-core.md` §4.2).
 * The engine has always emitted a `spherechange` battle event for it, and
 * `FFX2BattleHud.onEvent` fell through to `default:` and drew nothing — so the
 * most expensive action in X-2 read as a monogram quietly changing letters in
 * a 40 px party row, with no pause and no acknowledgement. The price was paid
 * and nothing happened.
 *
 * This is `research/visual-bible.md` §4.5.4's **Commit VFX**, built to the
 * approved spec rather than invented:
 *
 * > the transformation plays on the field — a vertical `#FFFFFF` light column
 * > over the girl for 12 frames while 8 `#F7B6D9` petal-motes orbit outward,
 * > the new outfit resolving on frame 9, and a `#FFD9EC` ring expanding from
 * > her feet to radius 90 px and fading
 *
 * plus §4.5.4's **Gate-arrival VFX** ("the earned effect's name rises 14 px
 * above her in 10 px in the gate colour") and §3's budget for the whole thing
 * ("Budget ~0.8 s"). The mechanic itself "halts time" (§3), which is why the
 * HUD awaits this before letting playback continue.
 *
 * **FFX-2 only.** FFX has no spherechange and no `spherechange` event; its HUD
 * is a different component and gets none of this. Yuna's FFX summons have
 * their own approved moment and it is not this one.
 *
 * Positioned on the HUD's *unscaled* overlay in viewport pixels, exactly like
 * the damage numerals and the chain counter: every size below is quoted in the
 * 640x360 design grid and multiplied by the letterbox scale, so the column is
 * the same size relative to the girl at 1280x720 and at 2560x1440.
 */
import './spherechange-flourish.css';
import type { CombatantId, GateColour } from '../../battle/common/types.ts';
import { dressphereColour, dressphereLabel } from './dressphereIcons.ts';

/** §4.5.2's four-colour gate set, verbatim — the same table `SpherechangeWheel` draws its orbs from. */
const GATE_HEX: Record<GateColour, string> = {
  red: '#D0343C',
  green: '#4FB05E',
  blue: '#3A78BE',
  yellow: '#E3B94A',
};

/** §4.5.4: "8 `#F7B6D9` petal-motes orbit outward". */
const MOTE_COUNT = 8;

/**
 * §4.5.4's ring radius, in the 640x360 design grid. The spec's "90 px" is
 * quoted in the visual bible's own 424x312 X-2 overlay frame (§4.1), which is
 * the same grid every other number in this file comes from, so it is used as
 * written and scaled with the letterbox like everything else.
 */
const RING_RADIUS = 90;

/** §3: "Budget ~0.8 s". The column, the motes and the ring all finish inside it. */
export const FLOURISH_MS = 800;

/** How long the name plate stays after the light has gone, so the player can read what she became. */
const NAME_HOLD_MS = 1150;

/** A girl's projected extent, from the stage's own projector. */
export interface FlourishAnchor {
  head: { x: number; y: number };
  feet: { x: number; y: number };
}

export interface SpherechangeFlourishDeps {
  /** The HUD's unscaled overlay, in viewport pixels. */
  overlay: HTMLElement;
  /** Current letterbox scale (`FFX2BattleHud.layout`). */
  scale: () => number;
  /** Where the girl is, or `null` when nothing is projected (headless, or she is off-field). */
  anchor: (id: CombatantId) => FlourishAnchor | null;
}

export interface SpherechangeMoment {
  who: CombatantId;
  /** Her name, for the plate. */
  name: string;
  /** Dressphere id she is becoming. */
  to: string;
  /** Gates crossed on the link, in order. Their effects last the rest of the battle. */
  gatesCrossed: readonly GateColour[];
  /** Set when this was an R1 Special Dress Up. */
  special?: string | undefined;
}

/** `Yuna became Black Mage` / `Red + Green` — the plate's two lines. */
function gateLine(gates: readonly GateColour[]): string {
  return gates.map((g) => g.charAt(0).toUpperCase() + g.slice(1)).join(' + ');
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

/**
 * Plays one transformation and resolves when the light has finished.
 *
 * The caller awaits this so playback holds — §3's "halts time, grants immunity
 * to enemy attacks during the change". The name plate outlives the promise by
 * design: the light is the moment, the label is the receipt, and holding the
 * whole battle for the receipt would make every change feel slow.
 *
 * With no projected anchor (a headless run, or a girl who is not on the field)
 * nothing is drawn and the promise resolves immediately — a spherechange must
 * never be able to wedge the battle loop on a missing projector.
 */
export function playSpherechangeFlourish(
  deps: SpherechangeFlourishDeps,
  moment: SpherechangeMoment,
): Promise<void> {
  const anchor = deps.anchor(moment.who);
  if (!anchor) return Promise.resolve();

  const scale = deps.scale() || 1;
  const { head, feet } = anchor;
  const bodyH = Math.max(Math.abs(feet.y - head.y), 24 * scale);
  const colour = dressphereColour(moment.to);
  const gates = moment.gatesCrossed;
  const gateColour = gates.length > 0 ? (GATE_HEX[gates[gates.length - 1]!] ?? colour) : colour;

  const el = document.createElement('div');
  el.className = 'ffx2sf';
  el.dataset['who'] = moment.who;
  el.dataset['to'] = moment.to;
  // The column is centred on her, tall enough to swallow her whole silhouette
  // and a little sky above it, and the ring sits on the ground at her feet.
  el.style.setProperty('--sf-x', `${head.x}px`);
  el.style.setProperty('--sf-head', `${head.y}px`);
  el.style.setProperty('--sf-feet', `${feet.y}px`);
  el.style.setProperty('--sf-body', `${bodyH}px`);
  el.style.setProperty('--sf-scale', String(scale));
  el.style.setProperty('--sf-job', colour);
  el.style.setProperty('--sf-gate', gateColour);
  el.style.setProperty('--sf-ring', `${RING_RADIUS * scale}px`);
  el.style.setProperty('--sf-ms', `${FLOURISH_MS}ms`);

  const motes = Array.from({ length: MOTE_COUNT }, (_, i) => {
    const angle = (i * 360) / MOTE_COUNT;
    return `<i class="ffx2sf__mote" style="--sf-a:${angle}deg;--sf-d:${(i % 3) * 40}ms"></i>`;
  }).join('');

  // §4.5.4's gate-arrival line, and only when a gate was actually crossed —
  // the whole point of the line is that it names an effect that now lasts the
  // rest of the battle.
  const gateHtml =
    gates.length > 0
      ? `<span class="ffx2sf__gate">GATE &middot; ${escapeHtml(gateLine(gates))}</span>`
      : '';
  const special = moment.special
    ? `<span class="ffx2sf__special">SPECIAL DRESS UP</span>`
    : '';

  el.innerHTML = `
    <div class="ffx2sf__column"></div>
    <div class="ffx2sf__motes">${motes}</div>
    <div class="ffx2sf__ring"></div>
    <div class="ffx2sf__plate">
      ${special}
      <span class="ffx2sf__who">${escapeHtml(moment.name)}</span>
      <span class="ffx2sf__name">${escapeHtml(dressphereLabel(moment.to))}</span>
      ${gateHtml}
    </div>`;

  deps.overlay.appendChild(el);

  return new Promise<void>((resolve) => {
    window.setTimeout(() => {
      // The light is done; hand the battle back and let the plate fade on its own.
      el.classList.add('ffx2sf--settled');
      resolve();
      window.setTimeout(() => el.remove(), NAME_HOLD_MS);
    }, FLOURISH_MS);
  });
}
