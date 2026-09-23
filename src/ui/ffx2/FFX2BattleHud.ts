import '../inkgold/index.ts';
// `theme.css` defines every `--x2-*` token on `:root` and, until this line, was
// imported by `PartyPrep.ts` **and nothing else** — so a battle entered with
// `skipPrep` (every automated capture, and the chapter flow's own fast path)
// mounted this HUD with all twelve tokens undefined. `var(--x2-atb-track)` and
// `linear-gradient(90deg, var(--x2-atb-lo), var(--x2-atb-hi))` then resolved to
// nothing at all, which is exactly what "the boss HP is an unstyled pink bar"
// and the chip-less status glyphs were: the *only* thing still painting on the
// enemy track was the fill's `inset -1px 0 0 #fff` leading edge, a white tick
// floating on a transparent bar. Load the tokens with the HUD that needs them.
import './theme.css';
import './ffx2-hud.css';
import { installInkGoldStyles } from '../inkgold/index.ts';
import type { HudPort, TargetingPort } from '../../engine/HudPort.ts';
import type {
  AtbSnapshot,
  AvailableCommand,
  BattleEvent,
  BattleState,
  Command,
  CombatantId,
  GateColour,
  AnyCombatant,
  FFX2Combatant,
  MinigameKind,
  MinigameResult,
  TurnPreview,
} from '../../battle/common/types.ts';
import { openCommandMenu } from './CommandMenu.ts';
import { DEFAULT_ATB_MODE, type AtbMode } from '../../battle/ffx2/active.ts';
import type { CursorSelection } from '../ffx/TargetCursor.ts';
import { accentFor } from '../../engine/TargetHighlight.ts';
import { mountTriggerHappy } from './TriggerHappy.ts';
import { mountLadyLuckReels } from './LadyLuckReels.ts';
import { partyRowHtml } from './PartyRows.ts';
import { enemyGaugesHtml, type ChargePip } from './BossGauges.ts';
import { DamageLayer } from './DamageLayer.ts';
import { playSpherechangeFlourish } from './SpherechangeFlourish.ts';
import { ChainCounter } from './ChainCounter.ts';
import { ffx2EngineOptions } from '../../app/screens/BattleScreenContent.ts';
import { MoveAdvisor } from '../common/MoveAdvisor.ts';
import { StrategyGuide } from '../common/StrategyGuide.ts';
import { EnemyIntentPanel, type IntentSource } from '../common/EnemyIntent.ts';
import { solidPanelRects } from '../common/panel-rects.ts';
import { placeSlab, steerRects, type SlabRect } from './intentPlacement.ts';
import { solveAdvisorLane, type LaneFigure } from './advisorLane.ts';
import { battleHelpOn } from '../coach/coachState.ts';

/**
 * The FFX-2 battle HUD.
 *
 * Composes the shared Ink & Gold layer (`src/ui/inkgold/`) in its pink
 * `.ig--ffx2` variant, matching `docs/handoff/ink-and-gold/BattleFfx2.dc.html`
 * (the approved round-2 mock, `docs/screenshots/mockups/A-ffx2-battle.jpg`):
 * `.ig-stat-list`/`.ig-stat` for the party, the dressphere monogram as
 * `.ig-stat__sphere`, `.ig-bosshp` for enemy HP (built out into a real strip by
 * `BossGauges.ts`), `.ig-banner` (right-anchored) for the telegraph,
 * `.ig-cmd-stack` (via `CommandMenu.ts`) for commands, `.ig-reticle` for
 * targeting, and a standalone chip for the mock's "CHAIN ×4" tag.
 *
 * Two departures from the mock, both forced by this game's *actual* staging and
 * both documented in `docs/handoff/polish-ffx2-battle.md`:
 *
 * 1. **The party panel is anchored bottom-right, not bottom-left.** The mock
 *    stands the three girls centre-right and puts their rows in the empty
 *    bottom-left; our scenes stand them in the FFX arc, lower-left, so the
 *    mirrored panel landed squarely on top of them. The panel moved rather than
 *    the formation — `research/visual-bible.md` §4.1's own FFX-2 screen map
 *    puts party status on the right (`x276 y278`) anyway.
 * 2. **This HUD draws damage numerals.** Decision 11 in `CONTRACT-CHANGES.md`
 *    gives the figure to the presenter, but the presenter is only handed a
 *    `DamageNumbersPort` when `ui/common` has registered a factory or when
 *    there is no HUD at all, and nothing registers one — so FFX-2 battles drew
 *    no numbers whatsoever. `DamageLayer.ts` mounts the shared
 *    `src/ui/common/DamageNumbers.ts` here, exactly as `FFXBattleHud` mounts
 *    its own. Nothing draws twice: the port stays `null` on this side.
 *
 * `required`-proportional ATB track width (visual-bible §4.3 / CONTRACTS.md)
 * survives all of it — see `PartyRows.ts`.
 */

const TELEGRAPH_HOLD_MS = 2400;

/** How often the HUD re-measures its own panels for the field, in ms. */
const PANEL_PUBLISH_MS = 250;

/** One rectangle the intent slab must not cover. */
type IntentAvoidRect = SlabRect;

/**
 * A fighter's body half-width as a fraction of its projected height. See
 * `fighterBoxes` for why this is a ratio and not a measurement.
 */
const BODY_HALF_WIDTH = 0.28;

/**
 * `EnemyIntent.ts`'s own placement constants, mirrored so the slab's natural
 * position can be reproduced here before it is solved for. They are grid px and
 * scale with the letterbox, exactly as they do there.
 */
const INTENT_HEAD_GAP = 10;
const INTENT_EDGE_MARGIN = 4;
const INTENT_FALLBACK_W = 150;
const INTENT_FALLBACK_H = 40;

/** The guide rail's own column in stage px (`strategy-guide.css`: left 21.33, width 132). */
const GUIDE_RAIL_LEFT = 21.33;
const GUIDE_RAIL_RIGHT = GUIDE_RAIL_LEFT + 132;
/** Mirrors the `anchors` below, so the fences fall back to exactly what the anchors would have done. */
const GUIDE_FALLBACK_BOTTOM = 104;
const ADVISOR_FALLBACK_LEFT = 160;
const ADVISOR_BOTTOM = 26;

/**
 * `tan(12deg)` — the house slab skew (`--ig-skew`, flipped to +12deg for
 * FFX-2). A skewed box paints `height / 2 * this` further out than its layout
 * box on each side, and every anchor in `MoveAdvisor` / `StrategyGuide` is a
 * *layout* offset, so anything that has to clear a painted edge has to add it
 * back by hand.
 */
const SKEW_TANGENT = Math.tan((12 * Math.PI) / 180);

function isAtbSnapshot(p: TurnPreview[] | AtbSnapshot): p is AtbSnapshot {
  return !Array.isArray(p);
}

function isFfx2(c: AnyCombatant | undefined): c is FFX2Combatant {
  return !!c && 'atb' in c;
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
  /** PR-0012: the highlighted row's help sentence — FFX's slab design, `battleHelpOn()`-gated. */
  private commandInfoEl!: HTMLElement;
  private minigameEl!: HTMLElement;
  /** FFX-2's Active/Wait chip, shown while a target cursor is live. */
  private activeWaitEl: HTMLElement | null = null;
  /**
   * Which ATB mode the fight is in (FFX-2 Config, §1.5). The presenter says
   * so through {@link setAtbMode} at every menu and every pause flip; until
   * then it is the default, Wait (Bailey, D-029). It used to be hardcoded
   * `'active'`, which put "ACTIVE — ATB RUNNING" over a held clock.
   */
  private atbMode: AtbMode = DEFAULT_ATB_MODE;
  /** Tears the open command menu down from outside. Active ATB only. */
  private closeMenu: (() => void) | null = null;
  /** The painted field's targeting surface, when there is a field. */
  private targeting: TargetingPort | null = null;
  /** Countdown to the next panel re-measure, so `visibleInFrame` never goes stale. */
  private panelPublishMs = 0;
  private mounted = false;

  private project: (
    id: CombatantId,
    anchor?: 'head' | 'chest' | 'feet',
  ) => { x: number; y: number } | null = () => null;
  private lastState: BattleState | null = null;
  private lastSnapshot: AtbSnapshot | null = null;
  /** The actor whose command menu is currently open, if any — drives `.ig-stat--acting`. */
  private actingId: CombatantId | null = null;
  private readonly chargeStages = new Map<CombatantId, ChargePip>();
  /**
   * Enemies whose HP numerals Sensor/Scan has revealed. FFX-2 keeps an enemy's
   * HP a secret until it is scanned, so the boss strip prints a `SCAN` hint
   * until the id lands in here.
   */
  private readonly revealed = new Set<CombatantId>();
  private readonly damage = new DamageLayer();
  /**
   * The optional strategy guide (`src/ui/common/StrategyGuide.ts`).
   *
   * Left rail here too, not a mirror of FFX's. FFX-2 anchors its command stack
   * bottom-**right** and its telegraph banner top-right, so the right edge is
   * the one edge the panel may not take; the left holds the boss gauge strip at
   * the top and the party column at the bottom, with the whole middle free.
   * Both anchors resolve per frame because the gauge strip grows a block per
   * living enemy (`BossGauges.ts`) and the party column re-renders every ATB
   * tick. The accent still flips to pyre pink — `game: 'ffx2'` puts `.sgd--ffx2`
   * on the rail and it inherits `--ig-accent` from the `.ig--ffx2` root.
   */
  private readonly guide = new StrategyGuide({
    game: 'ffx2',
    anchors: {
      below: () => this.enemyEl ?? null,
      // The girls, not the party column: the rail runs down the left edge and
      // the column is bottom-*right*, so the thing actually under the rail is
      // Yuna. `fenceTopEl` is a 1px marker this HUD parks on the topmost party
      // fighter's head every frame (see `layoutFences`), so the rail stops
      // above her instead of being drawn across her face. It falls back to the
      // fixed `bottom` whenever nothing is projected yet.
      above: () => this.fenceTopEl ?? null,
      top: 44,
      bottom: 104,
    },
  });
  /**
   * The enemy-intent slab (`src/ui/common/EnemyIntent.ts`).
   *
   * On the overlay, like the numerals, because it is pinned to a projected
   * actor position. `avoid` names the boss-gauge strip and the party column —
   * FFX-2's equivalents of the FFX queue: the strip is what the slab's "acts
   * next" claim is read against, and the party rows are where the damage
   * figures land.
   */
  private readonly intent = new EnemyIntentPanel({ game: 'ffx2' });
  /**
   * The optional move advisor (`src/ui/common/MoveAdvisor.ts`).
   *
   * The same bottom band as FFX's, but this HUD is **not** the mirror the
   * shared `.ig--ffx2 .ig-stat-list` rule would suggest: measured live, its
   * party column sits at left 464 and its command stack at 477 — *both* on the
   * right, with the boss gauge strip top-left and the guide rail running down
   * the left to y 255. So the free band here is the bottom-left/centre, and the
   * card has one wall rather than two: it starts clear of the guide rail (which
   * ends at x 153) and stops before the party column.
   *
   * The wall is resolved per frame all the same, because the column re-renders
   * every ATB tick, and `MoveAdvisor.layout` gates it on `offsetWidth > 0` so a
   * not-yet-laid-out element is treated as no edge at all.
   *
   * The simulator is handed the registries the live engine was built with
   * (`ffx2EngineOptions()`), because X-2 takes its ability and item tables by
   * injection — with the engine's baseline fallback alone the card would price
   * every dressphere skill as "unknown".
   */
  private readonly advisor = new MoveAdvisor({
    game: 'ffx2',
    anchors: {
      // `fenceColumnEl`, not `partyEl`: the rows cascade *out* of their own
      // container (`PartyRows` steps each one left with a `margin-right`, which
      // is outside the border box), so the third row's left edge sits a few px
      // left of `.ffx2hud__party`'s — and that sliver is what the card's right
      // edge was landing on. The fence tracks the leftmost row instead.
      before: () => this.fenceColumnEl ?? this.partyEl ?? null,
      // `fenceRightEl` is parked just past the rightmost girl standing in the
      // card's own band every frame (`layoutFences`), so the card starts clear
      // of the formation rather than on top of Yuna and Rikku. `left` is the
      // fallback for a frame with nothing projected yet.
      after: () => this.fenceRightEl ?? null,
      left: 160,
      right: 458,
      bottom: 26,
      // The rows are the hard wall: a band too narrow for the card slides it
      // back over the girls, never onto the HP rows (PR-0091).
      wall: 'before',
    },
    advisor: () => {
      const options = ffx2EngineOptions();
      return {
        ffx2: {
          ...(options.abilities ? { abilities: options.abilities } : {}),
          ...(options.items ? { items: options.items } : {}),
        },
      };
    },
  });
  /** §4.6's chain counter, drawn on the overlay (`ChainCounter.ts`). */
  private readonly chain = new ChainCounter({
    overlay: () => this.overlay,
    scale: () => this.stageScale,
    point: (id) => this.overlayPoint(id, 0.4, 0.22),
    // The same board the intent slab steers around, minus the chip itself —
    // it must not dodge its own previous rectangle.
    obstacles: () => this.chainObstacles(),
    layer: () => {
      const r = this.overlay?.getBoundingClientRect();
      return r && r.width > 0 ? { width: r.width, height: r.height } : { width: window.innerWidth, height: window.innerHeight };
    },
  });
  private telegraphHideTimer = 0;
  private damageFlashTimer = 0;
  /** Current `.ffx2hud__stage` letterbox scale, so overlay-space offsets (chain chip) stay proportional at any viewport size. */
  private stageScale = 1;
  /** Letterbox offset of the stage inside the HUD, in viewport px (`layout`). */
  private stageX = 0;
  private stageY = 0;
  /** 1px layout markers the guide rail and advisor card are anchored to; see `layoutFences`. */
  private fenceTopEl: HTMLElement | null = null;
  private fenceRightEl: HTMLElement | null = null;
  private fenceColumnEl: HTMLElement | null = null;
  /** The card's `max-height` from `advisorLane.ts` for the open decision; only tightens until the next one. */
  private advisorCap: number | null = null;
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
      <div class="ig-cutin__info ffx2-cmd-info" hidden><div class="ig-cutin__info-desc" data-role="text"></div></div>
      <div class="ffx2hud__minigame"></div>
      <div class="ffx2-atbmode" hidden></div>
      <i class="ffx2hud__fence" data-fence="party-top"></i>
      <i class="ffx2hud__fence" data-fence="party-right"></i>
      <i class="ffx2hud__fence" data-fence="party-column"></i>
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
    this.commandInfoEl = this.stage.querySelector('.ffx2-cmd-info') as HTMLElement;
    this.minigameEl = this.stage.querySelector('.ffx2hud__minigame') as HTMLElement;
    // FFX-2 ONLY: the Active/Wait chip. FFX's CTB has no such Config entry.
    this.activeWaitEl = this.stage.querySelector('.ffx2-atbmode');
    this.fenceTopEl = this.stage.querySelector('[data-fence="party-top"]');
    this.fenceRightEl = this.stage.querySelector('[data-fence="party-right"]');
    this.fenceColumnEl = this.stage.querySelector('[data-fence="party-column"]');

    // Numerals live on the unscaled overlay, not the 640x360 stage: their
    // positions come straight from the presenter's projector in real pixels,
    // with §3.6's grid-quoted glyph sizes multiplied back up by the same
    // letterbox scale `layout()` applies to the stage.
    this.damage.mount(this.overlay, { host: this.el, scale: () => this.stageScale });
    // Into the scaled stage, so the rail letterboxes with the rest of the
    // chrome and its anchors' `offsetTop` are in the same 640x360 grid.
    this.guide.mount(this.stage);
    this.advisor.mount(this.stage);
    this.intent.mount(this.overlay, {
      host: this.el,
      scale: () => this.stageScale,
      project: (id, anchor) => this.project(id, anchor),
      avoid: () => this.intentAvoidRects(),
    });

    this.mounted = true;
    this.layout();
    window.addEventListener('resize', this.onResize, { passive: true });
  }

  unmount(): void {
    if (!this.mounted) return;
    window.removeEventListener('resize', this.onResize);
    this.chain.dispose();
    window.clearTimeout(this.telegraphHideTimer);
    window.clearTimeout(this.damageFlashTimer);
    this.damage.unmount();
    this.guide.unmount();
    this.advisor.unmount();
    this.intent.unmount();
    // Nothing the cursor lit may outlive the HUD that lit it.
    this.applySelection(null);
    this.el.remove();
    this.mounted = false;
  }

  /** Per-frame tick from `BattleScreen`, so numerals freeze with the game loop. */
  update(dt: number): void {
    this.layoutFences();
    this.damage.update(dt);
    this.guide.update(dt);
    this.advisor.update(dt);
    this.intent.update(dt);
    // GAME-AWARE (rule 14): the same shared plumbing FFX got. Panels were
    // published only on an engine sync, so between two syncs the field's idea
    // of where the chrome sits went stale and `visibleInFrame` lied.
    this.panelPublishMs -= dt * 1000;
    if (this.targeting && this.panelPublishMs <= 0) {
      this.panelPublishMs = PANEL_PUBLISH_MS;
      this.targeting.setPanels(this.panelRects());
    }
  }

  /** The guide rail, for tests and the debug snapshot. */
  get strategyGuide(): StrategyGuide {
    return this.guide;
  }

  /** The move-advisor card, for tests and the debug snapshot. */
  get moveAdvisor(): MoveAdvisor {
    return this.advisor;
  }

  /** Hand the panel its engine. See `EnemyIntent.attachEnemyIntent`. */
  setIntentSource(source: IntentSource | null): void {
    this.intent.setSource(source);
  }

  /**
   * Hide the intent slab while the pause screen is up, and restore it exactly
   * as it was on resume. See `EnemyIntent.setIntentSuspended` /
   * `EnemyIntentPanel.setSuspended` (PR-0122).
   */
  setIntentSuspended(suspended: boolean): void {
    this.intent.setSuspended(suspended);
  }

  /** The intent slab, for tests and the debug snapshot. */
  get enemyIntent(): EnemyIntentPanel {
    return this.intent;
  }

  /**
   * What the intent slab may not cover, in viewport pixels: the HUD's own
   * panels, and the fighters themselves.
   *
   * The fighters are here because the slab hangs `HEAD_GAP` above the acting
   * enemy's head and is then *clamped into the layer* — and Bahamut's head is
   * near the top of the frame, so the clamp pushed a 150x98 slab straight down
   * onto his wings. It is his own painting the slab is talking about; sitting
   * on it is exactly the complaint the FFX side logged about its chip.
   *
   * What goes out, though, is **not** this list. `EnemyIntentPanel.layout`
   * dodges each rectangle it is given in turn and never re-checks, which on a
   * board with nine obstacles ping-pongs the slab between the boss and the
   * gauge strip and finally drops it on the move advisor. So the list is solved
   * here instead — {@link placeSlab} finds the free spot nearest where the slab
   * wants to be — and {@link steerRects} hands back the one or two rectangles
   * whose single greedy pass lands on that spot. `intentPlacement.ts` has the
   * full account, including why merging the obstacles does not work.
   *
   * Anything this cannot reproduce — no projection for the acting enemy yet, no
   * laid-out overlay, no view — falls back to handing over the raw obstacles,
   * i.e. exactly the behaviour before any of this.
   */
  private intentAvoidRects(): IntentAvoidRect[] {
    const obstacles = this.intentObstacles();
    const solved = this.solveIntentPlacement(obstacles);
    return solved ?? obstacles;
  }

  /** Every box on the board the slab would rather not cover, in viewport px. */
  private intentObstacles(opts: { skipChainChip?: boolean; addIntentPanel?: boolean } = {}): IntentAvoidRect[] {
    const out: IntentAvoidRect[] = [];
    const selectors = [
      '.ffx2hud__enemies',
      '.ffx2hud__party',
      '.ffx2hud__command',
      '.ffx2hud__telegraph',
      '.mad__card',
      '.mad__toggle',
      '.sgd__panel',
      '.sgd__toggle',
      '.ffx2-chain-chip',
      // Not `.ffx2sc`: the spherechange wheel is a modal sized to the whole
      // overlay, so listing it would make every placement "covered" and send
      // the solver hunting for a spot that does not exist. It is *meant* to be
      // over the slab, and it takes input while it is up.
    ] as const;
    const all = opts.addIntentPanel ? [...selectors, '.eint__panel', '.eint__toggle'] : selectors;
    for (const selector of all) {
      if (opts.skipChainChip && selector === '.ffx2-chain-chip') continue;
      for (const el of this.el.querySelectorAll<HTMLElement>(selector)) {
        // Size alone: a zero-size box already means "not laid out", and it
        // covers `[hidden]` (forced to `display: none` by `tokens.css`) and a
        // hidden ancestor too. See the FFX twin.
        const r = el.getBoundingClientRect();
        if (r.width <= 0 || r.height <= 0) continue;
        out.push({ left: r.left, top: r.top, right: r.right, bottom: r.bottom });
      }
    }
    for (const box of this.fighterBoxes()) out.push(box);
    return out;
  }

  /**
   * The board the chain counter has to stay off.
   *
   * The same list the intent slab steers around, **plus the intent slab
   * itself** — that list exists to place the slab, so it necessarily leaves the
   * slab out — and **minus the chain chip**, which must not dodge its own
   * previous rectangle. The slab is standing furniture and the chip is a 1.4 s
   * transient, so the chip is the one that moves.
   */
  private chainObstacles(): IntentAvoidRect[] {
    return this.intentObstacles({ skipChainChip: true, addIntentPanel: true });
  }

  /**
   * Reproduce the slab's natural position, solve for a free one, and express
   * the answer as avoid rectangles. `null` means "cannot reproduce it".
   *
   * The first two steps of `EnemyIntent.layout` are copied exactly — project
   * the acting enemy's head, hang the box `HEAD_GAP` above it, clamp into the
   * overlay — so the natural position computed here is the one that pass is
   * about to compute for itself. Only the third step, the dodge, is replaced.
   */
  private solveIntentPlacement(obstacles: IntentAvoidRect[]): IntentAvoidRect[] | null {
    const view = this.intent.view();
    if (!view) return null;
    const layer = this.overlay.getBoundingClientRect();
    if (layer.width <= 0 || layer.height <= 0) return null;
    const head = this.project(view.enemyId, 'head');
    if (!head) return null;

    const scale = this.stageScale || 1;
    const chip = this.el.querySelector<HTMLElement>('.eint__toggle');
    const box = this.intent.isVisible ? this.el.querySelector<HTMLElement>('.eint__panel') : chip;
    const rect = box?.getBoundingClientRect();
    const w = rect?.width || INTENT_FALLBACK_W * scale;
    const h = rect?.height || INTENT_FALLBACK_H * scale;
    // The chip rides the panel's top-right corner and is clamped into the
    // frame, so a slab flush with the top edge wears its own `E HIDE` across
    // its first line. Reserve the chip's band while the panel is up.
    const headroom = this.intent.isVisible ? (chip?.getBoundingClientRect().height ?? 8 * scale) + scale : 0;

    const edge = INTENT_EDGE_MARGIN * scale;
    const cx = head.x - layer.left;
    const cy = head.y - layer.top;
    const natural = { left: cx - w / 2, top: cy - INTENT_HEAD_GAP * scale - h };

    const local = obstacles.map((o) => ({
      left: o.left - layer.left,
      top: o.top - layer.top,
      right: o.right - layer.left,
      bottom: o.bottom - layer.top,
    }));
    const target = placeSlab(natural, { w, h }, local, { width: layer.width, height: layer.height }, edge, headroom);
    const clampedNatural = {
      left: Math.max(edge, Math.min(Math.max(edge, layer.width - w - edge), natural.left)),
      top: Math.max(edge, Math.min(Math.max(edge, layer.height - h - edge), natural.top)),
    };
    return steerRects(clampedNatural, target, { w, h }, { width: layer.width, height: layer.height }).map((r) => ({
      left: r.left + layer.left,
      top: r.top + layer.top,
      right: r.right + layer.left,
      bottom: r.bottom + layer.top,
    }));
  }

  /**
   * Every living fighter's body box, in viewport pixels.
   *
   * There are no sprite bounds to ask for — `PaintedStage.snapshot()` reports
   * poses, not extents — so a box is the projected head-to-feet span with a
   * half-width of {@link BODY_HALF_WIDTH} of that height. That is about right
   * for the girls and deliberately narrow for a spread dragon: a box that
   * claimed Bahamut's whole wingspan would leave the slab nowhere to stand.
   */
  private fighterBoxes(): IntentAvoidRect[] {
    const state = this.lastState;
    if (!state) return [];
    const out: IntentAvoidRect[] = [];
    for (const id of Object.keys(state.combatants)) {
      const c = state.combatants[id];
      if (!c || c.hp <= 0) continue;
      const head = this.project(id, 'head');
      const feet = this.project(id, 'feet');
      if (!head || !feet) continue;
      const height = Math.abs(feet.y - head.y);
      if (height <= 0) continue;
      const half = height * BODY_HALF_WIDTH;
      out.push({
        left: head.x - half,
        right: head.x + half,
        top: Math.min(head.y, feet.y),
        bottom: Math.max(head.y, feet.y),
      });
    }
    return out;
  }

  /**
   * Park the three layout fences, in stage coordinates.
   *
   * The girls are drawn by the 3D stage, not the HUD, so nothing in the DOM
   * says where they are — and where they are *moves with the viewport's
   * aspect*: the scene renders to the whole window while this chrome is
   * letterboxed into 640x360, so at 2000x1000 the formation sits further out
   * in stage space than it does at 1280x720. A fixed anchor number is right at
   * one aspect and wrong at the next, which is why these are measured every
   * frame and handed to the guide rail and the advisor card as ordinary
   * anchors (`StrategyGuideAnchors.above`, `MoveAdvisorAnchors.after`).
   *
   * Each fence only moves for a fighter that is actually in that panel's way:
   * the rail's fence tracks the girls standing in the rail's own column, the
   * card's fence the girls standing in the card's own band. With nobody in the
   * way both fall back to where they were before any of this, so a formation
   * that leaves the chrome alone gets the full-length rail and the full-width
   * card.
   *
   * The third fence is not about the girls at all: it marks the **leftmost
   * edge of the party column**, which is not `.ffx2hud__party`'s own left edge
   * because `PartyRows` cascades the rows out of their container with a
   * `margin-right` step. The card's right wall is that fence, so the card stops
   * before Paine's row rather than before the container her row pokes out of.
   */
  private layoutFences(): void {
    const top = this.fenceTopEl;
    const right = this.fenceRightEl;
    if (!top || !right) return;
    const wall = this.layoutColumnFence();
    const rect = this.el.getBoundingClientRect();
    const scale = this.stageScale || 1;
    const toStage = (p: { x: number; y: number }): { x: number; y: number } => ({
      x: (p.x - rect.left - this.stageX) / scale,
      y: (p.y - rect.top - this.stageY) / scale,
    });

    const card = this.stage.querySelector<HTMLElement>('.mad__card');
    // The card's **and its chip's** band. `MoveAdvisor` parks the `A HIDE`
    // toggle on the card's top-left corner, above the card's own box, so a girl
    // standing in that strip is not in the card's band by the card's height
    // alone — and at 1280x720 that is exactly where Paine stands, wearing 52x15
    // of the chip. The lean comes in for the same reason it does in
    // `layoutColumnFence`: the house `skewX` paints the card's bottom-left
    // corner further left than its layout box, and the fence is a layout offset.
    const chip = this.stage.querySelector<HTMLElement>('.mad__toggle');
    const cardH = card && card.offsetHeight > 0 ? card.offsetHeight : 58;
    const chipH = chip && chip.offsetHeight > 0 ? chip.offsetHeight : 0;
    const cardLean = (cardH / 2) * SKEW_TANGENT;

    let fenceTop = 360 - GUIDE_FALLBACK_BOTTOM;
    const figures: LaneFigure[] = [];
    const state = this.lastState;
    for (const id of state?.activeIds ?? []) {
      const c = state?.combatants[id];
      if (!c || c.hp <= 0) continue;
      const headPt = this.project(id, 'head');
      const feetPt = this.project(id, 'feet');
      if (!headPt || !feetPt) continue;
      const head = toStage(headPt);
      const feet = toStage(feetPt);
      const half = Math.abs(feet.y - head.y) * BODY_HALF_WIDTH;
      // In the rail's column: cut the rail off above her head.
      if (head.x + half > GUIDE_RAIL_LEFT && head.x - half < GUIDE_RAIL_RIGHT) {
        fenceTop = Math.min(fenceTop, head.y);
      }
      figures.push({ left: head.x - half - cardLean, right: head.x + half + cardLean, foot: Math.max(head.y, feet.y) });
    }
    top.style.top = `${Math.max(0, fenceTop).toFixed(2)}px`;
    // The card's lane: past the girls standing in its band while that still
    // leaves a readable card, else under their feet with a height cap, and
    // never across the party rows (`advisorLane.ts`, PR-0091).
    const lane = solveAdvisorLane({
      figures,
      floor: ADVISOR_FALLBACK_LEFT,
      wall: wall ?? 458,
      base: 360 - ADVISOR_BOTTOM,
      chip: chipH,
      cardHeight: cardH,
      cap: this.advisorCap,
    });
    // `MoveAdvisor.layout` reads `offsetLeft + offsetWidth`, so the fence's own
    // 1px is part of the clearance it hands back.
    right.style.left = `${Math.max(0, Math.min(639, lane.after)).toFixed(2)}px`;
    this.applyAdvisorCap(lane.maxHeight, card);
  }

  /** Write the lane's cap onto the card, only when it changed (the card re-fits on a new cap). */
  private applyAdvisorCap(cap: number | null, card: HTMLElement | null): void {
    this.advisorCap = cap;
    if (!card) return;
    const want = cap === null ? '' : `${cap.toFixed(1)}px`;
    if (card.style.maxHeight !== want) card.style.maxHeight = want;
  }

  /** A new (or no) decision: the cap starts over with the card's full text. */
  private resetAdvisorCap(): void {
    this.applyAdvisorCap(null, this.stage?.querySelector<HTMLElement>('.mad__card') ?? null);
  }

  /**
   * Park the column fence on the leftmost party row's left edge.
   *
   * Measured off the rows' painted boxes rather than their `offsetLeft`,
   * because `.ig-stat` carries the house `skewX`: the lean moves the row's
   * bottom-left corner out past its layout box, and the lean is exactly what
   * the card's right edge was catching. `getBoundingClientRect` sees the
   * transform, `offsetLeft` does not.
   *
   * With no rows laid out yet the fence is left where it was, and the anchor
   * falls back to the container — which is what it used to be.
   */
  private layoutColumnFence(): number | null {
    const fence = this.fenceColumnEl;
    const party = this.partyEl;
    if (!fence || !party) return null;
    const host = this.el.getBoundingClientRect();
    const scale = this.stageScale || 1;
    let left: number | null = null;
    for (const row of party.querySelectorAll<HTMLElement>('.ig-stat')) {
      const r = row.getBoundingClientRect();
      if (r.width <= 0) continue;
      const stageLeft = (r.left - host.left - this.stageX) / scale;
      left = left === null ? stageLeft : Math.min(left, stageLeft);
    }
    if (left === null) {
      const parked = parseFloat(fence.style.left);
      return Number.isFinite(parked) ? parked : null;
    }
    // And back off by the *card's* own lean, for the same reason: `MoveAdvisor`
    // positions its layout box, the house `skewX` paints the box's corner
    // further out than that, and `CLEARANCE_GAP` alone is 0.2 grid px short of
    // a full-height card's lean — which at 2560x1440 is the sliver of Paine's
    // row the card was still touching.
    const card = this.stage.querySelector<HTMLElement>('.mad__card');
    const lean = ((card?.offsetHeight ?? 0) / 2) * SKEW_TANGENT;
    const wall = Math.max(0, Math.min(639, left - lean));
    fence.style.left = `${wall.toFixed(2)}px`;
    return wall;
  }

  sync(state: BattleState, preview: TurnPreview[] | AtbSnapshot): void {
    // A decided battle keeps nothing targeting lit: the results screen fades
    // up over this frame and an accent pool or a quiet dim left behind is
    // painted under it. FFX-2's menu resolves its own promise and cleans up
    // (`CommandMenu.cleanup` -> `cursor.hide()`), so this is the one route it
    // has no handle on — the fight ending while a menu is still open. The FFX
    // side takes the same precaution in `FFXBattleHud.sync`
    // (AGENTS.md rule 14: shared plumbing behind a defect, critic CHK-020).
    if (state.result) this.applySelection(null);
    this.lastState = state;
    this.guide.sync(state);
    this.advisor.sync(state);
    // Once per playback step, never per frame: a prediction deep-clones the
    // board two dozen times. `update(dt)` only re-projects what is drawn.
    this.intent.refresh();
    if (!isAtbSnapshot(preview)) return; // FFX-2 always passes an AtbSnapshot; ignore a stray CTB list.
    this.lastSnapshot = preview;
    this.renderParty(state, preview);
    this.renderEnemies(state, preview);
  }

  /**
   * The party and enemy rows only, from a state the presenter has projected to
   * the event it is playing right now (`HudPort.syncVitals`).
   *
   * Critic round 03 #9 — the rows were re-rendered once per burst, so HP, KO
   * and status on screen trailed the engine by the length of whatever was still
   * animating. The gauges come from the last snapshot: ATB position is the one
   * thing that genuinely belongs to the end of the burst, and it is refreshed
   * by the full `sync` that closes it.
   *
   * Cheap on purpose: no guide, no advisor, no `intent.refresh()`.
   *
   * Game case: both. Shared playback plumbing; FFX has the same call
   * (AGENTS.md rule 14 / CHK-020).
   */
  syncVitals(state: BattleState): void {
    const snapshot = this.lastSnapshot;
    if (!snapshot) return;
    this.renderParty(state, snapshot);
    this.renderEnemies(state, snapshot);
  }

  /**
   * The ATB bars only, from a fresh snapshot (`HudPort.syncGauges`).
   *
   * **FFX-2 only.** The Active pump (`BattlePresenterActive.ts`) calls this at
   * 20 Hz while a command menu is open — the clock is genuinely running under
   * that menu now (Bailey, D-009: *"For ffx-2 I choose active"*), and this is
   * what makes the player see it. The mirror image of {@link syncVitals}: same
   * two renders, same reason for not being `sync`, and the numbers come from
   * `lastState` because only the gauges moved.
   */
  syncGauges(snapshot: AtbSnapshot): void {
    this.lastSnapshot = snapshot;
    const state = this.lastState;
    if (!state) return;
    this.renderParty(state, snapshot);
    this.renderEnemies(state, snapshot);
  }

  /**
   * Tear the open command menu down from outside (`HudPort.closeCommandMenu`).
   *
   * **FFX-2 only, and only reachable under Active**: the girl whose menu was
   * open was KO'd, Stopped, Slept, Petrified, chain-locked or Berserked while
   * she was reading it, or the battle ended under her. `chooseCommand`'s
   * promise is abandoned rather than resolved, so the tidy-up it normally does
   * on the way out happens here instead — including releasing the cancel claim
   * inside `openCommandMenu`'s own cleanup.
   */
  closeCommandMenu(): void {
    const close = this.closeMenu;
    this.closeMenu = null;
    if (close) close();
    this.commandEl.hidden = true;
    this.actingId = null;
    this.guide.clearDecision();
    this.advisor.clearDecision();
    this.resetAdvisorCap();
    this.applySelection(null);
    if (this.lastState && this.lastSnapshot) this.renderParty(this.lastState, this.lastSnapshot);
  }

  async chooseCommand(
    actorId: CombatantId,
    commands: AvailableCommand[],
    previewRank: (cmd: AvailableCommand | null) => TurnPreview[] | AtbSnapshot,
  ): Promise<Command> {
    const actor = this.lastState?.combatants[actorId];
    // Zero-row guard (critic round 05 PR-0045). `openCommandMenu` on an empty
    // list draws a menu with nothing submittable, so the promise below can never
    // resolve: a hard lock rather than a stall. The engine's own invariant is
    // that this cannot happen (`buildCommands` always offers at least one row
    // for a living unit, and a Berserked turn never reaches the player at all),
    // so if it ever does it is a data or engine regression: say so in the console
    // and pass the turn instead of hanging the battle. FFX-2 only — this is the
    // ATB HUD; the FFX HUD has its own chooseCommand.
    if (commands.length === 0) {
      console.error(
        `[ffx2-hud] ${actorId} was offered zero commands; passing the turn rather ` +
          'than opening a menu that cannot be answered (PR-0045)',
      );
      return { kind: 'defend', targets: [] };
    }
    this.actingId = actorId;
    if (this.lastState && this.lastSnapshot) this.renderParty(this.lastState, this.lastSnapshot);
    this.commandEl.hidden = false;
    // NEXT explains the decision that is open right now; cleared below, after
    // the menu resolves.
    if (this.lastState) {
      this.resetAdvisorCap();
      this.guide.showDecision(actorId, commands, this.lastState);
      this.advisor.showDecision(actorId, commands, this.lastState);
    }
    const command = await openCommandMenu({
      container: this.commandEl,
      targetLayer: this.overlay,
      commands,
      previewRank,
      project: this.project,
      // The silhouette the bracket is scaled to, and the display name and
      // letter tag the plate prints — the plate used to print the raw
      // combatant id.
      projectRect: (id) => this.targeting?.rect(id) ?? null,
      nameOf: (id) => this.lastState?.combatants[id]?.name ?? id,
      letterTagOf: (id) => this.letterTagOf(id),
      kindOf: (id) => {
        if (id === actorId) return 'self';
        return this.lastState?.combatants[id]?.side === 'enemy' ? 'enemy' : 'ally';
      },
      onSelection: (sel) => this.applySelection(sel),
      onHelp: (text) => this.setCommandHelp(text),
      actorName: actor?.name ?? actorId,
      onPreview: (preview) => {
        if (!isAtbSnapshot(preview) || !this.lastState) return;
        this.lastSnapshot = preview;
        this.renderParty(this.lastState, preview);
        this.renderEnemies(this.lastState, preview);
      },
      onOpen: (close) => {
        this.closeMenu = close;
      },
    });
    this.closeMenu = null;
    this.commandEl.hidden = true;
    this.actingId = null;
    this.guide.clearDecision();
    this.advisor.clearDecision();
    this.resetAdvisorCap();
    if (this.lastState && this.lastSnapshot) this.renderParty(this.lastState, this.lastSnapshot);
    return command;
  }

  /**
   * PR-0012: FFX's own help slab (`.ig-cutin__info`), mounted for FFX-2 and
   * fed from `CommandMenu.ts`'s `onHelp`. Off entirely when the player has
   * BATTLE HELP off in Config/pause OPTIONS (`battleHelpOn()`,
   * `src/ui/coach/coachState.ts`) — the setting already exists and did
   * nothing on this side of the game before this row.
   */
  private setCommandHelp(text: string): void {
    const show = battleHelpOn() && text.length > 0;
    this.commandInfoEl.hidden = !show;
    if (show) this.commandInfoEl.querySelector('[data-role="text"]')!.textContent = text;
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
      case 'spherechange':
        return this.showSpherechange(event.who, event.to, event.gatesCrossed, event.special);
      case 'damage':
      case 'heal':
      case 'miss':
      case 'mp-damage':
      case 'mp-heal':
        // The figure, plus a flash on the target's own row so the hit reads on
        // the HUD side too. See the class comment on why the numeral is drawn
        // here rather than by the presenter's (never-supplied) port.
        this.damage.onEvent(event);
        this.flashTarget(event.targetId);
        return;
      case 'sensor':
        this.revealed.add(event.targetId);
        if (this.lastState) this.renderEnemies(this.lastState, this.lastSnapshot ?? { elapsedMs: 0, bars: [] });
        return;
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

  setProjector(
    project: (id: CombatantId, anchor?: 'head' | 'chest' | 'feet') => { x: number; y: number } | null,
  ): void {
    this.project = project;
    this.damage.setProjector(project);
  }

  /** The painted field's targeting surface. See {@link TargetingPort}. */
  setTargetingPort(port: TargetingPort): void {
    this.targeting = port;
  }

  /**
   * The letter that tells one of Vegnagun's parts, or one of two identical
   * fiends, from the next — read off the gauge snapshot the HUD last
   * rendered, so the field plate and the boss gauge agree.
   */
  private letterTagOf(id: CombatantId): string | undefined {
    const enemies = (this.lastState?.enemyIds ?? []).filter(
      (e) => this.lastState?.combatants[e] && !this.lastState.combatants[e]!.removed,
    );
    if (enemies.length < 2) return undefined;
    const i = enemies.indexOf(id);
    return i >= 0 ? String.fromCharCode(65 + i) : undefined;
  }

  /**
   * One selection, painted on every surface — the same contract the FFX HUD
   * keeps, and for the same reason: Bailey could not read an answer to *"which
   * enemy is being selected"* off any of them.
   *
   * GAME-AWARE (AGENTS.md rule 14): the accent pool, the quiet dim, the lit
   * rows and the x-ray fallback are **both games**; what is FFX-2's alone is
   * the chrome the cursor wears (the flower, handled in `CommandMenu`) and the
   * Active/Wait indicator below, which is a real FFX-2 Config entry and has no
   * FFX equivalent — FFX's CTB simply waits.
   */
  private applySelection(sel: CursorSelection | null): void {
    const ids = new Set(sel?.ids ?? []);
    const kind = sel?.kind ?? 'enemy';

    if (this.targeting) {
      this.targeting.setPanels(this.panelRects());
      if (!sel) {
        this.targeting.select(null);
        this.targeting.xray(null);
      } else {
        // FFX-2's own accent is pink, and a floating part (Vegnagun's head)
        // takes a halo behind it rather than a pool on a floor it never
        // touches — `accentFor` decides, from the game flag, never memory.
        const accent = accentFor(kind, 'ffx2', true);
        this.targeting.select({ ids: [...ids], mode: sel.mode, accent });
        const active = sel.activeId;
        const covered = active !== null && this.targeting.visibility(active) < 0.75;
        this.targeting.xray(covered ? active : null);
      }
    }

    for (const el of this.el.querySelectorAll<HTMLElement>('[data-actor-id]')) {
      const on = ids.has(el.dataset['actorId'] ?? '');
      el.classList.toggle('ffx2--targeted', on);
      el.classList.toggle('ffx2--targeted-ally', on && kind !== 'enemy');
    }

    // Whether the ATB runs while the player aims is the Config mode's call —
    // that is the whole point of showing the indicator — so the panel yields
    // but never freezes.
    this.el.classList.toggle('ffx2hud--targeting-enemy', !!sel && kind === 'enemy');
    this.setActiveWaitVisible(!!sel);
  }

  /**
   * FFX-2's **Active / Wait** indicator, shown while a target cursor is live.
   *
   * FFX-2 ONLY. It is a real FFX-2 Config entry — the ATB either keeps
   * counting while a menu is open (Active) or holds (Wait) — and it is in the
   * approved frame for exactly that reason: an FFX-2 player aiming at
   * Vegnagun needs to know whether the clock is still running. FFX's CTB has
   * no such setting and gets no such indicator
   * [research/ffx-vs-ffx2-presentation.md, the ATB/CTB rows].
   */
  private setActiveWaitVisible(on: boolean): void {
    if (!this.activeWaitEl) return;
    this.activeWaitEl.hidden = !on;
    this.paintAtbMode();
  }

  /**
   * The fight's Config ATB mode, from the presenter (`HudPort.setAtbMode`).
   * FFX-2 only. A flip under a live target cursor repaints the chip at once.
   */
  setAtbMode(mode: AtbMode): void {
    this.atbMode = mode;
    this.paintAtbMode();
  }

  private paintAtbMode(): void {
    if (!this.activeWaitEl) return;
    const active = this.atbMode === 'active';
    this.activeWaitEl.classList.toggle('ffx2-atbmode--wait', !active);
    this.activeWaitEl.textContent = active ? 'ACTIVE — ATB RUNNING' : 'WAIT — ATB HELD';
  }

  /** HUD panels that genuinely cover the field, in viewport pixels. */
  private panelRects(): Array<{ x: number; y: number; w: number; h: number }> {
    // GAME-AWARE (rule 14): the measurement is shared plumbing behind a
    // defect, so FFX-2 gets exactly the work FFX got. Two halves were missing
    // here: the advisor card and the guide rail were never declared at all —
    // so in Chapters 4 and 5 `visibleInFrame` came back *identical* to
    // `visible`, i.e. the FFX-2 field was never measured against its HUD — and
    // the roots now go through `solidPanelRects`, which resolves a transparent
    // `inset: 0` wrapper to the card that actually paints.
    return solidPanelRects([
      this.commandEl,
      this.partyEl,
      this.enemyEl,
      this.advisor.el,
      this.guide.el,
    ]);
  }

  // ------------------------------------------------------------- rendering

  private layout(): void {
    const rect = this.el.getBoundingClientRect();
    const w = rect.width || window.innerWidth;
    const h = rect.height || window.innerHeight;
    const scale = Math.min(w / 640, h / 360);
    this.stageScale = scale;
    // Published to CSS for the chain chip on the *unscaled* overlay, and as the shared
    // `--lb-scale` that `move-advisor.css`'s rendered type floor divides by (FOC-06).
    for (const v of ['--ffx2-scale', '--lb-scale']) this.el.style.setProperty(v, scale.toFixed(4));
    const x = (w - 640 * scale) / 2;
    const y = (h - 360 * scale) / 2;
    this.stageX = x;
    this.stageY = y;
    this.stage.style.transform = `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px) scale(${scale.toFixed(4)})`;
    this.layoutFences();
  }

  private renderParty(state: BattleState, snapshot: AtbSnapshot): void {
    const rows = state.activeIds
      .map((id, i) => {
        const c = state.combatants[id];
        if (!isFfx2(c)) return '';
        const bar = snapshot.bars.find((b) => b.actorId === id) ?? null;
        return partyRowHtml(c, bar, { actingId: this.actingId, index: i });
      })
      .join('');
    this.partyEl.innerHTML = rows;
  }

  private renderEnemies(state: BattleState, snapshot: AtbSnapshot): void {
    this.enemyEl.innerHTML = enemyGaugesHtml(state, snapshot, {
      revealed: this.revealed,
      charging: this.chargeStages,
    });
  }

  private overlayPoint(targetId: CombatantId, fx: number, fy: number): { x: number; y: number } {
    const p = this.project(targetId);
    if (p) return p;
    const rect = this.el.getBoundingClientRect();
    return { x: (rect.width || window.innerWidth) * fx, y: (rect.height || window.innerHeight) * fy };
  }

  /**
   * A standalone `CHAIN ×N` chip — still no `.ig-damage` splash, because the
   * mock's "742" and its `CHAIN ×4` tag are two separate things and only the
   * tag is the chain's. The numeral itself is now `DamageLayer`'s, spawned from
   * the `damage` event that precedes this one.
   *
   * §4.6 anchors the popup "top-right of the enemy being chained", so the chip
   * sits up and to the right of the target's projected head point. The offset
   * scales with the stage so it stays put at any viewport size, and it clears
   * the numeral's own ladder — which climbs up and to the *right* from the
   * chest anchor (`damageLadder.computeHitOffset`) — by starting above the head
   * instead of level with the hits.
   */
  private showChain(targetId: CombatantId, count: number, multiplier: number): Promise<void> {
    this.chain.show(targetId, count, multiplier);
    return this.hold(count <= 0 ? 400 : 450);
  }

  /**
   * The spherechange transformation — §4.5.4's commit VFX, played on the field
   * over the girl who just spent her whole turn on it.
   *
   * The event was previously falling through `onEvent`'s `default:` and drawing
   * nothing at all, so X-2's signature action read as a monogram changing
   * letters in a 40 px row. Awaited, because §3's mechanic "halts time" — and
   * because the rows redraw on the next `atb` event, so the light has to be on
   * screen before the row admits she changed.
   *
   * FFX has no spherechange; `FFXBattleHud` is a different component and gets
   * nothing from this.
   */
  private async showSpherechange(
    who: CombatantId,
    to: string,
    gatesCrossed: GateColour[],
    special: string | undefined,
  ): Promise<void> {
    const name = (this.lastState?.combatants[who] as FFX2Combatant | undefined)?.name ?? who;
    await playSpherechangeFlourish(
      {
        overlay: this.overlay,
        scale: () => this.stageScale,
        anchor: (id) => {
          const head = this.project(id, 'head');
          const feet = this.project(id, 'feet');
          return head && feet ? { head, feet } : null;
        },
      },
      { who, name, to, gatesCrossed, special },
    );
    // Her ATB bar is empty and begins refilling — §4.5.4's "Cost, made visible:
    // do not skip this frame; it is the price". The engine has already zeroed
    // it; this redraw is what puts the empty bar on screen while the light is
    // still fading, instead of a frame later.
    if (this.lastState && this.lastSnapshot) this.renderParty(this.lastState, this.lastSnapshot);
  }

  /**
   * The HUD-side half of a hit, alongside the numeral `DamageLayer` spawns: a
   * brief flash on the target's own `.ig-stat` row or `.ig-bosshp` block, keyed
   * off whichever element `renderParty`/`renderEnemies` last drew for that id.
   * It is what connects a figure floating over the field to the row whose bar
   * just moved.
   */
  private flashTarget(targetId: CombatantId): void {
    const row = this.partyEl.querySelector<HTMLElement>(`[data-actor-id="${targetId}"]`) ?? this.enemyEl.querySelector<HTMLElement>(`[data-actor-id="${targetId}"]`);
    if (!row) return;
    window.clearTimeout(this.damageFlashTimer);
    row.classList.remove('ffx2-hit-flash');
    void row.offsetWidth;
    row.classList.add('ffx2-hit-flash');
    this.damageFlashTimer = window.setTimeout(() => row.classList.remove('ffx2-hit-flash'), 220);
  }

  /** `.ig-banner`, anchored top-right by `.ig--ffx2` for free. */
  private showTelegraph(enemyId: CombatantId, name: string, turnsLeft: number, stage: 1 | 2): Promise<void> {
    window.clearTimeout(this.telegraphHideTimer);
    const enemyName = (this.lastState?.combatants[enemyId] as FFX2Combatant | undefined)?.name ?? enemyId;
    this.telegraphEl.hidden = false;
    this.telegraphEl.className = `ig-banner ffx2hud__telegraph ffx2hud__telegraph--s${stage}`;
    // Bahamut's Mega Flare countdown emits the number *as* the state text
    // (`src/battle/ffx2/ai/bahamut.ts`: "five consecutive actions that do
    // nothing but display a number"), so the default chip printed
    // "BAHAMUT · 4 TURNS" next to a banner whose headline was also "4". When
    // the state text is a bare countdown the chip drops the duplicate and the
    // numeral carries it alone.
    const isCountdown = /^\d+$/.test(name.trim());
    const chip = isCountdown
      ? enemyName
      : turnsLeft > 0
        ? `${enemyName} &middot; ${turnsLeft} turn${turnsLeft === 1 ? '' : 's'}`
        : `${enemyName} &middot; NOW`;
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
