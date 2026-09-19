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
import {
  advisorChipDock,
  advisorZone,
  GAP,
  SPRITE_FOOT_MARGIN_RATIO,
  SPRITE_HALF_WIDTH_RATIO,
  SPRITE_TOP_MARGIN_RATIO,
  STAGE,
  type AdvisorZone,
  type Rect,
} from './hudSafeZones.ts';

/** Clearance between the advisor card's top edge and its chip, in grid px. */
const ADVISOR_CHIP_GAP = 2;

/**
 * The top of the fixed slot the command window's help slab is parked in.
 *
 * `ffx-hud.css` pins `.ffx-cmd-info` to `bottom: 206px` on the 360-tall grid —
 * a bottom edge at y 154 — and caps it at 29 grid px, so the slot is
 * y 125..154 and nothing it prints ever leaves it. Repeated here because two
 * other things in this file are solved against it: the strategy guide's floor,
 * and the reserved rect the advisor's solver is handed on the frames the slab
 * happens to be empty (a stale box is better than a band that opens and shuts).
 *
 * **Why 154 and not "six px above the stack".** Measured on the round-02 gate
 * build, the highest party head inside the command column's x-span is Yuna's
 * at y 158.4 (Chapter 1); Chapters 2 and 3 put her at 188. A slab that stops
 * at 154 is clear of all three by 4.4 grid px at the worst, in every state,
 * which is the whole of the gate's third refutation.
 */
const CMD_INFO_TOP = 121;

/**
 * The whole slot, as the advisor's solver is handed it — the **painted** box,
 * so the slab's own `skewX` reach is already inside these four numbers.
 *
 * It is a constant rather than a measurement because the slab is empty on the
 * frames between one decision and the next, and a box the solver won while the
 * slab was empty would be taken away by the next keystroke. Its width was
 * `max-width: 240px` and the slab sized itself to its sentence, so SWITCH's —
 * "Swap in a reserve member (L1 / Q). The member coming in takes this turn." —
 * grew it to 248 grid px and ran it under the enemy-intent slab, 11 830 grid
 * px² of overlap from one keypress. A fixed width wraps instead.
 *
 * `right: 196` is the number with the least room to spare: Kimahri's
 * reconstructed rect in Chapter 1 starts at x 200.8, so the slab clears the
 * only party member who stands this high in the command column by 4.8 grid px.
 */
const CMD_INFO_SLOT = { left: 24, top: CMD_INFO_TOP, right: 196, bottom: 154 } as const;

/** What `solveAdvisorPlacement` holds for the length of one decision. */
interface HeldAdvisorPlacement {
  key: string;
  zone: AdvisorZone | null;
  /** Where the chip parks when `zone` is `null`; solved on the same frame. */
  chipDock: { left: number; bottom: number } | null;
}

/**
 * `appliedAdvisorBox`'s value while the card is on its own placement.
 *
 * Any string no `${kind}@...` box key can collide with; it is only ever
 * compared, never parsed.
 */
const FREE_PLACEMENT = 'free';

/** A snapped rect's identity, for the placement key. */
function rectKey(r: Rect | null): string {
  return r ? `${r.left},${r.top},${r.right},${r.bottom}` : '-';
}

/** A rect snapped **outwards** to a multiple of `q`, so it never shrinks. */
function growToGrid(r: Rect | null, q: number): Rect | null {
  if (!r) return null;
  return {
    left: Math.floor(r.left / q) * q,
    top: Math.floor(r.top / q) * q,
    right: Math.ceil(r.right / q) * q,
    bottom: Math.ceil(r.bottom / q) * q,
  };
}

/** Grid px between the parked `E ENEMY MOVE` chip and the CTB queue's top edge. */
const CHIP_DOCK_GAP = 11;

/**
 * The CTB queue's authored rail on the grid, for the frames it is not up.
 *
 * `docs/ENGINE-API.md#hud-safe-area` gives it as 0.843..0.970 x 0.138..0.557 of
 * the frame — the *worst case under the name-plate cap*, not where today's cast
 * happens to put it — which on the 640x360 stage is x 539.5..620.8,
 * y 49.7..200.5. Only the top-right corner is used; see {@link intentChipDock}.
 */
const CTB_RAIL = { left: 539.5, top: 49.7, right: 620.8, bottom: 200.5 } as const;

/**
 * The arithmetic behind `FFXBattleHud.intentChipDock`, on its own so a test can
 * reach it without a laid-out browser. See that method for why the fallback
 * exists; `tests/unit/ui-ffx-hud.test.ts` pins the state that needed it.
 */
export function intentChipDockAt(
  ctb: { right: number; top: number; width: number; height: number },
  host: { left: number; top: number; width: number; height: number },
  scale: number,
): { x: number; y: number } | null {
  if (!scale) return null;
  if (ctb.width > 0 && ctb.height > 0) return { x: ctb.right, y: ctb.top - CHIP_DOCK_GAP * scale };
  const ox = host.left + (host.width - STAGE.width * scale) / 2;
  const oy = host.top + (host.height - STAGE.height * scale) / 2;
  return { x: ox + CTB_RAIL.right * scale, y: oy + (CTB_RAIL.top - CHIP_DOCK_GAP) * scale };
}

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
      // **A constant floor, not the command area's travelling top edge.**
      //
      // The rail used to stop `CLEARANCE_GAP` above `.ffx-cmd-area`, which
      // meant it grew and shrank by 90 grid px as the command stack did: the
      // round-02 gate captured it at y 44..126 on the top-level menu and at
      // y 44..202 with a Skill list open, in the same fight. Now the left
      // column's other tenant — the help slab — has a fixed slot at
      // {@link CMD_INFO_TOP}, so the rail ends a clearance above that slot and
      // the two never trade pixels. Nothing rises past the slot either: the
      // command stack's tallest measured top is 166.4 with `MAX_VISIBLE_ROWS`
      // rows, 41 grid px below this floor.
      top: 44,
      bottom: STAGE.height - (CMD_INFO_TOP - GAP),
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
  private readonly intent = new EnemyIntentPanel({
    game: 'ffx',
    // **FFX opens every battle with the read-out folded to its chip, and the
    // player's `E` opens it for that fight.**
    //
    // Round 02 #14 asked for "a default that does not hide the fight" and the
    // previous answer was a shorter *body* (`density: 'brief'`). The gate
    // measured what that actually ships: 150 x 119 grid px, hung at x 165..315
    // in Chapter 1 and x 176..326 in Chapter 2 — the band directly above the
    // party's heads, which on a 640x360 stage is also the only ground wide
    // enough for the advisor card. Two opaque slabs, one band; something had
    // to yield, and the one that explains *the decision the player is making
    // right now* is the one to keep. With the slab folded, all three chapters
    // solve a 132-wide advisor card in clear sky (`hudSafeZones.ts`).
    //
    // `readVisible`/`writeVisible` are overridden rather than the shared
    // `Settings.intentVisible` default being changed, because that setting is
    // FFX-2's as well and Bailey's rule of 2026-09-19 is that a change true of
    // one game is not applied to the other. FFX-2 passes neither and keeps its
    // persisted, default-on behaviour exactly as it shipped.
    readVisible: () => false,
    writeVisible: () => {},
  });

  private lastState: BattleState | null = null;
  /** Whoever's `turn-start`/`action-start` fired most recently, for the message banner's name slab. `message` events carry no actor of their own. */
  private currentActorId: CombatantId | null = null;
  private mounted = false;
  /**
   * Bumped every time a decision opens or closes, so the advisor's placement is
   * solved once per decision rather than once per frame. See
   * `solveAdvisorPlacement` for why that matters.
   */
  private advisorDecisionSeq = 0;
  /**
   * The decision that gave up on a measured zone, if any. See
   * `solveAdvisorPlacement`: the zone/free choice is held for a whole decision,
   * not merely the zone's box.
   */
  private advisorFreeSeq = -1;
  private heldAdvisor: HeldAdvisorPlacement | null = null;
  /** The box last written to the card, so a new one can be fitted on arrival. */
  private appliedAdvisorBox = '';
  private readonly onResize = (): void => {
    this.layout();
    // A resize is the one layout change that moves every rect at once, and the
    // letterbox scale is in the placement key anyway — but the party's
    // projected rects lag it by a frame, so drop the held placement outright.
    this.heldAdvisor = null;
  };

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
    cmdArea.append(this.commandMenu.stackEl, this.commandMenu.breadcrumbEl);

    this.stage.append(
      this.bannerEl,
      this.ctbList.el,
      cmdArea,
      // **Not inside `cmdArea`.** It used to be the middle child of that
      // column-reverse stack, which pinned it `GAP` above whatever height the
      // command stack happened to have — and the stack's height is the most
      // variable thing on an FFX screen: 168 grid px at the top-level menu, 103
      // while a Skill list is open, 76 during targeting. So the one panel that
      // is up on *every* decision slid up and down the left column by 90 grid
      // px, and at the bottom of that travel it printed across Yuna's chest
      // (1 366 grid px² at 1280x720, Chapter 3, measured on the round-02 gate
      // build) in ten of thirteen states.
      //
      // Given its own anchor it does not move at all — see
      // `ffx-hud.css`'s `.ffx-cmd-info`, which parks it at y 125..154, above
      // every party head in all three chapters and below the guide's rail.
      // Two panels with two jobs, two rects, and the advisor's solver is told
      // about both of them rather than about their union.
      this.infoEl,
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
    // `reset`, not merely `mount`: what Sensor revealed belongs to one battle,
    // and a HUD instance that is mounted a second time is a second battle. (It
    // also keeps this round's own rule — a method with no caller is how the
    // plate got into trouble in the first place.)
    this.sensorPanel.reset();
    this.sensorPanel.mount();
    this.intent.mount(this.overlay, {
      host: this.el,
      scale: () => this.hudScale(),
      project: (id, anchor) => this.project(id, anchor),
      avoid: () => this.intentAvoidRects(),
      chipDock: () => this.intentChipDock(),
      // FFX ships the slab **on** and the fight is what the player came for, so
      // the default has to be the short read-out. See
      // `EnemyIntentMountOptions.density` and round 02 #14. FFX-2 passes
      // nothing and keeps the full slab, which is the rule Bailey set on
      // 2026-09-19: a change true of one game is not applied to the other.
      density: 'brief',
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
    this.sensorPanel.unmount();
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
    if (state.result) {
      this.clearTransientOverlays();
      // The enemy plate goes with them. This is also the call `SensorPanel.hide()`
      // never had: before this round one Sensor in Chapter 1 left the card on
      // the field for the rest of the fight, which is what crowded the screen
      // and starved the advisor's shelf (`critic/rounds/round-02.md`).
      this.sensorPanel.hide();
    }
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
    this.advisorDecisionSeq++;
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
        // The enemy plate is the surface targeting gets for itself, so the
        // command slab can go on saying what the *command* does while the
        // player is aiming [round-02 #27]. It is also one of the two moments
        // the plate is allowed to open [the fix-3 addendum's (a)].
        onTargetChange: (id) => this.focusEnemyPlate(id),
      });
    } finally {
      this.guide.clearDecision();
      this.advisor.clearDecision();
      this.advisorDecisionSeq++;
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
    // Before the advisor, because folding the enemy plate gives the shelf its
    // height back and `placeAdvisor` should see that on the same frame.
    this.sensorPanel.update(dt);
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
   * Point the enemy plate at whoever the player is aiming at.
   *
   * Enemies only: aiming a Potion at Yuna is not a question about an enemy, and
   * swapping the plate's subject to a party member would make the one panel that
   * prints enemy health mean two different things [round-02 #28]. `null` — the
   * picker closed — leaves the plate where it is; it folds itself on its own
   * clock (`SensorPanel.update`).
   */
  private focusEnemyPlate(id: CombatantId | null): void {
    if (!id) return;
    const c = this.lastState?.combatants[id];
    if (!c || c.side === 'party') return;
    this.sensorPanel.focus(c);
  }

  /** The enemy plate, for tests and the debug snapshot. */
  get enemyPlate(): SensorPanel {
    return this.sensorPanel;
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
   * Move the advisor card (and its chip) into the zone `hudSafeZones.ts` picks,
   * or — when no zone fits — hand the card back to its own placement, whole.
   *
   * Runs after `MoveAdvisor.update`, so the inline `left`/`width`/`bottom` it
   * writes are the ones that stand. Everything is read and written in the
   * stage's own grid px: the card is a child of the scaled stage, so
   * `offsetLeft`/`offsetWidth` are already grid units, while the projector
   * answers in viewport px and has to be divided back through the letterbox.
   *
   * **No zone means this method gets out of the way — it never takes the card
   * down.** For one build it did, together with a chip that said the screen was
   * full, and the pre-deploy gate found the cost: Chapter 1 keeps the Sensor card up for the
   * whole fight (`SensorPanel.hide()` has no caller), so no box tall enough for
   * the card existed on five of its seven decisions and the player got a
   * two-word chip floating over the strategy guide instead of any advice. A card
   * in an imperfect place answers the question; a card that is not there does
   * not, and the live build has never withheld it [lead, 2026-09-18]. So the
   * fallback is exactly what the live build draws: every inline value this
   * method wrote is cleared, `MoveAdvisor.layout` measures the band between the
   * command stack and the party column as it always has, and the stylesheet's
   * own 104px cap comes back with the cleared `max-height` — which is the cap
   * `MoveAdvisor.fitCard` then fits the text to, so a fallback card is never
   * sliced either.
   *
   * A sliced card was the other half of the report and it is still impossible:
   * `hudSafeZones.MIN_ADVISOR_HEIGHT` is why a *zone* is never 24px tall, and
   * the 104px cap plus the density ladder is why the free placement fits too.
   *
   * The **chip is placed whether the card is up or not**, but only while there
   * is a zone: `MoveAdvisor` deliberately clears the chip's inline `left` when
   * the player hides the card, and the stylesheet anchor it falls back to
   * (`move-advisor.css`, `left: 196px`) is in the middle of the party — in
   * chapters 1 and 3 the `N BEST MOVE` chip landed on Tidus the moment the
   * player pressed `N`. With no zone there is no measured band to dock it in
   * and the chip rides with the card, which is where `MoveAdvisor.layout` puts
   * it and where the live build has it.
   */
  private placeAdvisor(): void {
    const card = this.advisor.el.querySelector<HTMLElement>('[data-role="move-advisor-card"]');
    const chip = this.advisor.el.querySelector<HTMLElement>('[data-role="move-advisor-toggle"]');
    if (!card) return;

    const zone = this.solveAdvisorPlacement().zone;
    // **One input, and it is the player's.** `MoveAdvisor.applyVisible` is the
    // only other writer of this flag and it writes the same answer; nothing
    // measured on this screen may take the card down.
    const cardUp = this.advisor.isVisible;
    card.hidden = !cardUp;
    this.advisor.el.dataset['zone'] = zone ? zone.kind : 'free';

    if (!zone) {
      // **The card comes down, and the chip stays.**
      //
      // For one round this branch did the opposite: it cleared the inline box
      // and handed the card back to `MoveAdvisor`'s own anchors, on the
      // reasoning that "a card in an imperfect place answers the question; a
      // card that is not there does not". The round-02 gate measured what
      // "imperfect" came to in Chapter 2 — the card printed across all three
      // party sprites, 7 465 grid px² of it on Tidus alone, at every one of
      // four viewports — and that is not an imperfect place, it is the fight
      // with a slab over it.
      //
      // It is also a branch that should now be unreachable in the shipped
      // chapters. `advisorZone` declines only when **no** rectangle on the
      // frame holds even an 80px card clear of every panel and every fighter,
      // and `tests/unit/ui-ffx-hud-safe-zones.test.ts` pins that all three
      // chapters find a box at the full width. The chip is docked by the same
      // solver, so what the player is left with is a real, readable `N BEST
      // MOVE` affordance on clear ground rather than two words on Tidus.
      if (this.appliedAdvisorBox !== FREE_PLACEMENT) {
        this.appliedAdvisorBox = FREE_PLACEMENT;
        this.clearAdvisorBox(card, chip);
      }
      card.hidden = true;
      if (chip) {
        const dock = this.heldAdvisorChipDock;
        if (dock) {
          chip.style.left = `${dock.left.toFixed(2)}px`;
          chip.style.bottom = `${dock.bottom.toFixed(2)}px`;
        }
      }
      return;
    }

    if (cardUp) {
      const applied = `${zone.kind}@${zone.left}@${zone.width}@${zone.bottom}@${zone.maxHeight}`;
      this.writeAdvisorBox(card, zone);
      if (applied !== this.appliedAdvisorBox) {
        // **Fit the card to the box in the same frame it is given it.**
        //
        // `MoveAdvisor.update` measures the card against the box that was on
        // screen for the *previous* frame — deliberately, because that is the
        // box the player saw — and `placeAdvisor` runs after it. So on the one
        // frame a new box is applied, the card is painted at the density the
        // old box earned, and if the new box is the smaller of the two that
        // frame is a clipped card. It is a single frame, and a screenshot of a
        // Chapter 1 turn where the card returned from a declined zone caught it.
        //
        // Ticking the advisor again closes the gap: `fitCard` now measures the
        // box just written and walks its ladder against it. `update` ends by
        // re-running the advisor's own `layout()`, which overwrites the card's
        // left/width/bottom with its anchor geometry, so the box is written a
        // second time afterwards. `maxHeight` survives — `layout` does not set
        // it — which is what `fitCard` needed in between.
        this.advisor.update(0);
        this.writeAdvisorBox(card, zone);
        this.appliedAdvisorBox = applied;
      }
    } else {
      delete card.dataset['zone'];
      this.appliedAdvisorBox = '';
    }
    if (chip) {
      // With the card up the chip rides just above it; with the player's `N`
      // holding the card down it takes the zone's own bottom edge, rather than
      // the stylesheet anchor in the middle of the party.
      chip.style.left = `${zone.left.toFixed(2)}px`;
      const bottom = cardUp ? zone.bottom + card.offsetHeight + ADVISOR_CHIP_GAP : zone.bottom;
      chip.style.bottom = `${bottom.toFixed(2)}px`;
    }
  }

  /** The four inline values `placeAdvisor` writes, in one statement. */
  private writeAdvisorBox(card: HTMLElement, zone: AdvisorZone): void {
    card.style.left = `${zone.left.toFixed(2)}px`;
    card.style.width = `${zone.width.toFixed(2)}px`;
    card.style.bottom = `${zone.bottom.toFixed(2)}px`;
    card.style.maxHeight = `${zone.maxHeight.toFixed(2)}px`;
    card.dataset['zone'] = zone.kind;
  }

  /**
   * Every inline value and data attribute {@link writeAdvisorBox} wrote, undone.
   *
   * `top` is in here although nothing writes it, because the contract this
   * clears to is "the card carries no geometry the HUD measured" and the next
   * agent to add a `top` should not have to remember two lists. What the card
   * carries after this is whatever `MoveAdvisor.layout` measures for itself on
   * the very next tick — the live build's placement — and, for `max-height`,
   * `move-advisor.css`'s 104px.
   */
  private clearAdvisorBox(card: HTMLElement, chip: HTMLElement | null): void {
    card.style.left = '';
    card.style.top = '';
    card.style.width = '';
    card.style.bottom = '';
    card.style.maxHeight = '';
    delete card.dataset['zone'];
    if (chip) {
      chip.style.left = '';
      chip.style.bottom = '';
    }
  }

  /**
   * The placement for the decision that is open, solved once and then held.
   *
   * Re-solving every frame is what made the card teleport. The zone's inputs
   * include the party's projected rects, and a sprite's idle animation breathes
   * a pixel or two either way, which is enough to flip a band from just-solvable
   * to just-not several times a second: the card jumped between the shelf and
   * its own bottom-right placement, changing width as it went, while the player
   * was reading it [advisor track, `docs/handoff/fix3-advisor.md` §1]. It also
   * fights `MoveAdvisor.fitCard`, which re-walks its density ladder whenever the
   * width it is measured against moves by more than 4px.
   *
   * So the placement is keyed on the things that are genuinely *layout*: which
   * decision is open, the letterbox, and every panel's box rounded to the grid's
   * own pixel. A submenu opening, the Sensor card arriving, the guide being
   * switched off and a window resize all change that key and re-solve.
   *
   * **Where the party is standing is deliberately not in the key.** It is an
   * input to the zone, and it is read afresh on every re-solve, but it never
   * *causes* one. A first attempt re-solved when the party's projected union
   * drifted more than 8 grid px, on the reasoning that an idle cycle breathes a
   * sprite by less than a pixel while a KO moves one by tens — and the live
   * matrix failed on it at Chapter 1's second decision, three different boxes
   * inside one turn, because the acting character steps forward. Every way the
   * party can genuinely relocate — a KO, a switch, an Overdrive — is a command
   * that *ends the decision*, and the decision ending is already in the key.
   */
  private solveAdvisorPlacement(): HeldAdvisorPlacement {
    // **Everything is snapped to whole grid px before it is used**, not merely
    // before it is hashed. A zone solved from raw rects is a continuous
    // function of them, so a panel settling half a pixel — or a boss breathing,
    // which moves the intent slab through the render camera — re-solved to a
    // box one pixel along, and the card stepped sideways inside a decision that
    // had not changed. Snapped, the zone is a pure function of the key below:
    // re-solving without a real change cannot produce a different answer.
    //
    // Outwards, never inwards, so a snapped obstacle is never smaller than the
    // panel it stands for. The intent slab gets a coarser quantum because it is
    // the only input that moves *every frame*.
    const input = {
      // `.ig-cmd-stack` and the breadcrumb, **not** `.ffx-cmd-area`'s union
      // with the help slab. The union's top edge was the slab's — y 131 in
      // every state — so every box above the party was measured down to a line
      // 35 grid px lower than the command window really reaches, and Chapter
      // 1's open band came out 24 grid px tall. The slab is its own rect below.
      cmdArea: growToGrid(this.stageRect(this.commandMenu.stackEl), 1) ?? {
        left: 30,
        top: 205,
        right: 211,
        bottom: 334,
      },
      // The slab's **reserved slot**, not its measured box, and never `null`:
      // it is up on every decision, it is 29 grid px at its tallest, and a box
      // solved while it happened to be empty would be taken away on the next
      // keystroke. See `CMD_INFO_TOP`.
      cmdInfo: { ...CMD_INFO_SLOT },
      partyStatus:
        growToGrid(this.stageRect(this.partyStatus.el), 1) ?? { left: 403, top: 258, right: 617, bottom: 348 },
      guide: growToGrid(this.stageRect(this.el.querySelector<HTMLElement>('.sgd__panel')), 1),
      sensor: growToGrid(this.stageRect(this.sensorPanel.el), 1),
      intent: growToGrid(this.stageRect(this.intent.el.querySelector<HTMLElement>('.eint__panel')), 4),
      intentChip: growToGrid(this.stageRect(this.intent.el.querySelector<HTMLElement>('.eint__toggle')), 4),
      ctb: growToGrid(this.stageRect(this.ctbList.el), 1),
      // Coarser again: the cast is the one input that moves on *every* frame
      // and is never a reason to re-solve, so its snap has to be wide enough
      // that an idle cycle cannot change it even when a panel opening does
      // force a fresh solve mid-decision.
      sprites: this.partySpriteRects().map((r) => growToGrid(r, 4)!),
      // **The bosses.** Absent from this input for two rounds, which is why the
      // card was printed 773 grid px² deep into Seymour Flux and 1 626 into
      // Braska's Final Aeon: the only fighters the solver had ever been told
      // about were the party's.
      enemies: this.enemySpriteRects().map((r) => growToGrid(r, 4)!),
    };
    const key = [
      this.advisorDecisionSeq,
      this.hudScale().toFixed(3),
      rectKey(input.cmdArea),
      rectKey(input.cmdInfo),
      rectKey(input.partyStatus),
      rectKey(input.guide),
      rectKey(input.sensor),
      rectKey(input.intent),
      rectKey(input.intentChip),
      rectKey(input.ctb),
      // The cast's *positions* are deliberately absent — see below. Their
      // number is not: a KO or a switch changes it, and both are worth a fresh
      // solve on the frame they land.
      input.sprites.length,
      input.enemies.length,
    ].join('|');

    const held = this.heldAdvisor;
    if (held && held.key === key) return held;

    // **Free placement is chosen once per decision, never per frame.** The key
    // above already holds one *zone* still for a decision, but a submenu opening
    // or the Sensor card arriving legitimately changes it, and without this the
    // card could cross between a measured zone and its own placement — two
    // different widths and two different lefts — while the player was reading
    // it. Once a decision has failed to find a zone it stays on the free
    // placement until the next decision opens, which is where room that has
    // genuinely come back is picked up.
    const zone = this.advisorFreeSeq === this.advisorDecisionSeq ? null : advisorZone(input);
    if (!zone) this.advisorFreeSeq = this.advisorDecisionSeq;
    const solved: HeldAdvisorPlacement = {
      key,
      zone,
      chipDock: zone ? null : advisorChipDock(input),
    };
    this.heldAdvisor = solved;
    return solved;
  }

  /** Where the `N BEST MOVE` chip parks while the card is declined, or `null`. */
  private get heldAdvisorChipDock(): { left: number; bottom: number } | null {
    return this.heldAdvisor?.chipDock ?? null;
  }

  /** The advisor's held placement, for tests, the e2e harness and the debug snapshot. */
  get advisorPlacement(): AdvisorZone | null {
    return this.heldAdvisor?.zone ?? null;
  }

  /**
   * **Any** element's box in the stage's own 640x360 grid px.
   *
   * Every rect the advisor's solver is given goes through this, and it is not
   * a stylistic preference: {@link gridRect} reads `offsetLeft`/`offsetTop`,
   * which are relative to the element's **offset parent**, so it is only
   * correct for a direct child of the scaled stage. The moment the command
   * stack was handed over on its own rather than inside `.ffx-cmd-area` — which
   * is `position: absolute` and therefore its children's offset parent — it
   * started reporting a box at the stage's top-left corner, roughly
   * x 0..188 / y 0..168, and that phantom rect sat across the exact band
   * Chapter 1's card had just been given. The first browser pass after the
   * rewrite caught it: all three chapters fell back to the 86px compact card
   * with a 150px box free beside them.
   *
   * `getBoundingClientRect` is in viewport px for everything, so one division
   * through the letterbox answers for a stage child, an overlay child and the
   * enemy-intent slab alike.
   */
  private stageRect(el: HTMLElement | null): Rect | null {
    if (!el) return null;
    const b = el.getBoundingClientRect();
    if (b.width <= 0 || b.height <= 0) return null;
    const scale = this.hudScale();
    if (!scale) return null;
    const host = this.el.getBoundingClientRect();
    const ox = host.left + (host.width - STAGE.width * scale) / 2;
    const oy = host.top + (host.height - STAGE.height * scale) / 2;
    return {
      left: (b.left - ox) / scale,
      top: (b.top - oy) / scale,
      right: (b.right - ox) / scale,
      bottom: (b.bottom - oy) / scale,
    };
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
    return this.spriteRects(this.lastState?.activeIds ?? []);
  }

  /**
   * Every **living enemy**'s sprite, as a grid-space rect.
   *
   * A boss is as much of the fight as a party member is, and for two rounds
   * `hudSafeZones.ts` was never told one was there: the card's bottom-right
   * pocket ran from the party's right edge to the party-status column, which in
   * all three chapters is straight through the boss. A dead enemy is skipped
   * because its quad is already leaving the field.
   */
  private enemySpriteRects(): Rect[] {
    const state = this.lastState;
    if (!state) return [];
    return this.spriteRects(state.enemyIds.filter((id) => state.combatants[id]?.alive !== false));
  }

  /** The shared half of {@link partySpriteRects} and {@link enemySpriteRects}. */
  private spriteRects(ids: readonly CombatantId[]): Rect[] {
    if (!this.lastState) return [];
    const scale = this.hudScale();
    if (!scale) return [];
    const host = this.el.getBoundingClientRect();
    const ox = host.left + (host.width - STAGE.width * scale) / 2;
    const oy = host.top + (host.height - STAGE.height * scale) / 2;
    const out: Rect[] = [];
    for (const id of ids) {
      const head = this.project(id, 'head');
      const feet = this.project(id, 'feet');
      if (!head || !feet) continue;
      const headY = (head.y - oy) / scale;
      const feetY = (feet.y - oy) / scale;
      const cx = (head.x - ox) / scale;
      const span = Math.abs(feetY - headY);
      const half = span * SPRITE_HALF_WIDTH_RATIO;
      // The head anchor is on the figure's head, not on the top of the painted
      // quad — there is hair, a weapon and an aura above it. `top` is lifted by
      // the measured margin so the rect covers what the player actually sees.
      const top = Math.min(headY, feetY) - span * SPRITE_TOP_MARGIN_RATIO;
      const bottom = Math.max(headY, feetY) + span * SPRITE_FOOT_MARGIN_RATIO;
      out.push({ left: cx - half, right: cx + half, top, bottom });
    }
    return out;
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
      // The reticles. Round 02 #14's repro at 1000x562 had *both* of them
      // entirely inside the slab. Listing their boxes moves the slab and
      // changes nothing about how a reticle is drawn or aimed, which is issue
      // #08/#13's track, not this one.
      '.ig-reticle',
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
    out.push(...this.fighterViewportRects());
    return out;
  }

  /**
   * Every fighter on the field, as a viewport-pixel rectangle.
   *
   * **This list is the whole of round 02 #14.** `avoid` named HUD panels and
   * nothing else, so a slab that had dodged the CTB queue and the command stack
   * was free to sit on the encounter: measured live at 1000x562 the Chapter 1
   * slab held x 532–766, y 6–269, with Seymour Flux, the Mortiorchis *and* both
   * target reticles entirely behind it. CHK-008 asked for exactly this and it
   * had never been done.
   *
   * Enemies as well as party, because both halves of that measurement are the
   * fight. Reconstructed from the projector's head/feet points by the same
   * three measured ratios {@link partySpriteRects} uses — that method answers in
   * grid px for the advisor's arithmetic, and the slab lives on the unscaled
   * overlay, so this one stays in viewport px rather than converting twice.
   *
   * **The slab's own subject is a special case, and has to be.** The panel
   * hangs over that enemy's head with a tail pointing at it — that relationship
   * *is* the answer to "whose turn", and a rect that reached above the head
   * point would push the slab off the boss on every frame and delete the one
   * thing the design is for. So the anchor enemy contributes its body from the
   * head point **down**: air above the head stays legal, and a slab that has
   * been clamped down onto the boss's chest is moved, which is the case #14
   * actually measured.
   *
   * Snapped outwards to 4px. The slab re-lays out every frame and a sprite's
   * idle cycle breathes a pixel either way; without the snap a fighter's edge
   * crosses the dodge threshold several times a second and the slab twitches.
   */
  private fighterViewportRects(): Array<{ left: number; top: number; right: number; bottom: number }> {
    const state = this.lastState;
    if (!state) return [];
    const out: Array<{ left: number; top: number; right: number; bottom: number }> = [];
    const anchorId = this.intent.view()?.enemyId ?? null;
    const ids = [...state.activeIds, ...state.enemyIds];
    for (const id of ids) {
      const c = state.combatants[id];
      if (c && !c.alive) continue;
      const head = this.project(id, 'head');
      const feet = this.project(id, 'feet');
      if (!head || !feet) continue;
      const span = Math.abs(feet.y - head.y);
      if (span <= 0) continue;
      const half = span * SPRITE_HALF_WIDTH_RATIO;
      const top =
        id === anchorId ? Math.min(head.y, feet.y) : Math.min(head.y, feet.y) - span * SPRITE_TOP_MARGIN_RATIO;
      const bottom = Math.max(head.y, feet.y) + span * SPRITE_FOOT_MARGIN_RATIO;
      out.push({
        left: Math.floor((head.x - half) / 4) * 4,
        right: Math.ceil((head.x + half) / 4) * 4,
        top: Math.floor(top / 4) * 4,
        bottom: Math.ceil(bottom / 4) * 4,
      });
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
   *
   * **The queue is not always laid out, and that is when the chip used to land
   * on the boss.** Between one decision and the next — while an action plays
   * out — the command stack, the guide rail, the advisor card *and* the CTB
   * list are all down; the chip is the only thing left on the field, and with
   * nothing to measure this returned `null` and `EnemyIntent.layout` fell back
   * to the head anchor. The round-03 browser matrix caught it in exactly one
   * state of thirteen, in chapters 2 and 3, at 2 442 grid px² of Yunalesca and
   * of Braska's Final Aeon — which is Bailey's own report that "the E ENEMY
   * MOVE chip floats over the boss art", surviving in the one state nobody
   * screenshots. So the fallback is the queue's **authored** rail rather than
   * no answer: `docs/ENGINE-API.md#hud-safe-area` fixes its right edge at
   * 0.970 of the frame and its top at 0.138, which is where the queue will be
   * when it comes back anyway.
   */
  private intentChipDock(): { x: number; y: number } | null {
    return intentChipDockAt(this.ctbList.el.getBoundingClientRect(), this.el.getBoundingClientRect(), this.hudScale());
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
