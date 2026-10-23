/**
 * THE F1 HUD LAYER (conference demo, lane "hud-f1"; Bailey 2026-10-23, item 193, "F1 Brushed slab" on the "Clear Stage" layout; both games, presentation only).
 *
 * Today's HUD is kept and refined (decision 191): this layer adds only what the Clear Stage layout needs that today's DOM has no element for, and `hudf1*.css` (every rule under
 * `.hud-f1` on the HUD root) re-places and re-types what is there:
 *
 *  - the BOSS RIBBON (name, HP bar and a white "bite" that drains behind a hit), top left, from the headline enemy;
 *  - the HERO header (the acting hero's face and name; FFX-2 adds the role chip) over the command block;
 *  - the one CUE ("Hastega -> the party, 30 MP"): the advisor's lead move, read from its card, shown once under the hero;
 *  - the PROMPT BAR (A Select, X Intel, Y Defend in Chapter I, Pause): the build's own key/pad chips (`padGlyphs.keyHint`).
 *
 * Everything else in the Clear Stage list (the three-slot turn strip, the verbs and the party cards) is today's DOM under new CSS. The enemy details, the guide, the advisor card, the Sensor
 * card and the enemy-intent chip move behind the existing X (Intel) toggle: `intel` is "the strategy guide is shown" (its own toggle, G or the pad's X), read from its root class.
 * The centre of the frame stays clear.
 *
 * Game case: BOTH. Chapter I (FFX, CTB): command block left, three-slot turn strip, Overdrive bars, Defend on Y. Chapter IV (FFX-2, ATB): no turn strip, ATB bars on the cards, a role chip,
 * everything mirrored right with the slant flipped and the pink accent (those flips are `--ig-skew` and `--ig-accent` on the HUD root, `.ig--ffx2`).
 *
 * With the switch off ({@link hudF1On}) this class does nothing: no element is added to the page and no class is put on the root.
 */
import type { BattleEvent, BattleState } from '../../battle/common/types.ts';
import type { ActingSignal } from '../../engine/HudPort.ts';
import { headlineEnemy } from '../../battle/common/headlineEnemy.ts';
import { keyHint } from '../common/padGlyphs.ts';
import { escapeHtml } from '../common/html.ts';
import { HUD_F1_TUNE, hudF1On, onHudF1Change } from './HudF1Switch.ts';
import { StepBack } from './HudF1StepBack.ts';
import './hudf1.css';
import './hudf1-ffx.css';
import './hudf1-ffx2.css';
import './hudf1-act.css';
import './hudf1-finish.css';

/** The root class every `hudf1*.css` rule hangs from. */
export const HUD_F1_CLASS = 'hud-f1';
/** The command block is up (a menu is open): the hero, the cue and the verbs show. */
export const F1_CMD_OPEN = 'f1-cmd-open';
/** Intel (X) is on: the cards that moved behind it show. */
export const F1_INTEL = 'f1-intel';

/** What the layer needs from the HUD that owns it (its own DOM, by accessor, since both HUDs rebuild some of it). */
export interface HudF1Host {
  game: 'ffx' | 'ffx2';
  /** The HUD root (`.ffxhud` / `.ffx2hud`): gets the classes. */
  root: HTMLElement;
  /** The 640 x 360 stage: the layer's parent. */
  stage: HTMLElement;
  /** The element that holds the command rows (`.ig-cmd-stack`), or null. */
  cmdStack: () => HTMLElement | null;
  /** The element the command block's wrapper lives in (cloned for the step-back ghost): FFX `.ffx-cmd-area`, FFX-2 `.ffx2hud__command`. */
  cmdBlock: () => HTMLElement | null;
  /** The text of the help slab for the selected row (printed on the row itself). */
  helpText: () => string;
  /** The party row of a hero by id (the one whose menu is open), or, with no id, the row marked acting; null when there is none. */
  heroRow: (id: string | null) => HTMLElement | null;
}

const STAR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 1l2.6 8.4L23 12l-8.4 2.6L12 23l-2.6-8.4L1 12l8.4-2.6z"/></svg>';

const PROMPTS: Record<'ffx' | 'ffx2', ReadonlyArray<readonly [key: string, pad: string, label: string]>> = {
  ffx: [['Enter', 'Cross', 'Select'], ['G', 'Square', 'Intel'], ['Q', 'Triangle', 'Defend'], ['P', 'Start', 'Pause']],
  ffx2: [['Enter', 'Cross', 'Select'], ['G', 'Square', 'Intel'], ['P', 'Start', 'Pause']],
};

/** The layer's own main-thread cost per frame, in ms, for `__pyrefly.hudF1Cost()` (recorded only while `profile` is on: off, `update` pays one boolean). */
export const f1Cost = { profile: false, samples: [] as number[] };

export class HudF1 {
  private readonly layer = document.createElement('div');
  private readonly ribbonName: HTMLElement;
  private readonly ribbonFill: HTMLElement;
  private readonly ribbonDrain: HTMLElement;
  private readonly heroFace: HTMLElement;
  private readonly heroName: HTMLElement;
  private readonly heroRole: HTMLElement;
  private readonly cueEl: HTMLElement;
  private readonly cueSpell: HTMLElement;
  private readonly cueTarget: HTMLElement;
  private readonly cueMp: HTMLElement;
  private readonly cueArrow: HTMLElement;
  private readonly cueDot: HTMLElement;
  private host: HudF1Host | null = null;
  private applied = false;
  private offChange: (() => void) | null = null;
  /** The bar's last value, percent; -1 before the first sync (a fight joined mid-way draws its bar at once, with no bite). */
  private lastPct = -1;
  private heroId = '';
  /** Whose menu is open (`HudPort.chooseCommand`'s actor): the hero over the block is this one, whoever the party list marks as acting (a Switch changes the actor under the menu). */
  private menuActor: string | null = null;
  private cueClock = 0;
  private cmdOpen = false;
  private readonly step: StepBack;
  private lastState: Readonly<BattleState> | null = null;

  constructor(game: 'ffx' | 'ffx2') {
    this.layer.className = 'f1-layer';
    this.layer.hidden = true;
    const prompts = PROMPTS[game].map(([k, p, l]) => `<span class="f1-pr"><b>${keyHint(k, p)}</b><span class="f1-pr__t">${escapeHtml(l)}</span></span>`).join('');
    this.layer.innerHTML = `
      <div class="f1-ribbon f1-slab f1-ink" data-zone="boss-ribbon"><i class="f1-stripe f1-stripe--iv"></i><div class="f1-in">
        <div class="f1-ribbon__name sr"></div>
        <div class="f1-ribbon__bar"><i class="f1-ribbon__drain"></i><i class="f1-ribbon__fill"></i></div>
      </div></div>
      <div class="f1-hero" data-zone="command-block"><span class="f1-hero__face"></span><span class="f1-hero__name sr"></span><span class="f1-hero__role" hidden></span></div>
      <div class="f1-cue f1-slab f1-ink" data-zone="cue"><div class="f1-in">
        <span class="f1-cue__star">${STAR}</span><span class="f1-cue__spell sr"></span><span class="f1-cue__arr">→</span><span class="f1-cue__target"></span><span class="f1-cue__dot">·</span><span class="f1-cue__mp"></span>
      </div></div>
      <div class="f1-prompts f1-slab f1-ink" data-zone="prompts"><div class="f1-in">${prompts}</div></div>`;
    const q = (s: string): HTMLElement => this.layer.querySelector<HTMLElement>(s)!;
    this.ribbonName = q('.f1-ribbon__name');
    this.ribbonFill = q('.f1-ribbon__fill');
    this.ribbonDrain = q('.f1-ribbon__drain');
    this.heroFace = q('.f1-hero__face');
    this.heroName = q('.f1-hero__name');
    this.heroRole = q('.f1-hero__role');
    this.cueEl = q('.f1-cue');
    this.cueSpell = q('.f1-cue__spell');
    this.cueTarget = q('.f1-cue__target');
    this.cueMp = q('.f1-cue__mp');
    this.cueArrow = q('.f1-cue__arr');
    this.cueDot = q('.f1-cue__dot');
    this.step = new StepBack(this.layer);
  }

  /** The HUD mounted: put the layer in the stage and read the switch. */
  mount(host: HudF1Host): void {
    this.host = host;
    host.stage.appendChild(this.layer);
    this.step.attach(host);
    this.offChange = onHudF1Change(() => this.refresh());
    this.refresh();
  }

  unmount(): void {
    this.offChange?.();
    this.offChange = null;
    this.step.clear();
    this.host?.root.classList.remove(HUD_F1_CLASS, F1_CMD_OPEN, F1_INTEL, 'f1-finish', 'f1-ribbon-hides', 'f1-edge-calm');
    this.layer.remove();
    this.host = null;
    this.applied = false;
  }

  /** Is the F1 HUD drawing now? */
  get on(): boolean {
    return this.applied;
  }

  /** Read the switch and set the root's class; true when it is on. The chapter is named before the HUD mounts, but a later flip (the switchboard) lands here too. */
  refresh(): boolean {
    const h = this.host;
    if (!h) return false;
    const want = hudF1On() && !document.documentElement.hasAttribute('data-phone-battle');
    if (want !== this.applied) {
      this.applied = want;
      h.root.classList.toggle(HUD_F1_CLASS, want);
      this.layer.hidden = !want;
      if (want) {
        this.cmdOpen = false; // a switch flipped back on re-reads the open menu (the class was taken off with the rest)
        this.heroId = '';
        h.root.style.setProperty('--f1-floor', `${HUD_F1_TUNE.floorPx / 4}px`);
        h.root.classList.toggle('f1-finish', HUD_F1_TUNE.finish);
        h.root.classList.toggle('f1-edge-calm', HUD_F1_TUNE.edgeCalm);
        h.root.classList.toggle('f1-ribbon-hides', !HUD_F1_TUNE.ribbonStaysInAction);
      } else {
        h.root.style.removeProperty('--f1-floor');
        h.root.classList.remove(F1_CMD_OPEN, F1_INTEL, 'f1-finish', 'f1-ribbon-hides', 'f1-edge-calm');
        this.step.clear();
      }
      if (want && this.lastState) this.sync(this.lastState);
    }
    return want;
  }

  /** `HudPort.sync` / `syncVitals`: the ribbon follows the headline enemy's HP. */
  sync(state: Readonly<BattleState>): void {
    this.lastState = state;
    if (!this.applied && !this.refresh()) return;
    const boss = headlineEnemy(state);
    this.layer.querySelector('.f1-ribbon')?.toggleAttribute('hidden', !boss);
    if (!boss) return;
    if (this.ribbonName.textContent !== boss.name) this.ribbonName.textContent = boss.name;
    const pct = Math.max(0, Math.min(100, (boss.hp / Math.max(1, boss.stats.maxHp)) * 100));
    if (pct === this.lastPct) return;
    if (this.lastPct >= 0 && pct < this.lastPct) {
      // The bite: the white segment holds where the bar was, then eases down to it (CSS transition on the drain's width).
      this.ribbonDrain.style.transition = 'none';
      this.ribbonDrain.style.width = `${this.lastPct}%`;
      void this.ribbonDrain.offsetWidth;
      this.ribbonDrain.style.transition = '';
    }
    this.ribbonFill.style.width = `${pct}%`;
    this.ribbonDrain.style.width = `${pct}%`;
    this.lastPct = pct;
  }

  /** `HudPort.chooseCommand`: a menu opens for this hero. */
  setMenuActor(id: string): void {
    this.menuActor = id;
    this.heroId = '';
  }

  /** `HudPort.setActing`. */
  setActing(signal: ActingSignal): void {
    if (this.applied) this.step.signal(signal);
  }

  /** `HudPort.onEvent`. */
  onEvent(event: BattleEvent): void {
    if (this.applied) this.step.observe(event);
  }

  /** Once per frame (the HUD's `update`). */
  update(dt: number): void {
    if (!f1Cost.profile) return this.run(dt);
    const t0 = performance.now();
    this.run(dt);
    f1Cost.samples.push(performance.now() - t0);
  }

  private run(dt: number): void {
    const h = this.host;
    if (!h || (!this.applied && !this.refresh())) return;
    const stack = h.cmdStack();
    const open = !!stack && !stack.hidden && !stack.closest('[hidden]') && !!stack.querySelector('.ig-cmd');
    if (open !== this.cmdOpen) {
      this.step.menuEdge(open);
      this.cmdOpen = open;
      h.root.classList.toggle(F1_CMD_OPEN, open);
    }
    const guide = h.stage.querySelector('.sgd');
    h.root.classList.toggle(F1_INTEL, !!guide && !guide.classList.contains('sgd--off'));
    this.step.update(dt, open);
    if (!open) return;
    this.syncHero(h);
    this.syncSelected(stack!, h.helpText());
    this.cueClock -= dt;
    if (this.cueClock <= 0) {
      this.cueClock = 0.2;
      this.syncCue(h);
    }
  }

  /** The hero over the block: the face is the party row's own (cloned when the hero changes), the name its text. */
  private syncHero(h: HudF1Host): void {
    const row = h.heroRow(this.menuActor) ?? h.heroRow(null);
    const id = row ? (row.dataset['actorId'] ?? row.dataset['actor'] ?? row.querySelector('.ig-stat__name')?.textContent ?? '') : ''; // FFX rows say data-actor, FFX-2 rows data-actor-id
    if (!row || !id || id === this.heroId) return;
    this.heroId = id;
    const face = row.querySelector<HTMLElement>('.ig-stat__face, .ffx2stat__face');
    this.heroFace.replaceChildren();
    if (face) {
      const copy = face.cloneNode(true) as HTMLElement;
      copy.classList.add('f1-hero__tile');
      copy.querySelector('.ffx2stat__job')?.remove();
      this.heroFace.appendChild(copy);
    }
    this.heroName.textContent = row.querySelector('.ig-stat__name')?.textContent ?? '';
    const role = face?.getAttribute('title') ?? '';
    this.heroRole.textContent = h.game === 'ffx2' ? role.toUpperCase() : '';
    this.heroRole.hidden = h.game !== 'ffx2' || !role;
  }

  /** The help line of the selected verb is printed on its own row (`data-help`, drawn by the CSS): the help slab itself is not shown. */
  private syncSelected(stack: HTMLElement, help: string): void {
    const sel = stack.querySelector<HTMLElement>('.ig-cmd--selected');
    if (!sel) return;
    const text = help.trim();
    if (sel.dataset['help'] !== text) sel.dataset['help'] = text;
  }

  /** The verb that holds the cue's move gets the star after its label (the mockup's `White Magic ✦`: where the move is, said on the row). */
  private markRecommended(h: HudF1Host, where: string): void {
    const rows = h.cmdStack()?.querySelectorAll<HTMLElement>('.ig-cmd') ?? [];
    for (const row of rows) {
      const label = row.querySelector('.ffx-cmd__label, .ffx2cmd__label')?.textContent?.trim().toLowerCase() ?? '';
      row.classList.toggle('f1-rec', where !== '' && label === where);
    }
  }

  /** The cue: the advisor's lead move, as the card prints it. Hidden when the advisor has none (or is off). */
  private syncCue(h: HudF1Host): void {
    const card = h.stage.querySelector<HTMLElement>('.mad__card');
    const label = card?.querySelector('.mad__label')?.textContent?.trim() ?? '';
    const off = !card || !label || !!card.closest('.mad--off');
    this.cueEl.classList.toggle('f1-cue--none', off);
    if (off) return;
    const actor = card.querySelector('.mad__actor')?.textContent?.trim() ?? '';
    const target = card.querySelector('.mad__target')?.textContent?.trim() ?? '';
    const stats = [...card.querySelectorAll('.mad__stat')].map((e) => e.textContent?.trim() ?? '');
    const mp = stats.find((s) => /\bMP\b/i.test(s)) ?? '';
    const where = card.querySelector('.mad__where')?.textContent?.trim().toLowerCase() ?? '';
    this.markRecommended(h, where);
    const other = actor && actor !== this.heroName.textContent ? `${actor}: ` : '';
    this.cueSpell.textContent = `${other}${label}`;
    this.cueTarget.textContent = target;
    this.cueMp.textContent = mp;
    this.cueArrow.hidden = !target;
    this.cueTarget.hidden = !target;
    this.cueDot.hidden = !target || !mp;
    this.cueMp.hidden = !mp;
  }
}
