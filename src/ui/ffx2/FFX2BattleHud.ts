import '../inkgold/index.ts';
import './ffx2-hud.css';
import { installInkGoldStyles } from '../inkgold/index.ts';
import type { HudPort } from '../../engine/HudPort.ts';
import type {
  AtbSnapshot,
  AvailableCommand,
  BattleEvent,
  BattleState,
  Command,
  CombatantId,
  AnyCombatant,
  FFX2Combatant,
  MinigameKind,
  MinigameResult,
  TurnPreview,
} from '../../battle/common/types.ts';
import { openCommandMenu } from './CommandMenu.ts';
import { mountTriggerHappy } from './TriggerHappy.ts';
import { mountLadyLuckReels } from './LadyLuckReels.ts';

/**
 * The FFX-2 battle HUD.
 *
 * Composes the shared Ink & Gold layer (`src/ui/inkgold/`) in its pink
 * `.ig--ffx2` variant, matching `docs/handoff/ink-and-gold/BattleFfx2.dc.html`
 * (the approved round-2 mock, `docs/screenshots/mockups/A-ffx2-battle.jpg`):
 * `.ig-stat-list`/`.ig-stat` for the party (left-anchored, cascading), the
 * dressphere monogram as `.ig-stat__sphere`, `.ig-bosshp` for enemy HP,
 * `.ig-banner` (right-anchored) for the telegraph, `.ig-cmd-stack` (via
 * `CommandMenu.ts`) for commands, `.ig-reticle` for targeting, and
 * `.ig-damage`/`.ig-damage__chain` for the chain pop (the mock's "742" +
 * "CHAIN ×4" pairing, adapted here to headline the chain *count* — this HUD
 * has no damage-numeral pipeline of its own, only the `chain` event).
 *
 * `required`-proportional ATB track width (visual-bible §4.3 / CONTRACTS.md)
 * survives the restyle: `.ig-stat__od`'s width is overridden per row, the
 * one thing the shared layer explicitly leaves to the HUD owner.
 */

/** `AtbState.ticks`'s own reference: one drawn bar at default speed [types.ts §7]. */
const TICKS_PER_BAR = 24000;
/**
 * `visual-bible.md` §4.3: drawn track width is clamped to this range.
 * `BAR_MAX_PX` is `.ig-stat__od`'s own unoverridden width (53.33px, the
 * "slowest/full-runway" reference) so a `required` at or above `TICKS_PER_BAR`
 * renders identically to the shared layer's default; faster characters
 * shrink from there, revealing more of the row's own ink-panel background —
 * still legible as "shorter runway" without overflowing the 200px row.
 */
const BAR_MIN_PX = 24;
const BAR_MAX_PX = 53.33;
const CHAIN_HOLD_MS = 1400;
const TELEGRAPH_HOLD_MS = 2400;

function isAtbSnapshot(p: TurnPreview[] | AtbSnapshot): p is AtbSnapshot {
  return !Array.isArray(p);
}

function isFfx2(c: AnyCombatant | undefined): c is FFX2Combatant {
  return !!c && 'atb' in c;
}

function clamp(min: number, max: number, v: number): number {
  return Math.max(min, Math.min(max, v));
}

/** §4.9 correction: white >= 33% max, gold-critical < 33%, blood at 0. */
function hpClass(hp: number, maxHp: number): string {
  if (hp <= 0) return 'ffx2-hp--ko';
  return hp / Math.max(1, maxHp) < 0.33 ? 'ffx2-hp--crit' : '';
}

function barTrackWidth(required: number): number {
  if (!required) return BAR_MAX_PX;
  return clamp(BAR_MIN_PX, BAR_MAX_PX, BAR_MAX_PX * (required / TICKS_PER_BAR));
}

/** The FFX-2 battle HUD: ATB party rows, enemy gauges, command menu, chain/telegraph transients. */
export class FFX2BattleHud implements HudPort {
  private el!: HTMLElement;
  private stage!: HTMLElement;
  private overlay!: HTMLElement;
  private partyEl!: HTMLElement;
  private enemyEl!: HTMLElement;
  private telegraphEl!: HTMLElement;
  private commandEl!: HTMLElement;
  private minigameEl!: HTMLElement;
  private mounted = false;

  private project: (id: CombatantId) => { x: number; y: number } | null = () => null;
  private lastState: BattleState | null = null;
  private lastSnapshot: AtbSnapshot | null = null;
  /** The actor whose command menu is currently open, if any — drives `.ig-stat--acting`. */
  private actingId: CombatantId | null = null;
  private readonly chargeStages = new Map<CombatantId, { stage: 1 | 2; name: string }>();
  private chainHideTimer = 0;
  private telegraphHideTimer = 0;
  private readonly onResize = (): void => this.layout();

  // -------------------------------------------------------------- HudPort

  mount(root: HTMLElement): void {
    if (this.mounted) return;
    installInkGoldStyles();
    this.el = document.createElement('div');
    this.el.className = 'ig ig--ffx2 ffx2hud';
    this.el.dataset['role'] = 'ffx2-hud';

    this.stage = document.createElement('div');
    this.stage.className = 'ffx2hud__stage';
    this.stage.innerHTML = `
      <div class="ig-surface"><div class="ig-surface__grain"></div><div class="ig-surface__vignette"></div></div>
      <div class="ffx2hud__enemies"></div>
      <div class="ig-banner ffx2hud__telegraph" hidden></div>
      <div class="ig-stat-list ffx2hud__party"></div>
      <div class="ffx2hud__command" hidden></div>
      <div class="ffx2hud__minigame"></div>
    `;

    this.overlay = document.createElement('div');
    this.overlay.className = 'ffx2hud__overlay';

    this.el.appendChild(this.stage);
    this.el.appendChild(this.overlay);
    root.appendChild(this.el);

    this.enemyEl = this.stage.querySelector('.ffx2hud__enemies') as HTMLElement;
    this.telegraphEl = this.stage.querySelector('.ffx2hud__telegraph') as HTMLElement;
    this.partyEl = this.stage.querySelector('.ffx2hud__party') as HTMLElement;
    this.commandEl = this.stage.querySelector('.ffx2hud__command') as HTMLElement;
    this.minigameEl = this.stage.querySelector('.ffx2hud__minigame') as HTMLElement;

    this.mounted = true;
    this.layout();
    window.addEventListener('resize', this.onResize, { passive: true });
  }

  unmount(): void {
    if (!this.mounted) return;
    window.removeEventListener('resize', this.onResize);
    window.clearTimeout(this.chainHideTimer);
    window.clearTimeout(this.telegraphHideTimer);
    this.el.remove();
    this.mounted = false;
  }

  sync(state: BattleState, preview: TurnPreview[] | AtbSnapshot): void {
    this.lastState = state;
    if (!isAtbSnapshot(preview)) return; // FFX-2 always passes an AtbSnapshot; ignore a stray CTB list.
    this.lastSnapshot = preview;
    this.renderParty(state, preview);
    this.renderEnemies(state, preview);
  }

  async chooseCommand(
    actorId: CombatantId,
    commands: AvailableCommand[],
    previewRank: (cmd: AvailableCommand | null) => TurnPreview[] | AtbSnapshot,
  ): Promise<Command> {
    const actor = this.lastState?.combatants[actorId];
    this.actingId = actorId;
    if (this.lastState && this.lastSnapshot) this.renderParty(this.lastState, this.lastSnapshot);
    this.commandEl.hidden = false;
    const command = await openCommandMenu({
      container: this.commandEl,
      targetLayer: this.overlay,
      commands,
      previewRank,
      project: this.project,
      actorName: actor?.name ?? actorId,
      onPreview: (preview) => {
        if (!isAtbSnapshot(preview) || !this.lastState) return;
        this.lastSnapshot = preview;
        this.renderParty(this.lastState, preview);
        this.renderEnemies(this.lastState, preview);
      },
    });
    this.commandEl.hidden = true;
    this.actingId = null;
    if (this.lastState && this.lastSnapshot) this.renderParty(this.lastState, this.lastSnapshot);
    return command;
  }

  onEvent(event: BattleEvent): Promise<void> | void {
    switch (event.type) {
      case 'atb':
        this.lastSnapshot = event.snapshot;
        if (this.lastState) {
          this.renderParty(this.lastState, event.snapshot);
          this.renderEnemies(this.lastState, event.snapshot);
        }
        return;
      case 'chain':
        return this.showChain(event.targetId, event.count, event.multiplier);
      case 'charge':
        this.chargeStages.set(event.enemyId, { stage: event.stage, name: event.name });
        if (this.lastState) this.renderEnemies(this.lastState, this.lastSnapshot ?? { elapsedMs: 0, bars: [] });
        return this.showTelegraph(event.enemyId, event.name, event.turnsLeft, event.stage);
      default:
        return;
    }
  }

  openMinigame(kind: MinigameKind, params: Record<string, unknown>): Promise<MinigameResult> {
    if (kind === 'gunner-trigger') {
      return mountTriggerHappy(this.minigameEl, params).then((trigger) => ({ kind: 'gunner-trigger', trigger }));
    }
    if (kind === 'ladyluck-reels') {
      return mountLadyLuckReels(this.minigameEl, params).then((reels) => ({ kind: 'ladyluck-reels', reels }));
    }
    return Promise.reject(new Error(`FFX2BattleHud cannot open minigame "${kind}"`));
  }

  setVisible(visible: boolean): void {
    this.el.hidden = !visible;
  }

  setProjector(project: (id: CombatantId) => { x: number; y: number } | null): void {
    this.project = project;
  }

  // ------------------------------------------------------------- rendering

  private layout(): void {
    const rect = this.el.getBoundingClientRect();
    const w = rect.width || window.innerWidth;
    const h = rect.height || window.innerHeight;
    const scale = Math.min(w / 640, h / 360);
    const x = (w - 640 * scale) / 2;
    const y = (h - 360 * scale) / 2;
    this.stage.style.transform = `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px) scale(${scale.toFixed(4)})`;
  }

  private renderParty(state: BattleState, snapshot: AtbSnapshot): void {
    const rows = state.activeIds
      .map((id, i) => {
        const c = state.combatants[id];
        if (!isFfx2(c)) return '';
        const bar = snapshot.bars.find((b) => b.actorId === id) ?? null;
        return this.partyRowHtml(c, bar, i);
      })
      .join('');
    this.partyEl.innerHTML = rows;
  }

  private partyRowHtml(c: FFX2Combatant, bar: AtbSnapshot['bars'][number] | null, index: number): string {
    const dressphere = c.dresspheres?.current ?? 'gunner';
    const monogram = dressphere.charAt(0).toUpperCase() || '?';
    const trackW = barTrackWidth(bar?.required ?? TICKS_PER_BAR);
    const fillPct = clamp(0, 100, (bar?.fill ?? 0) * 100);
    const stateClass = bar ? `ffx2atb--${bar.state}` : '';
    const readyClass = bar?.ready ? 'ffx2atb--ready' : '';
    const charge =
      bar?.charge != null
        ? `<div class="ffx2atb__charge" style="width:${clamp(0, 100, bar.charge * 100)}%"></div>`
        : '';
    const acting = c.id === this.actingId ? ' ig-stat--acting' : '';
    const statuses = Object.keys(c.statuses)
      .slice(0, 5)
      .map((s) => `<span class="ffx2-status-chip" title="${s}">${s.slice(0, 2).toUpperCase()}</span>`)
      .join('');
    return `<div class="ig-stat${acting}" style="margin-left: calc(var(--ig-stat-step) * ${index})">
      <div class="ig-stat__sphere">${monogram}</div>
      <div class="ig-stat__name">${c.name}</div>
      <div class="ig-stat__value ${hpClass(c.hp, c.stats.maxHp)}">${Math.max(0, c.hp)}<small>/${c.stats.maxHp}</small></div>
      <div class="ig-stat__value ig-stat__value--mp">${c.mp}<small>/${c.stats.maxMp}</small></div>
      <div class="ig-stat__od ffx2atb__track ${stateClass} ${readyClass}" style="width:${trackW}px">
        <i class="ffx2atb__fill" style="width:${fillPct}%"></i>
        ${charge}
      </div>
      <div class="ffx2party__status">${statuses}</div>
    </div>`;
  }

  private renderEnemies(state: BattleState, snapshot: AtbSnapshot): void {
    const rows = state.enemyIds
      .map((id, i) => {
        const c = state.combatants[id];
        if (!isFfx2(c) || c.removed || c.flags.hidden) return '';
        const bar = snapshot.bars.find((b) => b.actorId === id) ?? null;
        const charging = this.chargeStages.get(id);
        const pip = charging ? `<span class="ffx2enemy__pip ffx2enemy__pip--s${charging.stage}"></span>` : '';
        const fillPct = clamp(0, 100, (bar?.fill ?? 0) * 100);
        return `<div class="ig-bosshp" style="top: calc(17.78px + ${i} * 26px)">
          <div class="ig-bosshp__name">${c.name}</div>
          <div class="ig-bosshp__track"><div class="ig-bosshp__fill" style="width:${fillPct}%"></div></div>${pip}
        </div>`;
      })
      .join('');
    this.enemyEl.innerHTML = rows;
  }

  private overlayPoint(targetId: CombatantId, fx: number, fy: number): { x: number; y: number } {
    const p = this.project(targetId);
    if (p) return p;
    const rect = this.el.getBoundingClientRect();
    return { x: (rect.width || window.innerWidth) * fx, y: (rect.height || window.innerHeight) * fy };
  }

  /** `.ig-damage`/`.ig-damage__chain`, headlining the chain count (see the class doc comment). */
  private showChain(targetId: CombatantId, count: number, multiplier: number): Promise<void> {
    window.clearTimeout(this.chainHideTimer);
    let el = this.overlay.querySelector('.ig-damage') as HTMLElement | null;
    if (count <= 0) {
      el?.remove();
      return this.hold(400);
    }
    if (!el) {
      el = document.createElement('div');
      this.overlay.appendChild(el);
    }
    const pos = this.overlayPoint(targetId, 0.4, 0.22);
    el.style.left = `${pos.x}px`;
    el.style.top = `${pos.y}px`;
    el.className = `ig-damage${count >= 20 ? ' ffx2chain--flash' : ''}${count >= 10 ? ' ffx2chain--hot' : count >= 5 ? ' ffx2chain--warm' : ''}`;
    el.innerHTML = `
      <svg class="ig-damage__splash" viewBox="0 0 380 190" xmlns="http://www.w3.org/2000/svg"><path d="M18 96 L58 34 L142 54 L206 8 L266 62 L352 42 L326 112 L364 166 L252 146 L182 182 L118 136 L36 158 Z"/></svg>
      <span class="ig-damage__value ffx2chain__num">${count}</span>
      <span class="ig-damage__chain">CHAIN &times;${multiplier.toFixed(2)}</span>
    `;
    // Restart the pop animation even if the class list did not change.
    void el.offsetWidth;
    el.classList.add('ffx2chain--pop');
    this.chainHideTimer = window.setTimeout(() => el?.remove(), CHAIN_HOLD_MS);
    return this.hold(450);
  }

  /** `.ig-banner`, anchored top-right by `.ig--ffx2` for free. */
  private showTelegraph(enemyId: CombatantId, name: string, turnsLeft: number, stage: 1 | 2): Promise<void> {
    window.clearTimeout(this.telegraphHideTimer);
    const enemyName = (this.lastState?.combatants[enemyId] as FFX2Combatant | undefined)?.name ?? enemyId;
    this.telegraphEl.hidden = false;
    this.telegraphEl.className = `ig-banner ffx2hud__telegraph ffx2hud__telegraph--s${stage}`;
    const chip = turnsLeft > 0 ? `${enemyName} &middot; ${turnsLeft} turn${turnsLeft === 1 ? '' : 's'}` : `${enemyName} &middot; NOW`;
    this.telegraphEl.innerHTML = `<span class="ig-banner__chip">${chip}</span><span class="ig-banner__name">${name}</span>`;
    this.telegraphHideTimer = window.setTimeout(() => {
      this.telegraphEl.hidden = true;
    }, TELEGRAPH_HOLD_MS);
    return this.hold(500);
  }

  private hold(ms: number): Promise<void> {
    return new Promise((resolve) => window.setTimeout(resolve, ms));
  }
}
