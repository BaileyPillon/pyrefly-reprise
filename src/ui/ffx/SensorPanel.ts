import type { AnyCombatant, CombatantId, ElementId } from '../../battle/common/types.ts';
import { ELEMENT_IDS } from '../../battle/common/types.ts';

const ELEMENT_LABEL: Record<ElementId, string> = {
  fire: 'FIRE',
  ice: 'ICE',
  lightning: 'THUNDER',
  water: 'WATER',
  holy: 'HOLY',
  gravity: 'GRAV',
  none: '—',
};

/**
 * One small coloured glyph per element, drawn as a CSS diamond rather than
 * an emoji/icon-font glyph (no icon asset for these exists, and an emoji's
 * own fixed colour couldn't carry the WEAK/RES/NULL/ABS state tint below).
 * Hexes are `research/visual-bible.md` §3.3's magic-list chip colours (the
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
 * Per-state colour, `research/visual-bible.md` §3.5's Sensor spec ("WEAK
 * `#F2C21E`, RES `#6C7B90`, NULL `#4E86C8`, ABS `#7EE8B0`, or blank for
 * neutral"). Ink & Gold's "one accent" rule would rather only WEAK stood
 * out, but distinguishing all four is the whole point of this panel
 * (playability-round-1.md #10) — a neutral chip already stays unlabelled
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
 * How long the open plate stays open before it folds itself away, in ms.
 *
 * Long enough to read six element chips and a four-digit HP pair without
 * hurrying, short enough that it is gone by the time the next character is
 * deciding. A plate the *player* opened is exempt — see {@link pinned}.
 */
export const SENSOR_OPEN_MS = 7000;

/** The key that reopens a folded plate. Unclaimed by `Input.ts` and `rawInput.ts`. */
const TOGGLE_KEY = 'KeyI';

/** What the chip prints for that key. */
const TOGGLE_KEY_LABEL = 'I';

/**
 * The enemy plate: **who you are aiming at, and everything Sensor has told you
 * about them.**
 *
 * ## One enemy read-out, not three
 *
 * Round 02 #28: "enemy health is presented three different ways and the boss's
 * HP is invisible in two of three chapters". In FFX there is exactly one right
 * answer and the game already had it — **Sensor**. An unscanned enemy has no HP
 * bar in FFX and must not grow one here; a scanned one shows its numbers in the
 * target window and keeps them. So this panel is the single place FFX prints
 * enemy health, and what it prints is a function of one thing: has this
 * combatant been Sensed in this battle ({@link scanned}).
 *
 * The plate therefore follows the **target** as well as the `sensor` event. Aim
 * at Seymour and the plate says "Seymour Flux — HP hidden · Sensor reads it";
 * aim at the Mortiorchis after Rikku has Sensed it and the plate says
 * 4000 / 4000 with its six element chips. Same panel, same place, every
 * chapter — and the boss's HP is visible exactly when canon allows it.
 *
 * ## It has a lifetime now
 *
 * Before this round `hide()` had **no caller**: one Sensor in Chapter 1 left the
 * card on the field for the rest of the fight, which is why the advisor's shelf
 * was 24 grid px tall on five of seven decisions and the screen read as crowded
 * (`critic/rounds/round-02.md` and `docs/handoff/fix3-advisor.md` §1). It now
 * opens on a reveal or a target change, folds itself to a one-line chip after
 * {@link SENSOR_OPEN_MS}, and reopens on a click or `I` — and a plate the player
 * opened by hand never folds itself under them.
 */
export class SensorPanel {
  readonly el: HTMLElement;
  private readonly bodyEl: HTMLElement;
  private readonly chipEl: HTMLButtonElement;

  /** Combatants a `sensor` event has revealed in this battle. */
  private readonly scanned = new Set<CombatantId>();
  private current: AnyCombatant | null = null;
  private folded = false;
  /** Countdown to the auto-fold, in ms. Zero means "not counting". */
  private openMs = 0;
  /** The player opened this one: it stays until they close it or a new one arrives. */
  private pinned = false;
  private mounted = false;

  constructor() {
    this.el = document.createElement('div');
    this.el.className = 'ffx-sensor';
    this.el.hidden = true;
    this.el.dataset['role'] = 'sensor-panel';

    this.bodyEl = document.createElement('div');
    this.bodyEl.className = 'ffx-sensor__body';

    this.chipEl = document.createElement('button');
    this.chipEl.type = 'button';
    this.chipEl.className = 'ffx-sensor__toggle';
    this.chipEl.dataset['role'] = 'sensor-toggle';
    this.chipEl.addEventListener('click', (e) => {
      e.preventDefault();
      this.toggle();
    });

    this.el.append(this.bodyEl, this.chipEl);
    this.applyFolded();
  }

  /** Start listening for `I`. Paired with {@link unmount} by the HUD's own lifetime. */
  mount(): void {
    if (this.mounted) return;
    this.mounted = true;
    window.addEventListener('keydown', this.onKeyDown);
  }

  unmount(): void {
    if (!this.mounted) return;
    this.mounted = false;
    window.removeEventListener('keydown', this.onKeyDown);
    this.hide();
  }

  private readonly onKeyDown = (e: KeyboardEvent): void => {
    if (e.code !== TOGGLE_KEY || e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
    if (this.el.hidden) return;
    e.preventDefault();
    this.toggle();
  };

  // ------------------------------------------------------------------ state

  /** Has Sensor read this combatant in this battle? */
  isScanned(id: CombatantId): boolean {
    return this.scanned.has(id);
  }

  /** Folded to its one-line chip, rather than open. */
  get isFolded(): boolean {
    return this.folded;
  }

  /**
   * A `sensor` event landed: this combatant's HP and affinities are known from
   * here to the end of the battle, and the plate opens on it.
   */
  show(target: AnyCombatant): void {
    this.scanned.add(target.id);
    this.open(target, false);
  }

  /**
   * The player is aiming at this combatant (or it is the one acting). Opens the
   * plate on it with whatever is known — which for an unscanned enemy is its
   * name and the fact that Sensor would read the rest.
   */
  focus(target: AnyCombatant): void {
    if (this.current?.id === target.id && !this.el.hidden) {
      // Same subject, refreshed numbers (it just took a hit): redraw without
      // restarting the lifetime, so an HP tick cannot keep the plate up for ever.
      this.current = target;
      this.render();
      return;
    }
    this.open(target, false);
  }

  private open(target: AnyCombatant, byHand: boolean): void {
    this.current = target;
    this.folded = false;
    this.pinned = byHand;
    this.openMs = byHand ? 0 : SENSOR_OPEN_MS;
    this.el.hidden = false;
    this.render();
    this.applyFolded();
  }

  /** The chip, or `I`. */
  toggle(): void {
    if (!this.current) return;
    if (this.folded) {
      this.open(this.current, true);
      return;
    }
    this.folded = true;
    this.pinned = false;
    this.openMs = 0;
    this.applyFolded();
  }

  /**
   * Per-frame tick from the HUD. Counts the open plate down to its folded chip.
   *
   * `dt` is seconds, as everywhere else in the HUD.
   */
  update(dt: number): void {
    if (this.openMs <= 0 || this.folded || this.pinned) return;
    this.openMs -= Math.max(0, dt) * 1000;
    if (this.openMs > 0) return;
    this.openMs = 0;
    this.folded = true;
    this.applyFolded();
  }

  /** Off the field entirely: the battle is over, or the HUD is going away. */
  hide(): void {
    this.el.hidden = true;
    this.current = null;
    this.folded = false;
    this.pinned = false;
    this.openMs = 0;
  }

  /**
   * The plate's subject has left the field — KO'd, shattered, ejected,
   * dismissed, removed or hidden — so its plate and its folded `I` chip go
   * with it. Chapter VII e2e (commit 06338dbc): "I GUADO GUARDIAN B" stayed on
   * the field after both Guardians had shattered, all through Anima's act.
   * Read off the synced state rather than off one event kind, so every way a
   * combatant can leave (a `ko`, `status-add eject`, a scripted removal, a
   * body that stays down) clears it the same way. What Sensor read stays
   * known ({@link isScanned}); only the plate goes. FFX only: the plate is.
   */
  release(combatants: Readonly<Record<CombatantId, AnyCombatant | undefined>>): void {
    const id = this.current?.id;
    if (!id) return;
    const c = combatants[id];
    if (c && c.alive && !c.removed && !c.flags.hidden) return;
    this.hide();
  }

  /** Everything Sensor knew is forgotten — a new battle starts blind. */
  reset(): void {
    this.scanned.clear();
    this.hide();
  }

  // -------------------------------------------------------------- rendering

  private applyFolded(): void {
    this.el.classList.toggle('ffx-sensor--folded', this.folded);
    const name = this.current?.name ?? '';
    this.chipEl.innerHTML = this.folded
      ? `<b>${TOGGLE_KEY_LABEL}</b><span>${escapeHtml(name)}</span>`
      : `<b>${TOGGLE_KEY_LABEL}</b><span>hide</span>`;
    this.chipEl.setAttribute('aria-pressed', String(!this.folded));
    this.chipEl.title = this.folded ? `Show what is known about ${name}` : 'Hide the enemy read-out';
  }

  private render(): void {
    const target = this.current;
    if (!target) return;
    const known = this.scanned.has(target.id);
    const sensorImmune = target.immunityFlags.includes('immune-to-sensor');
    const maxHp = target.stats.maxHp || 1;
    const hpFrac = known && !sensorImmune ? Math.max(0, Math.min(1, target.hp / maxHp)) : 0;
    const hpText = sensorImmune ? '- - -' : known ? `${target.hp} / ${maxHp}` : '? ? ?';
    const chips =
      !known || sensorImmune
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

    // An unscanned enemy has no HP bar in FFX and does not grow one here: the
    // bar renders at zero width under a "? ? ?" readout and the panel says, in
    // one line, which command would fill it in.
    const tail = sensorImmune
      ? '<div class="ffx-sensor__failed">SENSOR FAILED</div>'
      : known
        ? `<div class="ffx-sensor__chips">${chips}</div>`
        : '<div class="ffx-sensor__unknown">Sensor reads HP and weaknesses</div>';

    this.bodyEl.innerHTML = `
      <div class="ffx-sensor__name">${escapeHtml(target.name)}</div>
      <div class="ffx-sensor__hp">HP&nbsp;&nbsp;${hpText}</div>
      <div class="ffx-sensor__bar"><i style="width:${(hpFrac * 100).toFixed(1)}%"></i></div>
      ${tail}
    `;
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
