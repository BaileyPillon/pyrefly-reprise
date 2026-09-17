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
 */

import type { FFXPartyBuild } from '../../../battle/common/types.ts';
import type { PrepPanel, PrepPanelContext } from '../../../app/screens/PartyPrepScreen.ts';
import type { InputSnapshot } from '../../../app/Input.ts';
import { audio } from '../../../audio/index.ts';
import { SphereGridView } from './SphereGridView.ts';
import { SphereGridModel } from './sphereGridModel.ts';
import {
  NODE_BY_ID,
  SPHERE_FAMILIES,
  nodeCostLabel,
  nodeEffect,
  sphereColor,
  sphereLabel,
  sphereTag,
  type GridNode,
} from './sphereGridData.ts';

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

/** AP to the next Sphere Level [battle/common/types.ts `SphereGridState.ap`]. */
function apForLevel(sLv: number): number {
  return Math.min(5 * (sLv + 1) + Math.floor(sLv ** 3 / 50), 22000);
}

const WALK_HINT_ON = 'WALKING — DIRECTIONS STEP  ·  ENTER ACTS  ·  ESC RELEASES';
const WALK_HINT_OFF = 'WHEEL ZOOM  ·  DRAG PAN  ·  CLICK A NODE  ·  SHIFT WALKS';

export function makeSphereGridPanel(): PrepPanel {
  let view: SphereGridView | null = null;
  let model: SphereGridModel | null = null;
  let build: FFXPartyBuild | null = null;
  let memberId = '';
  let walking = false;
  let caption = '';

  let root: HTMLElement | null = null;
  const q = <T extends HTMLElement>(sel: string): T | null => root?.querySelector<T>(sel) ?? null;

  // ------------------------------------------------------------- rendering

  /**
   * The node the ivory row talks about: whatever the pointer is over, else
   * wherever the keyboard cursor sits. The canvas tooltip resolves it the
   * same way, so the two lines never describe two different nodes.
   */
  const focusNode = (): GridNode | null => view?.hoverNode ?? view?.cursorNode ?? null;

  const renderHeader = (): void => {
    const member = model?.memberBuild(memberId);
    if (!member) return;
    const sLv = member.sphereGrid.sLv;
    const need = apForLevel(sLv);
    const pct = need > 0 ? Math.max(0, Math.min(100, (member.sphereGrid.ap / need) * 100)) : 0;
    const who = q('.ffxprep-sg__who');
    if (who) who.textContent = member.name;
    const lv = q('.ffxprep-sg__slv-n');
    if (lv) lv.textContent = String(sLv);
    const fill = q<HTMLElement>('.ffxprep-sg__ap-fill');
    if (fill) fill.style.width = `${pct.toFixed(1)}%`;
    const apn = q('.ffxprep-sg__ap-n');
    if (apn) apn.textContent = `AP ${member.sphereGrid.ap} / ${need}`;
    const toggle = q('.ffxprep-sg__walk');
    if (toggle) {
      toggle.textContent = walking ? 'WALKING' : 'WALK';
      toggle.classList.toggle('ffxprep-sg__walk--on', walking);
    }

    // The shell prints `S.LV nn` on the roster row and only redraws the column
    // when its own cursor moves, so spending a Sphere Level here would leave
    // the row lying until the next Up/Down. This is the one line of the
    // shell's DOM this panel touches, and only to keep the two in step —
    // `.prep__member--sel` is by definition the member the panel is showing.
    const rosterLv = document.querySelector<HTMLElement>('.prep__member--sel .prep__member-lv');
    if (rosterLv && rosterLv.textContent?.startsWith('S.LV')) rosterLv.textContent = `S.LV ${sLv}`;
  };

  const renderPouch = (): void => {
    const strip = q('.ffxprep-sg__pouch');
    if (!strip || !model) return;
    const cursor = focusNode();
    strip.innerHTML = SPHERE_FAMILIES.map((family) => {
      const held = model!.spheresHeld(family);
      const wanted = cursor?.sphere === family;
      return `<span class="ffxprep-sg__sphere${held > 0 ? '' : ' ffxprep-sg__sphere--out'}${
        wanted ? ' ffxprep-sg__sphere--wanted' : ''
      }" title="${escapeHtml(sphereLabel(family))}">
          <i style="background:${sphereColor(family)}"></i>${escapeHtml(sphereTag(family))}
          <b>${held}</b>
        </span>`;
    }).join('');
  };

  const renderCaption = (): void => {
    const el = q('.ffxprep-sg__caption');
    if (!el) return;
    const node = focusNode();
    if (caption) {
      el.innerHTML = `<b>${escapeHtml(caption)}</b>`;
      return;
    }
    if (!node || !model) {
      el.textContent = 'Hover or walk to a node to read what it grants.';
      return;
    }
    const check = model.canActivate(memberId, node.id);
    const grid = model.gridFor(memberId);
    // The cost only matters while the node is still worth spending on; once it
    // is activated the caption needs the room for what Enter does instead.
    const spent = grid?.activated.has(node.id) === true || (node.kind === 'lock' && model.unlocked.has(node.id));
    const cost = spent ? null : nodeCostLabel(node);
    // Enter (and the second click) only ever acts on the *cursor* node, so a
    // node the pointer is merely passing over says what a click would do
    // instead of promising a key that would act somewhere else.
    const atCursor = node.id === (view?.cursorNode?.id ?? -1);
    const verb = atCursor ? 'Enter' : 'Click';
    const action = check.ok
      ? node.kind === 'lock'
        ? `${verb} opens it`
        : `${verb} activates it`
      : grid && grid.position !== node.id && model.reachable(memberId).includes(node.id)
        ? `${verb} moves here (${model.moveCost(memberId, node.id) === 1 ? '1 S.Lv' : '1/4 S.Lv'})`
        : check.reason;
    el.innerHTML =
      `<b>${escapeHtml(nodeEffect(node))}</b>` +
      (cost ? ` <span class="ffxprep-sg__cost">${escapeHtml(cost)}</span>` : '') +
      ` <span class="ffxprep-sg__act">${escapeHtml(action)}</span>`;
  };

  const renderAll = (): void => {
    renderHeader();
    renderPouch();
    renderCaption();
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
   * One key, one obvious meaning: open an adjacent lock, activate the node
   * you stand on, or step onto a linked node.
   */
  const act = (nodeId: number): void => {
    if (!model || !view) return;
    const grid = model.gridFor(memberId);
    const node = NODE_BY_ID.get(nodeId);
    if (!grid || !node) return;
    if (node.kind === 'lock' && !model.unlocked.has(node.id)) {
      const r = model.activate(memberId, nodeId);
      say(r.message, r.ok);
      return;
    }
    if (nodeId === grid.position) {
      const r = model.activate(memberId, nodeId);
      say(r.message, r.ok);
      return;
    }
    const r = model.moveTo(memberId, nodeId);
    if (r.ok) view.centreOn(nodeId);
    say(r.message, r.ok);
  };

  const showMember = (id: string): void => {
    if (!model || !view) return;
    if (!model.memberBuild(id)) return;
    memberId = id;
    caption = '';
    view.show(model, id);
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
      container.innerHTML = `
        <div class="ffxprep-sg">
          <div class="ffxprep-sg__head">
            <span class="ffxprep-sg__who"></span>
            <span class="ffxprep-sg__slv">S.LV <b class="ffxprep-sg__slv-n">0</b></span>
            <span class="ffxprep-sg__ap"><i class="ffxprep-sg__ap-fill"></i></span>
            <span class="ffxprep-sg__ap-n"></span>
            <span class="ffxprep-sg__spacer"></span>
            <button type="button" class="ffxprep-sg__btn ffxprep-sg__walk" data-sg="walk">WALK</button>
            <button type="button" class="ffxprep-sg__btn" data-sg="out" aria-label="Zoom out">&minus;</button>
            <button type="button" class="ffxprep-sg__btn" data-sg="in" aria-label="Zoom in">+</button>
            <button type="button" class="ffxprep-sg__btn" data-sg="home">CENTRE</button>
          </div>
          <div class="ffxprep-sg__slot"></div>
          <div class="ffxprep-sg__foot">
            <div class="ffxprep-sg__caption"></div>
            <div class="ffxprep-sg__pouch"></div>
          </div>
        </div>
      `;

      view = new SphereGridView();
      view.hint = WALK_HINT_OFF;
      container.querySelector('.ffxprep-sg__slot')?.appendChild(view.el);
      view.setHandlers({
        onHover: () => {
          renderPouch();
          renderCaption();
        },
        onSelect: () => {
          caption = '';
          renderPouch();
          renderCaption();
        },
        onAct: (id) => act(id),
      });
      view.mount();

      if (build) {
        model = new SphereGridModel(build);
        showMember(ctx.memberId || (build.members[0]?.id ?? ''));
      }

      container.addEventListener('click', (e) => {
        const btn = (e.target as HTMLElement | null)?.closest<HTMLElement>('[data-sg]');
        if (!btn || !view) return;
        const what = btn.dataset['sg'];
        if (what === 'in') view.zoomBy(1.25);
        else if (what === 'out') view.zoomBy(1 / 1.25);
        else if (what === 'home') view.recentre();
        else if (what === 'walk') setWalking(!walking);
        // A focused <button> turns the next Enter into a second click on
        // itself, which would toggle WALK straight back off *and* let the
        // shell see the same Enter and start the battle. Drop focus instead.
        btn.blur();
        audio.playSfx('cursor-move');
        renderAll();
      });
    },

    unmount() {
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
