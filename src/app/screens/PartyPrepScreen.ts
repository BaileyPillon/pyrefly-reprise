/**
 * The prep step between choosing a chapter and fighting it.
 *
 * This is a **shell**. It owns the frame, the tab strip, the keyboard routing
 * and the "begin" / "back" contract with the flow; the panels inside it — FFX's
 * Party / Sphere Grid / Equipment / Items / Overdrive modes, FFX-2's Garment
 * Grid and dresspheres — are built by the UI agents and plugged in with
 * {@link registerPrepPanel}.
 *
 * A chapter with no panels registered is still playable: the shell shows the
 * party as it comes out of the build and Enter starts the fight.
 */

import '../../ui/common/party-prep.css';
import type { GameId } from '../../battle/common/types.ts';
import type { Chapter } from '../../data/encounters.ts';
import { audio } from '../../audio/index.ts';
import { Screen } from '../Screen.ts';
import type { InputSnapshot } from '../Input.ts';
import type { FlowScreen } from './BattleScreenFlow.ts';
import { createStage, type Stage } from '../../ui/common/LetterboxStage.ts';
import { portraitImgHtml } from '../../ui/common/portrait.ts';
import { escapeHtml } from '../../ui/common/html.ts';
import { romanNumeral } from '../../ui/common/roman.ts';
import { partyRole } from '../../ui/common/party-roles.ts';
import { installInkGoldStyles } from '../../ui/inkgold/index.ts';
import { artUrl } from '../../engine/PaintedArt.ts';

/** One tab in the prep menu, supplied by a UI agent. */
export interface PrepPanel {
  /** Tab id, unique per game. */
  id: string;
  /** Tab label, e.g. `'Sphere Grid'`. */
  label: string;
  /** Which game's prep menu this belongs to. */
  game: GameId;
  /** Display order, low first. */
  order?: number;
  /**
   * The panel is a whole menu, not a tab: it draws its own header and tab
   * strip and wants the screen to itself. The shell then renders no chrome of
   * its own. A game with exactly one registered panel is treated as
   * full-screen automatically, because that is what a single panel means.
   */
  fullScreen?: boolean;
  /** Build the panel's DOM. Called once when the tab is first opened. */
  mount(root: HTMLElement, ctx: { chapter: Chapter }): void;
  unmount?(): void;
  /** Returns true when the panel consumed the input. */
  handleInput?(input: InputSnapshot): boolean;
}

const panels: PrepPanel[] = [];

/** Add a prep panel. UI agents call this once at module load. */
export function registerPrepPanel(panel: PrepPanel): void {
  const i = panels.findIndex((p) => p.id === panel.id && p.game === panel.game);
  if (i >= 0) panels[i] = panel;
  else panels.push(panel);
}

/** Panels registered for a game, in display order. */
export function prepPanelsFor(game: GameId): PrepPanel[] {
  return panels.filter((p) => p.game === game).sort((a, b) => (a.order ?? 50) - (b.order ?? 50));
}

export interface PartyPrepScreenOptions {
  chapter: Chapter;
}

export class PartyPrepScreen extends Screen implements FlowScreen<boolean> {
  readonly name = 'party-prep';
  readonly done: Promise<boolean>;

  private resolve!: (begin: boolean) => void;
  private settled = false;
  private readonly chapter: Chapter;
  private tabs: PrepPanel[] = [];
  private index = 0;
  private readonly mounted = new Set<string>();
  private body: HTMLElement | null = null;
  private stage: Stage | null = null;
  /** Which roster member the sheet is showing. Up/Down moves it. */
  private member = 0;

  constructor(opts: PartyPrepScreenOptions) {
    super();
    this.chapter = opts.chapter;
    this.done = new Promise((r) => {
      this.resolve = r;
    });
  }

  private settle(begin: boolean): void {
    if (this.settled) return;
    this.settled = true;
    this.resolve(begin);
  }

  override enter(): void {
    installInkGoldStyles();
    this.tabs = prepPanelsFor(this.chapter.game);
    this.root.className = 'screen';

    if (this.ownsWholeScreen) {
      // The registered menu draws its own frame; the shell gets out of the way
      // rather than boxing a full-screen design inside a second one.
      this.root.innerHTML = '<div data-role="body" style="position:absolute;inset:0"></div>';
      this.body = this.root.querySelector('[data-role="body"]');
      this.renderBody();
      void this.app.fade('clear', 400);
      return;
    }

    this.stage = createStage(this.root, 'prep');
    this.stage.el.classList.add('ig');
    if (this.chapter.game === 'ffx2') this.stage.el.classList.add('ig--ffx2');

    this.stage.stage.innerHTML = `
      <div class="prep__wash" style="background-image:url(${artUrl(`art/backdrops/${this.chapter.sceneKey}.png`)})"></div>
      <div class="prep__veil"></div>

      <div class="prep__eyebrow">
        <span class="prep__eyebrow-rule"></span>
        <span class="prep__eyebrow-label">PARTY PREP</span>
      </div>
      <div class="prep__where">${romanNumeral(this.chapter.number)} &middot; ${escapeHtml(
        this.chapter.title.toUpperCase(),
      )} &mdash; ${escapeHtml(this.chapter.location.toUpperCase())}</div>

      <div class="prep__roster" data-role="roster"></div>
      <div class="prep__tabs" data-role="tabs"></div>
      <div class="prep__sheet"><div class="prep__sheet-inner" data-role="body"></div></div>
      <div class="prep__hint">
        <b>&#9650; &#9660;</b> PARTY &nbsp;&middot;&nbsp; <b>&#9664; &#9654;</b> TABS
        &nbsp;&middot;&nbsp; <b>ENTER</b> BEGINS THE BATTLE &nbsp;&middot;&nbsp; <b>ESC</b> BACK
      </div>

      <div class="prep__start" data-action="prep:begin">
        <span><span class="prep__start-tri"></span>START BATTLE</span>
      </div>
      <div class="prep__slots">${this.slotsHtml()}</div>
    `;

    this.body = this.stage.stage.querySelector('[data-role="body"]');
    this.renderRoster();
    this.renderTabs();
    this.renderBody();
    void this.app.fade('clear', 400);
  }

  /** True when a registered panel is a whole menu and owns the frame. */
  private get ownsWholeScreen(): boolean {
    return this.tabs.length === 1 || this.tabs.some((t) => t.fullScreen === true);
  }

  private renderTabs(): void {
    const strip = this.root.querySelector('[data-role="tabs"]');
    if (!strip) return;
    if (!this.tabs.length) {
      // No panels registered yet: the shell's own member sheet IS the tab.
      strip.innerHTML = `<div class="prep__tab" aria-selected="true">STATS</div>`;
      return;
    }
    strip.innerHTML = this.tabs
      .map(
        (t, i) =>
          `<div class="prep__tab" aria-selected="${i === this.index}" data-action="prep:tab:${t.id}">${escapeHtml(
            t.label.toUpperCase(),
          )}</div>`,
      )
      .join('');
  }

  /** The roster column: every member the chapter lets the player look at. */
  private renderRoster(): void {
    const col = this.root.querySelector('[data-role="roster"]');
    if (!col) return;
    const build = this.chapter.buildRef;
    const levels =
      build.game === 'ffx'
        ? build.members.map((m) => `S.LV ${m.sphereGrid.sLv}`)
        : build.members.map((m) => `LV ${m.level}`);
    col.innerHTML = build.members
      .map((m, i) => {
        // Each row steps 10px (1440 grid) further right than the one above.
        const indent = (i * 10) / 2.25;
        return `
          <div class="prep__member${i === this.member ? ' prep__member--sel' : ''}"
               data-action="prep:member-${i}" role="button" tabindex="0"
               style="margin-left:${indent.toFixed(2)}px">
            <div class="prep__face">${this.faceHtml(m.id, m.name)}</div>
            <span class="prep__member-name">${escapeHtml(m.name)}</span>
            <span class="prep__member-lv">${levels[i] ?? ''}</span>
          </div>
        `;
      })
      .join('');
  }

  /** A portrait with its initial underneath, so a missing file still reads. */
  private faceHtml(id: string, name: string): string {
    return `<span>${escapeHtml(name.charAt(0).toUpperCase())}</span>${portraitImgHtml(id, '')}`;
  }

  /** The three who actually walk in, along the bottom. */
  private slotsHtml(): string {
    const build = this.chapter.buildRef;
    type Slot = { id: string; name: string; sub: string; role: string | undefined };
    const slots: Slot[] =
      build.game === 'ffx'
        ? build.activeSlots.flatMap((id) => {
            const m = build.members.find((x) => x.id === id);
            if (!m) return [];
            return [
              {
                id: m.id,
                name: m.name,
                sub: `HP ${m.hp}/${m.stats.maxHp} &middot; MP ${m.mp}/${m.stats.maxMp}`,
                role: partyRole(m.id),
              },
            ];
          })
        : // FFX-2 needs no archetype map: a girl's job is her dressphere.
          build.members.map((m) => ({
            id: m.id,
            name: m.name,
            sub: `LV ${m.level} &middot; ${m.owned.length} DRESSPHERES`,
            role: m.currentDressphere.replace(/-/g, ' '),
          }));

    return slots
      .map(
        (s) => `
          <div class="prep__slot">
            <div class="prep__face">${this.faceHtml(s.id, s.name)}</div>
            <div>
              <div class="prep__slot-name">${escapeHtml(s.name)}</div>
              <div class="prep__slot-sub">${s.sub}</div>
            </div>
            ${s.role ? `<div class="prep__slot-role">${escapeHtml(s.role.toUpperCase())}</div>` : ''}
          </div>
        `,
      )
      .join('');
  }

  private renderBody(): void {
    const body = this.body;
    if (!body) return;
    const panel = this.tabs[this.index];
    if (!panel) {
      body.classList.remove('prep__sheet-inner--panel');
      body.innerHTML = this.statSheet();
      return;
    }
    body.classList.add('prep__sheet-inner--panel');
    if (!this.mounted.has(panel.id)) {
      body.replaceChildren();
      panel.mount(body, { chapter: this.chapter });
      this.mounted.add(panel.id);
    }
  }

  /**
   * The selected member's sheet, two columns of key/value rows — what the
   * approved board shows when no panel has claimed the slab. FFX reads a
   * `StatBlock`; FFX-2 has none (stats there are a function of dressphere x
   * level), so it reports what a girl actually carries in.
   *
   * `[label, value, isWord?]` — `isWord` sets the value in the serif, for a
   * dressphere name rather than a number.
   */
  private statSheet(): string {
    const build = this.chapter.buildRef;
    let rows: Array<[string, string, boolean?]>;

    if (build.game === 'ffx') {
      const m = build.members[this.member];
      if (!m) return '';
      const st = m.stats;
      rows = [
        ['HP', String(st.maxHp)],
        ['MP', String(st.maxMp)],
        ['STRENGTH', String(st.str)],
        ['DEFENSE', String(st.def)],
        ['MAGIC', String(st.mag)],
        ['MAGIC DEF', String(st.mdef)],
        ['AGILITY', String(st.agi)],
        ['LUCK', String(st.luck)],
        ['EVASION', String(st.eva)],
        ['ACCURACY', String(st.acc)],
      ];
    } else {
      const m = build.members[this.member];
      if (!m) return '';
      rows = [
        ['LEVEL', String(m.level)],
        ['DRESSPHERE', m.currentDressphere.replace(/-/g, ' '), true],
        ['HP', m.hp === undefined ? 'Full' : String(m.hp)],
        ['MP', m.mp === undefined ? 'Full' : String(m.mp)],
        ['DRESSPHERES', String(m.owned.length)],
        ['ACCESSORIES', String(m.accessories.length)],
      ];
    }

    // The grid fills row-major two at a time, so the final pair is the last
    // row of both columns; those close the block instead of ruling under it.
    return rows
      .map(([k, v, isWord], i) => {
        const last = i >= rows.length - 2 ? ' prep__stat--last' : '';
        const vClass = isWord === true ? 'prep__stat-v prep__stat-v--text' : 'prep__stat-v';
        return `<div class="prep__stat${last}">
            <span class="prep__stat-k">${k}</span>
            <span class="${vClass}">${escapeHtml(v.toUpperCase())}</span>
          </div>`;
      })
      .join('');
  }

  override handleInput(input: InputSnapshot): void {
    const panel = this.tabs[this.index];
    if (panel?.handleInput?.(input)) return;

    if (this.tabs.length > 1) {
      if (input.justPressed('right')) this.move(1);
      if (input.justPressed('left')) this.move(-1);
    }
    // Up/Down walks the roster column, which the shell's own sheet follows.
    if (input.justPressed('down')) this.moveMember(1);
    if (input.justPressed('up')) this.moveMember(-1);
    if (input.justPressed('confirm') || input.justPressed('start')) {
      audio.playSfx('confirm');
      this.settle(true);
    }
    if (input.justPressed('cancel')) {
      audio.playSfx('cancel');
      this.settle(false);
    }
  }

  private move(dir: 1 | -1): void {
    const n = this.tabs.length;
    this.index = (this.index + dir + n) % n;
    audio.playSfx('cursor-move');
    this.renderTabs();
    this.renderBody();
  }

  /** Move the roster cursor and repoint the sheet at whoever it lands on. */
  private moveMember(dir: 1 | -1): void {
    const n = this.chapter.buildRef.members.length;
    if (n <= 1) return;
    this.member = (this.member + dir + n) % n;
    audio.playSfx('cursor-move');
    this.renderRoster();
    if (!this.tabs.length) this.renderBody();
  }

  override trigger(name: string): boolean {
    if (name === 'prep:begin') {
      this.settle(true);
      return true;
    }
    if (name === 'prep:back') {
      this.settle(false);
      return true;
    }
    if (name.startsWith('prep:member-')) {
      const i = Number(name.slice('prep:member-'.length));
      if (!Number.isInteger(i) || i < 0 || i >= this.chapter.buildRef.members.length) return false;
      this.member = i;
      this.renderRoster();
      if (!this.tabs.length) this.renderBody();
      return true;
    }
    if (name.startsWith('prep:tab:')) {
      const i = this.tabs.findIndex((t) => t.id === name.slice(9));
      if (i < 0) return false;
      this.index = i;
      this.renderTabs();
      this.renderBody();
      return true;
    }
    return false;
  }

  override exit(): void {
    for (const panel of this.tabs) {
      if (this.mounted.has(panel.id)) panel.unmount?.();
    }
    this.mounted.clear();
    this.stage?.destroy();
    this.stage = null;
    this.settle(false);
  }

  override snapshot(): Record<string, unknown> {
    return {
      chapter: this.chapter.id,
      game: this.chapter.game,
      tabs: this.tabs.map((t) => t.id),
      tab: this.tabs[this.index]?.id ?? null,
      member: this.chapter.buildRef.members[this.member]?.id ?? null,
      panelsRegistered: this.tabs.length,
    };
  }
}
