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
import { StrategyGuide } from '../common/StrategyGuide.ts';

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
      above: () => this.partyEl ?? null,
      top: 44,
      bottom: 104,
    },
  });
  private chainHideTimer = 0;
  private telegraphHideTimer = 0;
  private damageFlashTimer = 0;
  /** Current `.ffx2hud__stage` letterbox scale, so overlay-space offsets (chain chip) stay proportional at any viewport size. */
  private stageScale = 1;
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

    // Numerals live on the unscaled overlay, not the 640x360 stage: their
    // positions come straight from the presenter's projector in real pixels,
    // with §3.6's grid-quoted glyph sizes multiplied back up by the same
    // letterbox scale `layout()` applies to the stage.
    this.damage.mount(this.overlay, { host: this.el, scale: () => this.stageScale });
    // Into the scaled stage, so the rail letterboxes with the rest of the
    // chrome and its anchors' `offsetTop` are in the same 640x360 grid.
    this.guide.mount(this.stage);

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
    this.el.remove();
    this.mounted = false;
  }

  /** Per-frame tick from `BattleScreen`, so numerals freeze with the game loop. */
  update(dt: number): void {
    this.damage.update(dt);
    this.guide.update(dt);
  }

  /** The guide rail, for tests and the debug snapshot. */
  get strategyGuide(): StrategyGuide {
    return this.guide;
  }

  sync(state: BattleState, preview: TurnPreview[] | AtbSnapshot): void {
    this.lastState = state;
    this.guide.sync(state);
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
    if (this.lastState) this.guide.showDecision(actorId, commands, this.lastState);
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
    this.stage.style.transform = `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px) scale(${scale.toFixed(4)})`;
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
