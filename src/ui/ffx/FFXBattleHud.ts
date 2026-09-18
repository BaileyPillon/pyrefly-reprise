import './ffx-hud.css';
import type {
  AtbSnapshot,
  AvailableCommand,
  BattleEvent,
  BattleState,
  Command,
  CombatantId,
  MinigameKind,
  MinigameResult,
  TurnPreview,
} from '../../battle/common/types.ts';
import type { HudPort } from '../../engine/HudPort.ts';
import { installInkGoldStyles } from '../inkgold/index.ts';
import { CommandMenu } from './CommandMenu.ts';
import { CtbList } from './CtbList.ts';
import { DamageNumbers, type Projector } from './DamageNumbers.ts';
import { openMinigame as dispatchMinigame } from './minigames/index.ts';
import { PartyStatusWindow } from './PartyStatusWindow.ts';
import { SensorPanel } from './SensorPanel.ts';
import { MoveAdvisor } from '../common/MoveAdvisor.ts';
import { StrategyGuide } from '../common/StrategyGuide.ts';
import { EnemyIntentPanel, type IntentSource } from '../common/EnemyIntent.ts';
import { TelegraphBanner } from './TelegraphBanner.ts';
import { TriggerPrompt } from './TriggerPrompt.ts';
import { advisorZone, SPRITE_HALF_WIDTH_RATIO, STAGE, type Rect } from './hudSafeZones.ts';

/** Grid px between the parked `E ENEMY MOVE` chip and the CTB queue's top edge. */
const CHIP_DOCK_GAP = 11;

/**
 * The real FFX battle HUD: CTB queue, command stack, party status, telegraph
 * banner, sensor panel and damage numerals, composed from the shared Ink &
 * Gold presentation layer (`src/ui/inkgold/`, Direction A approved
 * 2026-09-15) instead of the retired blue-glass FFX window chrome. Still
 * authored on the 640x360 grid and letterbox-scaled like `HudMock` (which
 * stays as a static art-direction reference per its own header comment, and
 * predates this restyle).
 */
export class FFXBattleHud implements HudPort {
  readonly el: HTMLElement;
  private readonly stage: HTMLElement;
  private readonly overlay: HTMLElement;
  private readonly bannerEl: HTMLElement;
  private readonly infoEl: HTMLElement;

  private readonly ctbList = new CtbList();
  private readonly partyStatus = new PartyStatusWindow();
  private readonly commandMenu = new CommandMenu();
  private readonly telegraph = new TelegraphBanner();
  private readonly sensorPanel = new SensorPanel();
  private readonly damageNumbers = new DamageNumbers();
  private readonly triggerPrompt = new TriggerPrompt();
  /**
   * The optional strategy guide (`src/ui/common/StrategyGuide.ts`), a left rail
   * measured to sit between the action banner and the command stack.
   *
   * Both anchors are resolved lazily, per frame, rather than captured once:
   * `.ffx-cmd-area` is `column-reverse` and bottom-anchored, so its *top* edge
   * — the edge the rail has to clear — moves every time a submenu opens or
   * closes. `top`/`bottom` are the fallbacks used before the HUD has been laid
   * out, or if either anchor is ever removed.
   */
  private readonly guide = new StrategyGuide({
    game: 'ffx',
    anchors: {
      below: () => this.bannerEl,
      above: () => this.cmdAreaEl,
      top: 44,
      bottom: 34,
    },
  });
  /**
   * The optional move advisor (`src/ui/common/MoveAdvisor.ts`), a card in the
   * bottom-centre band between the command stack and the party status column.
   *
   * Both anchors are resolved per frame for the same reason the guide's are:
   * `.ffx-cmd-area` is `column-reverse` and bottom-anchored, so its *right*
   * edge moves with the widest row a submenu currently holds, and the card has
   * to give way rather than be drawn over. The party list is the wall on the
   * other side; the fallbacks are those two anchors' authored edges.
   */
  private readonly advisor = new MoveAdvisor({
    game: 'ffx',
    anchors: {
      after: () => this.cmdAreaEl,
      before: () => this.partyStatus.el,
      left: 196,
      right: 414,
      bottom: 26,
    },
  });
  private readonly cmdAreaEl: HTMLElement;
  /**
   * The enemy-intent slab (`src/ui/common/EnemyIntent.ts`).
   *
   * Mounted on the **overlay**, not the scaled stage, because it is pinned to a
   * projected actor position and the projector answers in viewport pixels — the
   * same reason the damage numerals live there. `avoid` names the CTB list and
   * the command stack: those are the two panels a slab hanging over a boss can
   * genuinely land on, and the queue is the one the player is reading the
   * prediction *against*.
   */
  private readonly intent = new EnemyIntentPanel({ game: 'ffx' });

  private lastState: BattleState | null = null;
  /** Whoever's `turn-start`/`action-start` fired most recently, for the message banner's name slab. `message` events carry no actor of their own. */
  private currentActorId: CombatantId | null = null;
  private mounted = false;
  private readonly onResize = (): void => this.layout();

  constructor() {
    installInkGoldStyles();

    this.el = document.createElement('div');
    this.el.className = 'ffxhud ig';
    this.el.dataset['role'] = 'ffx-battle-hud';

    this.stage = document.createElement('div');
    this.stage.className = 'ffxhud__stage';
    this.overlay = document.createElement('div');
    this.overlay.className = 'ffxhud__overlay';

    this.bannerEl = document.createElement('div');
    this.bannerEl.className = 'ig-banner';
    this.bannerEl.hidden = true;
    this.bannerEl.innerHTML = `
      <span class="ig-banner__name" data-role="name"></span>
      <span class="ig-banner__chip" data-role="chip"></span>
    `;

    // Command stack, its breadcrumb (shown one level down, e.g. "MAGIC") and
    // the selected row's description all anchor together bottom-up, so the
    // description and breadcrumb float above the stack regardless of how
    // many rows it currently holds (`column-reverse`: the first DOM child —
    // the stack — sits at the anchored bottom edge).
    const cmdArea = document.createElement('div');
    this.cmdAreaEl = cmdArea;
    cmdArea.className = 'ffx-cmd-area';
    this.infoEl = document.createElement('div');
    this.infoEl.className = 'ig-cutin__info ffx-cmd-info';
    this.infoEl.hidden = true;
    this.infoEl.innerHTML = `<div class="ig-cutin__info-desc" data-role="text"></div>`;
    cmdArea.append(this.commandMenu.stackEl, this.infoEl, this.commandMenu.breadcrumbEl);

    this.stage.append(
      this.bannerEl,
      this.ctbList.el,
      cmdArea,
      this.triggerPrompt.el,
      this.partyStatus.el,
      this.sensorPanel.el,
      this.telegraph.el,
      this.telegraph.borderEl,
    );
    this.overlay.append(this.commandMenu.targetCursor.el, this.damageNumbers.el);

    // A CTB tile doubles as a click target while aiming: routes through the
    // same confirm path as the reticle and Enter, and is a no-op — returns
    // `false`, nothing happens — outside targeting or for a non-candidate id.
    this.ctbList.el.addEventListener('click', (e) => {
      const row = (e.target as HTMLElement | null)?.closest<HTMLElement>('[data-actor]');
      const id = row?.dataset['actor'];
      if (id) this.commandMenu.tryConfirmTargetById(id);
    });

    const surface = document.createElement('div');
    surface.className = 'ig-surface';
    surface.innerHTML = '<div class="ig-surface__grain"></div><div class="ig-surface__vignette"></div>';

    this.el.append(this.stage, this.overlay, surface);
  }

  // -------------------------------------------------------------- HudPort

  mount(root: HTMLElement): void {
    if (this.mounted) return;
    root.appendChild(this.el);
    this.mounted = true;
    // Into the scaled stage, not `this.el`: the rail is authored on the same
    // 640x360 grid as the rest of the chrome and measures its anchors in that
    // grid's own pixels (`StrategyGuide.layout`). Mounted here rather than in
    // the constructor so its window-level key listener has the same lifetime as
    // the HUD that owns it.
    this.guide.mount(this.stage);
    this.advisor.mount(this.stage);
    this.intent.mount(this.overlay, {
      host: this.el,
      scale: () => this.hudScale(),
      project: (id, anchor) => this.project(id, anchor),
      avoid: () => this.intentAvoidRects(),
      chipDock: () => this.intentChipDock(),
    });
    this.layout();
    window.addEventListener('resize', this.onResize, { passive: true });
  }

  unmount(): void {
    if (!this.mounted) return;
    window.removeEventListener('resize', this.onResize);
    this.guide.unmount();
    this.advisor.unmount();
    this.intent.unmount();
    this.damageNumbers.clear();
    this.telegraph.dispose();
    this.clearTransientOverlays();
    this.el.remove();
    this.mounted = false;
  }

  sync(state: BattleState, preview: TurnPreview[] | AtbSnapshot): void {
    // A decided battle keeps nothing transient on the field: the results
    // screen fades up over this frame and anything still drawn is drawn over
    // it. `result` going non-null is the one state change that means "the
    // fight is over", and it is idempotent, so re-syncing is harmless.
    if (state.result) this.clearTransientOverlays();
    this.lastState = state;
    if (Array.isArray(preview)) this.ctbList.render(preview, state.combatants);
    const actingId = state.log.length ? findLastActorId(state.log) : null;
    this.partyStatus.render(state.activeIds, state.combatants, actingId);
    this.guide.sync(state);
    this.advisor.sync(state);
    // The prediction deep-clones the board two dozen times, so it is refreshed
    // when the engine state actually moved — once per playback step — and never
    // from `update(dt)`, which only re-projects the slab that is already drawn.
    this.intent.refresh();
  }

  /** Hand the panel its engine. See `EnemyIntent.attachEnemyIntent`. */
  setIntentSource(source: IntentSource | null): void {
    this.intent.setSource(source);
  }

  /** The intent slab, for tests and the debug snapshot. */
  get enemyIntent(): EnemyIntentPanel {
    return this.intent;
  }

  async chooseCommand(
    actorId: CombatantId,
    commands: AvailableCommand[],
    previewRank: (cmd: AvailableCommand | null) => TurnPreview[] | AtbSnapshot,
  ): Promise<Command> {
    const combatants = this.lastState?.combatants ?? {};
    const wrapped = (cmd: AvailableCommand | null): TurnPreview[] | AtbSnapshot => {
      const result = previewRank(cmd);
      if (Array.isArray(result) && this.lastState) this.ctbList.render(result, this.lastState.combatants);
      return result;
    };

    // A new decision is open, so nothing from the previous one may still be on
    // the field — see `clearTransientOverlays`. This is the "on submit" and
    // "on actor change" hook both at once: the presenter only asks for the next
    // command after the previous one has been submitted and played out.
    this.clearTransientOverlays();

    const triggerOnly = commands.length > 0 && commands.every((c) => c.command.kind === 'trigger');
    if (triggerOnly) return this.triggerPrompt.open(commands, combatants);

    // The guide's NEXT line explains *this* decision, so it opens and closes
    // with the menu — including when the menu loses to a strategy that raced
    // its promise, which is why the clear sits in a `finally`.
    // The advisor's card explains the same decision and follows the same
    // lifetime, so it opens and closes with the guide's NEXT line.
    if (this.lastState) {
      this.guide.showDecision(actorId, commands, this.lastState);
      this.advisor.showDecision(actorId, commands, this.lastState);
    }
    try {
      return await this.commandMenu.open({
        actorId,
        commands,
        previewRank: wrapped,
        combatants,
        setHelp: (t) => this.setHelp(t),
      });
    } finally {
      this.guide.clearDecision();
      this.advisor.clearDecision();
    }
  }

  onEvent(event: BattleEvent): void {
    switch (event.type) {
      case 'action-start':
        this.currentActorId = event.actorId;
        // An action resolving means the decision has been made — by the
        // player, or by a strategy that raced the menu's promise and won
        // (`BattlePresenter.chooseCommand`). Either way the command stack and
        // its help line must not sit over the action.
        this.commandMenu.suspend();
        return;
      case 'turn-start':
        // The turn passing is the actor change: whatever the last actor left
        // on the field — a message banner, an Overdrive picker whose promise
        // was abandoned — is stale from this event on.
        if (this.currentActorId !== event.actorId) this.clearTransientOverlays();
        this.currentActorId = event.actorId;
        return;
      case 'message':
        this.setMessage(event.text);
        return;
      case 'charge':
        this.telegraph.show(this.nameOf(event.enemyId), event.name, event.stage);
        return;
      case 'sensor': {
        const target = this.lastState?.combatants[event.targetId];
        if (target) this.sensorPanel.show(target);
        return;
      }
      case 'damage':
      case 'heal':
      case 'miss':
      case 'mp-damage':
      case 'mp-heal':
        this.damageNumbers.spawn(event);
        return;
      case 'action-end':
        this.telegraph.clearBorder();
        return;
      default:
        return;
    }
  }

  openMinigame(kind: MinigameKind, params: Record<string, unknown>): Promise<MinigameResult> {
    // Mounted into the scaled 640x360 stage (not `this.el`, the raw
    // viewport-sized root) so `.ig-minigame`'s spec pixel geometry lands at
    // the same scale as the rest of the HUD instead of rendering pinned to
    // the real top-left corner.
    //
    // Bracketed by `removeMinigameOverlays` on both sides. Each overlay is
    // expected to take itself off the field (every `finish`/`cancel` awaits
    // `overlay.close()` *before* it settles the promise, so this sweep has
    // nothing to do on the happy path); the sweep is what makes "no title slab
    // outlives its decision" true even for an overlay that threw, or that was
    // abandoned by a strategy racing the menu.
    this.removeMinigameOverlays();
    return dispatchMinigame(this.stage, kind, params).finally(() => this.removeMinigameOverlays());
  }

  setVisible(visible: boolean): void {
    this.el.hidden = !visible;
    if (visible) this.layout();
  }

  /** Frame tick from `BattleScreen`, forwarded to the only things here that animate themselves. */
  update(dt: number): void {
    this.damageNumbers.update(dt);
    this.guide.update(dt);
    this.advisor.update(dt);
    // After the advisor's own `layout()`, never before: `MoveAdvisor` measures
    // itself into the band between two HUD panels and knows nothing about the
    // party standing in that band, which is how the card ended up printed
    // across Tidus and Kimahri. `placeAdvisor` is FFX overruling that with the
    // measured zone in `hudSafeZones.ts`. See the handoff — the right end state
    // is the advisor taking a zone from its owner instead of being moved after
    // the fact, and that is a change to a file this track does not own.
    this.placeAdvisor();
    this.intent.update(dt);
  }

  /** The guide rail, for tests and the debug snapshot. */
  get strategyGuide(): StrategyGuide {
    return this.guide;
  }

  /** The move-advisor card, for tests and the debug snapshot. */
  get moveAdvisor(): MoveAdvisor {
    return this.advisor;
  }

  setProjector(project: Projector): void {
    const p: Projector = project;
    this.project = p;
    this.commandMenu.setProjector(p);
    this.damageNumbers.setProjector(p);
    this.damageNumbers.setSideResolver((id) => {
      const side = this.lastState?.combatants[id]?.side;
      return side === 'party' || side === 'enemy' || side === 'aeon' ? side : null;
    });
  }

  // ------------------------------------------------------------------ misc

  /**
   * `.ig-banner`: the acting character's name in serif italic (tracked from
   * `turn-start`/`action-start`, never parsed out of the message text — a
   * `message` event carries only `text` and `kind`, and its text is free-form
   * per `AbilityDef.messageTemplate` (`"<user> uses <ability>"` for an
   * ability, but "Critical hit!", "Mix failed!" and other system/story
   * copy lead with neither a name nor even necessarily a space). The full
   * text always goes in the chip; the one cosmetic step is trimming an exact
   * `"<name> "` prefix when the text happens to restate the tracked actor's
   * name, so "Tidus uses Cure" doesn't read "Tidus / Tidus uses Cure".
   */
  private setMessage(text: string): void {
    const nameEl = this.bannerEl.querySelector<HTMLElement>('[data-role="name"]')!;
    const chipEl = this.bannerEl.querySelector<HTMLElement>('[data-role="chip"]')!;
    const name = this.currentActorId ? this.nameOf(this.currentActorId) : '';
    const chipText = name && text.startsWith(`${name} `) ? text.slice(name.length + 1) : text;
    nameEl.textContent = name;
    nameEl.hidden = !name;
    chipEl.textContent = chipText;
    chipEl.hidden = chipText.length === 0;
    this.bannerEl.hidden = false;
  }

  /** `.ig-cutin__info`: the highlighted command's help/description text. */
  private setHelp(text: string): void {
    this.infoEl.hidden = !text;
    if (text) this.infoEl.querySelector('[data-role="text"]')!.textContent = text;
  }

  private nameOf(id: CombatantId): string {
    return this.lastState?.combatants[id]?.name ?? id;
  }

  /**
   * Take every one-decision-long piece of chrome off the field.
   *
   * Two things live exactly as long as one decision and had no owner making
   * sure of it:
   *
   * - an **Overdrive overlay** (`minigames/OverdriveOverlay.ts`), which is only
   *   removed by its own `close()`. A picker whose promise never settled — the
   *   empty-list case `minigames/params.ts` documents — left its ivory title
   *   slab on the stage for the rest of the fight, printed over the `G GUIDE`
   *   chip and the Sensor card. That is Bailey's "stale Ronso Rage banner".
   * - the **message banner** (`.ig-banner`), which {@link setMessage} shows and
   *   nothing ever hid again, so the last line of the previous actor's turn sat
   *   over the next actor's.
   *
   * Called at the three moments a decision can end — a new `chooseCommand`
   * (submit, and the actor changing with it), a `turn-start` for a different
   * actor, and the battle state carrying a `result` — plus `unmount`. It is
   * idempotent and touches nothing the player is currently reading: a live
   * picker is always inside the `await` these callers sit on the other side of.
   */
  private clearTransientOverlays(): void {
    this.removeMinigameOverlays();
    this.bannerEl.hidden = true;
  }

  /** The sweep half of {@link clearTransientOverlays}; see `openMinigame`. */
  private removeMinigameOverlays(): void {
    for (const el of this.stage.querySelectorAll<HTMLElement>('.ig-minigame')) el.remove();
  }

  // ------------------------------------------------------------- safe zones

  /**
   * Move the advisor card (and its chip) into the zone `hudSafeZones.ts` picks.
   *
   * Runs after `MoveAdvisor.update`, so the inline `left`/`width`/`bottom` it
   * writes are the ones that stand. Everything is read and written in the
   * stage's own grid px: the card is a child of the scaled stage, so
   * `offsetLeft`/`offsetWidth` are already grid units, while the projector
   * answers in viewport px and has to be divided back through the letterbox.
   *
   * A no-op when the card is not up, and a no-op when no zone fits — the card
   * then keeps the advisor's own placement, because a visible overlap is easier
   * to see and report than a card parked off the grid.
   */
  private placeAdvisor(): void {
    const card = this.advisor.el.querySelector<HTMLElement>('[data-role="move-advisor-card"]');
    const chip = this.advisor.el.querySelector<HTMLElement>('[data-role="move-advisor-toggle"]');
    if (!card || card.hidden || card.offsetWidth <= 0) return;

    const zone = advisorZone({
      cmdArea: this.gridRect(this.cmdAreaEl) ?? { left: 30, top: 205, right: 211, bottom: 334 },
      partyStatus: this.gridRect(this.partyStatus.el) ?? { left: 403, top: 258, right: 617, bottom: 348 },
      guide: this.gridRect(this.el.querySelector<HTMLElement>('.sgd__panel')),
      sensor: this.gridRect(this.sensorPanel.el),
      sprites: this.partySpriteRects(),
    });
    if (!zone) return;

    card.style.left = `${zone.left.toFixed(2)}px`;
    card.style.width = `${zone.width.toFixed(2)}px`;
    card.style.bottom = `${zone.bottom.toFixed(2)}px`;
    card.style.maxHeight = `${zone.maxHeight.toFixed(2)}px`;
    card.dataset['zone'] = zone.kind;
    if (chip) {
      chip.style.left = `${zone.left.toFixed(2)}px`;
      chip.style.bottom = `${(zone.bottom + card.offsetHeight + 2).toFixed(2)}px`;
    }
  }

  /**
   * Every **active** party member's sprite, as a grid-space rect.
   *
   * Reconstructed from the projector's head and feet points — see
   * `SPRITE_HALF_WIDTH_RATIO` for why the width is an estimate and why the
   * estimate is deliberately generous. A member the projector cannot answer for
   * (off stage for a frame while the stage re-stages it) is simply skipped;
   * the zone is recomputed next frame.
   */
  private partySpriteRects(): Rect[] {
    const state = this.lastState;
    if (!state) return [];
    const scale = this.hudScale();
    if (!scale) return [];
    const host = this.el.getBoundingClientRect();
    const ox = host.left + (host.width - STAGE.width * scale) / 2;
    const oy = host.top + (host.height - STAGE.height * scale) / 2;
    const out: Rect[] = [];
    for (const id of state.activeIds) {
      const head = this.project(id, 'head');
      const feet = this.project(id, 'feet');
      if (!head || !feet) continue;
      const top = (head.y - oy) / scale;
      const bottom = (feet.y - oy) / scale;
      const cx = (head.x - ox) / scale;
      const half = Math.abs(bottom - top) * SPRITE_HALF_WIDTH_RATIO;
      out.push({ left: cx - half, right: cx + half, top: Math.min(top, bottom), bottom: Math.max(top, bottom) });
    }
    return out;
  }

  /** An element's box in the stage's 640x360 grid px, or `null` if it is not laid out. */
  private gridRect(el: HTMLElement | null): Rect | null {
    if (!el || el.hidden || el.offsetWidth <= 0 || el.offsetHeight <= 0) return null;
    return {
      left: el.offsetLeft,
      top: el.offsetTop,
      right: el.offsetLeft + el.offsetWidth,
      bottom: el.offsetTop + el.offsetHeight,
    };
  }

  /** The presenter's projector, installed by `setProjector`. */
  private project: Projector = () => null;

  /**
   * The HUD panels the intent slab may not cover, in viewport pixels.
   *
   * The CTB list first and above all — the slab's whole claim is "this is what
   * the actor at the top of that queue is about to do", and covering the queue
   * with the answer is self-defeating. The command stack and its help card are
   * here for the same reason the numerals dodge them, and `.ffx-sensor` joined
   * them after a Chapter 1 capture caught the slab printed across the
   * Mortiorchis's own scan card.
   *
   * `.ig-banner` is deliberately absent, for the reason `ffx/DamageNumbers.ts`
   * gives about the telegraph: it is a transient band across the top of the
   * field, and dodging it would move the slab at exactly the moment the boss is
   * winding up and the player is reading it.
   */
  private intentAvoidRects(): Array<{ left: number; top: number; right: number; bottom: number }> {
    const out: Array<{ left: number; top: number; right: number; bottom: number }> = [];
    // The guide's rail and the advisor's chip joined the list with the fix-3
    // round: both are opaque, both ship **on**, and at 1280x720 the slab is
    // wide enough to reach the guide's column. Named by their solid children
    // for the reason `ffx/DamageNumbers.ts` gives — `.sgd` and `.mad` are
    // `inset: 0` wrappers, and listing those would fence off the whole field.
    for (const selector of [
      '.ig-ctb',
      '.ig-cmd-stack',
      '.ffx-cmd-info',
      '.ig-stat-list',
      '.ffx-sensor',
      '.mad__card',
      '.mad__toggle',
      '.sgd__panel',
      '.sgd__toggle',
    ] as const) {
      for (const el of this.el.querySelectorAll<HTMLElement>(selector)) {
        // Size alone. `ffx/DamageNumbers.ts` gates on `el.hidden ||
        // el.offsetParent === null` as well, which is redundant here: a zero-size
        // box already means "not laid out", and it covers `[hidden]` (which
        // `tokens.css` forces to `display: none`) and a hidden *ancestor* too.
        const r = el.getBoundingClientRect();
        if (r.width <= 0 || r.height <= 0) continue;
        out.push({ left: r.left, top: r.top, right: r.right, bottom: r.bottom });
      }
    }
    return out;
  }

  /**
   * Where `E ENEMY MOVE` parks when the intent panel is off — see
   * `EnemyIntentMountOptions.chipDock`.
   *
   * The CTB queue's own top-right corner, so the chip reads as a label on the
   * queue it annotates instead of as graffiti on the boss. The queue's top edge
   * is grid y 49.8 and the band above it holds nothing but the telegraph
   * banner, which is centred on the stage and 150 grid px away.
   */
  private intentChipDock(): { x: number; y: number } | null {
    const ctb = this.ctbList.el.getBoundingClientRect();
    if (ctb.width <= 0 || ctb.height <= 0) return null;
    const scale = this.hudScale();
    return { x: ctb.right, y: ctb.top - CHIP_DOCK_GAP * scale };
  }

  /** The letterbox scale `layout()` applies to the 640x360 grid. */
  private hudScale(): number {
    const rect = this.el.getBoundingClientRect();
    const w = rect.width || window.innerWidth;
    const h = rect.height || window.innerHeight;
    if (!w || !h) return 1;
    return Math.min(w / 640, h / 360);
  }

  /** Letterbox the 640x360 grid into whatever the viewport is, exactly as `HudMock`. */
  private layout(): void {
    const rect = this.el.getBoundingClientRect();
    const w = rect.width || window.innerWidth;
    const h = rect.height || window.innerHeight;
    const scale = Math.min(w / 640, h / 360);
    const x = (w - 640 * scale) / 2;
    const y = (h - 360 * scale) / 2;
    this.stage.style.transform = `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px) scale(${scale.toFixed(4)})`;
  }
}

function findLastActorId(log: BattleState['log']): CombatantId | null {
  for (let i = log.length - 1; i >= 0; i--) {
    const e = log[i]!;
    if (e.type === 'turn-start' || e.type === 'action-start') return e.actorId;
  }
  return null;
}
