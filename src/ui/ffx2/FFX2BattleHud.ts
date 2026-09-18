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
import { partyRowHtml } from './PartyRows.ts';
import { enemyGaugesHtml, type ChargePip } from './BossGauges.ts';
import { DamageLayer } from './DamageLayer.ts';
import { ffx2EngineOptions } from '../../app/screens/BattleScreenContent.ts';
import { MoveAdvisor } from '../common/MoveAdvisor.ts';
import { StrategyGuide } from '../common/StrategyGuide.ts';
import { EnemyIntentPanel, type IntentSource } from '../common/EnemyIntent.ts';
import { placeSlab, steerRects, type SlabRect } from './intentPlacement.ts';

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

const CHAIN_HOLD_MS = 1400;
const TELEGRAPH_HOLD_MS = 2400;

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
  private minigameEl!: HTMLElement;
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
  private chainHideTimer = 0;
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
    this.minigameEl = this.stage.querySelector('.ffx2hud__minigame') as HTMLElement;
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
    window.clearTimeout(this.chainHideTimer);
    window.clearTimeout(this.telegraphHideTimer);
    window.clearTimeout(this.damageFlashTimer);
    this.damage.unmount();
    this.guide.unmount();
    this.advisor.unmount();
    this.intent.unmount();
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
  private intentObstacles(): IntentAvoidRect[] {
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
      '.ffx2sc',
      '.ffx2-chain-chip',
    ] as const;
    for (const selector of selectors) {
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
    const box = (this.intent.isVisible ? this.el.querySelector('.eint__panel') : this.el.querySelector('.eint__toggle')) as
      | HTMLElement
      | null;
    const rect = box?.getBoundingClientRect();
    const w = rect?.width || INTENT_FALLBACK_W * scale;
    const h = rect?.height || INTENT_FALLBACK_H * scale;

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
    const target = placeSlab(natural, { w, h }, local, { width: layer.width, height: layer.height }, edge);
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
    this.layoutColumnFence();
    const rect = this.el.getBoundingClientRect();
    const scale = this.stageScale || 1;
    const toStage = (p: { x: number; y: number }): { x: number; y: number } => ({
      x: (p.x - rect.left - this.stageX) / scale,
      y: (p.y - rect.top - this.stageY) / scale,
    });

    const card = this.stage.querySelector<HTMLElement>('.mad__card');
    const cardTop = card && card.offsetHeight > 0 ? 360 - ADVISOR_BOTTOM - card.offsetHeight : 360 - ADVISOR_BOTTOM - 58;

    let fenceTop = 360 - GUIDE_FALLBACK_BOTTOM;
    let fenceRight = ADVISOR_FALLBACK_LEFT;
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
      // Standing in the card's band: start the card past her shoulder.
      if (Math.max(head.y, feet.y) > cardTop) {
        fenceRight = Math.max(fenceRight, head.x + half);
      }
    }
    top.style.top = `${Math.max(0, fenceTop).toFixed(2)}px`;
    // `MoveAdvisor.layout` reads `offsetLeft + offsetWidth`, so the fence's own
    // 1px is part of the clearance it hands back.
    right.style.left = `${Math.max(0, Math.min(639, fenceRight)).toFixed(2)}px`;
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
  private layoutColumnFence(): void {
    const fence = this.fenceColumnEl;
    const party = this.partyEl;
    if (!fence || !party) return;
    const host = this.el.getBoundingClientRect();
    const scale = this.stageScale || 1;
    let left: number | null = null;
    for (const row of party.querySelectorAll<HTMLElement>('.ig-stat')) {
      const r = row.getBoundingClientRect();
      if (r.width <= 0) continue;
      const stageLeft = (r.left - host.left - this.stageX) / scale;
      left = left === null ? stageLeft : Math.min(left, stageLeft);
    }
    if (left === null) return;
    fence.style.left = `${Math.max(0, Math.min(639, left)).toFixed(2)}px`;
  }

  sync(state: BattleState, preview: TurnPreview[] | AtbSnapshot): void {
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

  async chooseCommand(
    actorId: CombatantId,
    commands: AvailableCommand[],
    previewRank: (cmd: AvailableCommand | null) => TurnPreview[] | AtbSnapshot,
  ): Promise<Command> {
    const actor = this.lastState?.combatants[actorId];
    this.actingId = actorId;
    if (this.lastState && this.lastSnapshot) this.renderParty(this.lastState, this.lastSnapshot);
    this.commandEl.hidden = false;
    // NEXT explains the decision that is open right now; cleared below, after
    // the menu resolves.
    if (this.lastState) {
      this.guide.showDecision(actorId, commands, this.lastState);
      this.advisor.showDecision(actorId, commands, this.lastState);
    }
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
    this.guide.clearDecision();
    this.advisor.clearDecision();
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

  // ------------------------------------------------------------- rendering

  private layout(): void {
    const rect = this.el.getBoundingClientRect();
    const w = rect.width || window.innerWidth;
    const h = rect.height || window.innerHeight;
    const scale = Math.min(w / 640, h / 360);
    this.stageScale = scale;
    // Published to CSS for the few things that live on the *unscaled* overlay
    // and still have to match the chrome's size (the chain chip).
    this.el.style.setProperty('--ffx2-scale', scale.toFixed(4));
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
    window.clearTimeout(this.chainHideTimer);
    let el = this.overlay.querySelector('.ffx2-chain-chip') as HTMLElement | null;
    if (count <= 0) {
      el?.remove();
      return this.hold(400);
    }
    if (!el) {
      el = document.createElement('div');
      this.overlay.appendChild(el);
    }
    const anchor = this.overlayPoint(targetId, 0.4, 0.22);
    const pos = { x: anchor.x + 34 * this.stageScale, y: anchor.y - 22 * this.stageScale };
    el.style.left = `${pos.x}px`;
    el.style.top = `${pos.y}px`;
    el.className = `ffx2-chain-chip${count >= 20 ? ' ffx2chain--flash' : ''}${count >= 10 ? ' ffx2chain--hot' : count >= 5 ? ' ffx2chain--warm' : ''}`;
    el.textContent = `CHAIN ×${multiplier.toFixed(2)}`;
    // Restart the pop animation even if the class list did not change.
    void el.offsetWidth;
    el.classList.add('ffx2chain--pop');
    this.chainHideTimer = window.setTimeout(() => el?.remove(), CHAIN_HOLD_MS);
    return this.hold(450);
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
