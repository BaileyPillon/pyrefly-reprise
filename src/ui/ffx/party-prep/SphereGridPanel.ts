/**
 * The Sphere Grid tab: a composing `PrepPanel` (`fullScreen: false`) that
 * fills the shell's ivory sheet with the whole screen the visual bible asks
 * for [research/visual-bible.md §5.4] — an `S.Lv` header with its AP bar, the
 * pan/zoom node graph, the sphere pouch strip along the bottom, and a caption
 * line that says what the node under the cursor does and what it costs.
 *
 * Division of labour:
 *   - `sphereGridData.ts`  loads and indexes the two JSON files and owns the
 *                          palette / labels (there is no data-side loader).
 *   - `sphereGridModel.ts` owns movement, activation and the writes back into
 *                          the live `FFXPartyBuild`.
 *   - `SphereGridView.ts`  owns the canvas: resolution, pan/zoom, drawing.
 *   - this file            owns the ivory chrome, the keyboard contract and
 *                          the wiring between the three.
 *
 * Contrast: everything outside the canvas is ink on paper (`--ig-ink` on
 * `.prep__sheet`'s `--ig-paper`), because the slab it sits on is ivory. The
 * revision this replaced printed its one caption in `--ig-paper` on that
 * ivory, which is the near-invisible "Tidus — S.Lv 30" in
 * `docs/screenshots/42b-sphere-grid.png`.
 *
 * Keyboard: the shell owns Up/Down (roster) and Left/Right (tabs), so the
 * grid does not simply grab the d-pad. **Shift/Tab/Q** toggles *walk mode*;
 * while it is on the panel consumes the directions (walk the cursor along
 * links), Enter (act) and Esc (leave walk mode) with `InputSnapshot.consume`
 * so the shell never also sees them and starts the battle. `F`/`R`
 * (PageUp/PageDown, L1/R1) zoom, always.
 *
 * Option B (Bailey's pick D-295, `docs/concepts/fb-0929/sphere/option-b-layout.jpg`
 * and `option-b-phone.jpg`): the grid takes most of the screen beside a rail of
 * portraits; a card names the selected node, what it gives, the sphere it takes
 * and the whole walk's S.Lv, the walk is drawn on the grid, and one WALK AND
 * ACTIVATE (the card's button, a second click or tap on the node, or Enter)
 * does every step through the model's own calls (`sphereGridPreview.ts`). The
 * phone gets its own stacked page (`sphere-grid-b-phone.css`). FFX only.
 */

import type { FFXPartyBuild } from '../../../battle/common/types.ts';
import type { PrepPanel, PrepPanelContext } from '../../../app/screens/PartyPrepScreen.ts';
import type { InputSnapshot } from '../../../app/Input.ts';
import { audio } from '../../../audio/index.ts';
import { SphereGridHelp } from './sphereGridHelp.ts';
import { SphereGridView } from './SphereGridView.ts';
import { SphereGridModel } from './sphereGridModel.ts';
import { nextTarget } from './sphereGridAutoLearn.ts';
import { NODE_BY_ID } from './sphereGridData.ts';
import { previewNode, walkAndActivate, type NodePreview } from './sphereGridPreview.ts';
import { cardHtml, pouchHtml, railHtml, routeTag, sphereGridMarkup } from './sphereGridSide.ts';
import './sphere-grid-b.css';
import './sphere-grid-b-card.css';
import './sphere-grid-b-phone.css';
import './sphere-grid-b-phone-card.css';

/** The card's standing note under its button. */
const CARD_NOTE = 'Enter or click again does the same.';

const WALK_HINT_ON = 'WALKING — DIRECTIONS STEP  ·  ENTER ACTS  ·  ESC RELEASES';
const WALK_HINT_OFF = 'WHEEL ZOOM  ·  DRAG PAN  ·  CLICK A NODE  ·  SHIFT WALKS';

export function makeSphereGridPanel(): PrepPanel {
  let view: SphereGridView | null = null;
  let model: SphereGridModel | null = null;
  let help: SphereGridHelp | null = null;
  let build: FFXPartyBuild | null = null;
  let memberId = '';
  let walking = false;
  let caption = '';

  let root: HTMLElement | null = null;
  const q = <T extends HTMLElement>(sel: string): T | null => root?.querySelector<T>(sel) ?? null;

  // ------------------------------------------------------------- rendering

  /** What the card says about the cursor node; recomputed on every redraw (a dry run through the model). */
  let preview: NodePreview | null = null;

  const renderHeader = (): void => {
    const member = model?.memberBuild(memberId);
    if (!member) return;
    const sLv = member.sphereGrid.sLv;
    const who = q('.ffxprep-sg__who');
    if (who) who.textContent = member.name;
    const lv = q('.ffxprep-sg__slv-n');
    if (lv) lv.textContent = String(sLv);
    // "S.LV 30 -> 28": what the selected walk would leave, while it would spend any.
    const after = q<HTMLElement>('.sgb-after');
    const spends = preview !== null && preview.ok && preview.sLvCost > 0;
    if (after) after.hidden = !spends;
    const afterN = q('.sgb-after-n');
    if (afterN && spends) afterN.textContent = String(preview!.sLvAfter);
    const toggle = q('.ffxprep-sg__walk');
    if (toggle) {
      toggle.textContent = walking ? 'WALKING' : 'WALK';
      toggle.classList.toggle('ffxprep-sg__walk--on', walking);
    }
    const rail = q('[data-role="sg-rail"]');
    if (rail && build) rail.innerHTML = railHtml(build, memberId);
    // The shell's roster row (hidden on this tab, shown again on the others) keeps step too.
    const rosterLv = document.querySelector<HTMLElement>('.prep__member--sel .prep__member-lv');
    if (rosterLv && rosterLv.textContent?.startsWith('S.LV')) rosterLv.textContent = `S.LV ${sLv}`;
  };

  const renderCard = (): void => {
    const el = q('[data-role="sg-card"]');
    if (!el || !model) return;
    el.innerHTML = cardHtml(preview, model.memberBuild(memberId)?.name ?? '', model, caption || CARD_NOTE);
    el.classList.toggle('sgb-card--said', caption !== '');
  };

  const renderPouch = (): void => {
    const strip = q('.ffxprep-sg__pouch');
    if (!strip || !build) return;
    strip.innerHTML = pouchHtml(build, view?.cursorNode?.sphere ?? null);
  };

  const refreshPreview = (): void => {
    const node = view?.cursorNode ?? null;
    preview = model && node && memberId ? previewNode(model, memberId, node.id) : null;
    if (view) {
      view.route = preview && preview.action !== 'none' ? { target: preview.nodeId, steps: preview.steps, tag: routeTag(preview) } : null;
      view.render();
    }
  };

  const renderCaption = (): void => renderCard();

  const renderAll = (): void => {
    refreshPreview();
    renderHeader();
    renderPouch();
    renderCard();
  };

  // --------------------------------------------------------------- actions

  const say = (message: string, ok: boolean): void => {
    caption = message;
    audio.playSfx(ok ? 'confirm' : 'error');
    renderAll();
    window.setTimeout(() => {
      if (caption === message) {
        caption = '';
        renderCaption();
      }
    }, 2600);
  };

  /**
   * One key, one obvious meaning (option B): walk every step to the node and
   * act on it (activate it, or open the lock beside the walk), or walk there
   * when there is nothing to activate. All through the model; all or nothing.
   */
  const act = (nodeId: number): void => {
    if (!model || !view) return;
    if (!NODE_BY_ID.has(nodeId) || !model.gridFor(memberId)) return;
    // Any move of the player's own settles an open AUTO-LEARN result as kept.
    help?.keep(false);
    const r = walkAndActivate(model, memberId, nodeId);
    if (r.ok && r.preview.steps.length) view.centreOn(model.gridFor(memberId)!.position);
    say(r.message, r.ok);
  };

  /** Put the cursor on the cheapest node worth taking, so the card opens on something to do (the target's opening view). */
  const selectSuggested = (): void => {
    if (!model || !view) return;
    const path = nextTarget(model, memberId);
    const id = path?.[path.length - 1];
    if (id !== undefined) view.setCursor(id);
  };

  const showMember = (id: string): void => {
    if (!model || !view) return;
    if (!model.memberBuild(id)) return;
    if (id !== memberId) help?.keep(false);
    memberId = id;
    caption = '';
    view.show(model, id);
    selectSuggested();
    renderAll();
  };

  const setWalking = (on: boolean): void => {
    walking = on;
    if (view) view.hint = on ? WALK_HINT_ON : WALK_HINT_OFF;
    renderHeader();
    view?.render();
  };

  // ------------------------------------------------------------ the panel

  return {
    id: 'sphere-grid',
    label: 'Sphere Grid',
    game: 'ffx',
    order: 10,
    fullScreen: false,

    mount(container, ctx: PrepPanelContext) {
      root = container;
      build = ctx.chapter.buildRef.game === 'ffx' ? ctx.chapter.buildRef : null;
      container.innerHTML = sphereGridMarkup();

      view = new SphereGridView();
      view.hint = WALK_HINT_OFF;
      container.querySelector('.ffxprep-sg__slot')?.appendChild(view.el);
      view.setHandlers({
        onSelect: () => {
          caption = '';
          renderAll();
        },
        onAct: (id) => act(id),
      });
      view.mount();

      if (build) {
        model = new SphereGridModel(build);
        showMember(ctx.memberId || (build.members[0]?.id ?? ''));
      }

      // D-290: the first-time explainer (A) and AUTO-LEARN with undo (C).
      help = new SphereGridHelp({
        container,
        model: () => model,
        view: () => view,
        memberId: () => memberId,
        memberName: () => model?.memberBuild(memberId)?.name ?? '',
        refresh: renderAll,
        say,
      });
      if (model) help.maybeShowFirstTime();

      container.addEventListener('click', (e) => {
        const btn = (e.target as HTMLElement | null)?.closest<HTMLElement>('[data-sg]');
        if (!btn || !view) return;
        const what = btn.dataset['sg'];
        if (what === 'in') view.zoomBy(1.25);
        else if (what === 'out') view.zoomBy(1 / 1.25);
        else if (what === 'home') view.recentre();
        else if (what === 'walk') setWalking(!walking);
        else if (what === 'auto' || what === 'help') help?.press(what);
        else if (what === 'go') {
          const node = view.cursorNode;
          if (node) act(node.id);
        }
        // A focused <button> turns the next Enter into a second click on
        // itself, which would toggle WALK straight back off *and* let the
        // shell see the same Enter and start the battle. Drop focus instead.
        btn.blur();
        if (what !== 'auto' && what !== 'help' && what !== 'go') audio.playSfx('cursor-move');
        renderAll();
      });
    },

    unmount() {
      help?.destroy();
      help = null;
      view?.unmount();
      view = null;
      model = null;
      build = null;
      root = null;
      walking = false;
    },

    selectMember: showMember,

    handleInput(input: InputSnapshot): boolean {
      if (!view) return false;
      // An open card (A) takes every key; an open result (C) takes the ones it answers to.
      if (help?.handleInput(input)) return true;

      // Zoom is free: the prep shell binds neither shoulder button.
      if (input.consume('r1')) view.zoomBy(1.25);
      if (input.consume('l1')) view.zoomBy(1 / 1.25);

      if (input.justPressed('triangle')) {
        input.consume('triangle');
        setWalking(!walking);
        audio.playSfx('cursor-move');
        return false;
      }
      // Clicking a node focuses the canvas, and someone working the grid with
      // the mouse expects Enter to act on what they just clicked rather than
      // to start the battle — so focus engages the grid's Enter/Esc too, not
      // only walk mode. The d-pad stays the shell's (roster / tabs) unless
      // walk mode is explicitly on.
      const engaged = walking || view.focused;
      if (!engaged) return false;

      // `consume` (rather than returning true) leaves the shell free to
      // process the same frame's pointer actions.
      if (walking) {
        let moved = false;
        if (input.consume('up')) moved = view.moveCursor(0, -1) || moved;
        if (input.consume('down')) moved = view.moveCursor(0, 1) || moved;
        if (input.consume('left')) moved = view.moveCursor(-1, 0) || moved;
        if (input.consume('right')) moved = view.moveCursor(1, 0) || moved;
        if (moved) audio.playSfx('cursor-move');
      }

      if (input.consume('confirm')) {
        const node = view.cursorNode;
        if (node) act(node.id);
      }
      if (input.consume('cancel')) {
        // Esc leaves the grid first and the screen second: one press hands the
        // keys back, the next one is the shell's own BACK.
        if (walking) setWalking(false);
        view.blur();
        audio.playSfx('cancel');
      }
      return false;
    },
  };
}
