import '../ffx-hud.css';
import './party-prep.css';
import type { FFXMemberBuild, FFXPartyBuild } from '../../../battle/common/types.ts';
import { portraitChipHtml, tintFor, wirePortraitFallbacks } from '../portraits.ts';
import { escapeHtml } from '../minigames/params.ts';
import { DetailPanel } from './DetailPanel.ts';
import { SphereGridView } from './SphereGridView.ts';

export interface PartyPrepHandle {
  unmount(): void;
}

function memberById(build: FFXPartyBuild, id: string): FFXMemberBuild | undefined {
  return build.members.find((m) => m.id === id);
}

/**
 * The FFX pre-battle "Party & Sphere Grid" screen [visual-bible §5.4]: a
 * seven-row character list, a tabbed detail panel, and a 3-slot active-party
 * strip feeding a `START BATTLE` button. Mutates `build.activeSlots` and each
 * member's `overdrive.mode` in place; `onDone` is called with the same build
 * object once the player confirms three filled slots.
 */
export function mountFFXPartyPrep(root: HTMLElement, build: FFXPartyBuild, onDone: (build: FFXPartyBuild) => void): PartyPrepHandle {
  const el = document.createElement('div');
  el.className = 'ffxprep';
  el.dataset['role'] = 'ffx-party-prep';
  const stage = document.createElement('div');
  stage.className = 'ffxprep__stage';
  el.appendChild(stage);

  const rosterEl = document.createElement('div');
  rosterEl.className = 'ffxhud-win ffxprep-roster';
  const activeEl = document.createElement('div');
  activeEl.className = 'ffxhud-win ffxprep-active';
  const startEl = document.createElement('div');
  startEl.className = 'ffxprep-start';
  startEl.textContent = 'START BATTLE';
  startEl.dataset['uiAction'] = 'start';

  const detail = new DetailPanel();
  const sphereGrid = new SphereGridView();
  sphereGrid.el.hidden = true;

  stage.append(rosterEl, detail.el, sphereGrid.el, activeEl, startEl);
  root.appendChild(el);
  sphereGrid.mount();

  let selectedId = build.activeSlots[0] ?? build.members[0]?.id ?? '';

  function layout(): void {
    const rect = el.getBoundingClientRect();
    const w = rect.width || window.innerWidth;
    const h = rect.height || window.innerHeight;
    const scale = Math.min(w / 640, h / 360);
    const x = (w - 640 * scale) / 2;
    const y = (h - 360 * scale) / 2;
    stage.style.transform = `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px) scale(${scale.toFixed(4)})`;
  }

  function renderRoster(): void {
    rosterEl.innerHTML = build.members
      .map((m) => {
        const isActive = build.activeSlots.includes(m.id);
        const cls = ['ffxprep-roster__row', m.id === selectedId ? 'ffxprep-roster__row--selected' : '', isActive ? 'ffxprep-roster__row--active' : '']
          .filter(Boolean)
          .join(' ');
        const hpPct = Math.max(0, Math.min(100, (m.hp / m.stats.maxHp) * 100));
        const odPct = Math.max(0, Math.min(100, m.overdrive.gauge));
        return `<div class="${cls}" data-member="${m.id}">
          <span class="ffxprep-roster__portrait">${portraitChipHtml(m.portraitKey, m.name, tintFor('party'))}</span>
          <span class="ffxprep-roster__info">
            <div class="ffxprep-roster__name">${escapeHtml(m.name)}</div>
            <div class="ffxprep-roster__slv">S.Lv ${m.sphereGrid.sLv}</div>
            <span class="ffxprep-roster__bar"><i style="width:${hpPct}%"></i></span>
            <span class="ffxprep-roster__bar ffxprep-roster__bar--od"><i style="width:${odPct}%"></i></span>
          </span>
        </div>`;
      })
      .join('');
    wirePortraitFallbacks(rosterEl);
    rosterEl.querySelectorAll<HTMLElement>('[data-member]').forEach((rowEl) => {
      rowEl.addEventListener('click', () => {
        selectedId = rowEl.dataset['member']!;
        renderAll();
      });
    });
  }

  function renderDetail(): void {
    const member = memberById(build, selectedId);
    if (!member) return;
    detail.show(member, build);
    const showGrid = detail.activeTab === 'sphere-grid';
    detail.el.hidden = showGrid;
    sphereGrid.el.hidden = !showGrid;
    if (showGrid) sphereGrid.show(member.sphereGrid, member.name);
  }

  function renderActiveStrip(): void {
    const slots = [0, 1, 2].map((i) => {
      const id = build.activeSlots[i];
      const m = id ? memberById(build, id) : undefined;
      if (!m) return `<div class="ffxprep-active__slot" data-slot="${i}">EMPTY</div>`;
      return `<div class="ffxprep-active__slot ffxprep-active__slot--filled" data-slot="${i}">
        <span class="ffxprep-roster__portrait">${portraitChipHtml(m.portraitKey, m.name, tintFor('party'))}</span>
        <span>
          <div class="ffxprep-active__name">${escapeHtml(m.name)}</div>
          <div class="ffxprep-active__hpmp">HP ${m.hp}/${m.stats.maxHp} · MP ${m.mp}/${m.stats.maxMp}</div>
          <div class="ffxprep-active__hpmp">${escapeHtml(m.overdrive.mode)}</div>
        </span>
      </div>`;
    });
    activeEl.innerHTML = slots.join('');
    wirePortraitFallbacks(activeEl);
    activeEl.querySelectorAll<HTMLElement>('[data-slot]').forEach((slotEl) => {
      slotEl.addEventListener('click', () => assignSelectedToSlot(Number(slotEl.dataset['slot'])));
    });
    const filled = build.activeSlots.filter((id) => id && memberById(build, id)).length;
    startEl.toggleAttribute('disabled', filled < 3);
  }

  function assignSelectedToSlot(slotIndex: number): void {
    const next = [...build.activeSlots] as [string, string, string];
    const existingIndex = next.indexOf(selectedId);
    const displaced = next[slotIndex];
    next[slotIndex] = selectedId;
    if (existingIndex >= 0 && existingIndex !== slotIndex) next[existingIndex] = displaced ?? '';
    build.activeSlots = next;
    build.reserve = build.members.map((m) => m.id).filter((id) => !next.includes(id));
    renderAll();
  }

  function renderAll(): void {
    renderRoster();
    renderDetail();
    renderActiveStrip();
  }

  detail.setOnModeChange((memberId, mode) => {
    const m = memberById(build, memberId);
    if (m) m.overdrive.mode = mode;
    renderAll();
  });
  detail.setOnTabChange(() => renderDetail());

  startEl.addEventListener('click', () => {
    if (startEl.hasAttribute('disabled')) return;
    onDone(build);
  });

  const onResize = (): void => layout();
  window.addEventListener('resize', onResize, { passive: true });
  layout();
  renderAll();

  return {
    unmount(): void {
      window.removeEventListener('resize', onResize);
      sphereGrid.unmount();
      el.remove();
    },
  };
}
