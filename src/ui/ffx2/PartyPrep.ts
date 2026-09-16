import './theme.css';
import './party-prep.css';
import type { FFX2MemberBuild, FFX2PartyBuild } from '../../battle/common/types.ts';
import { dressphereIconHtml, dressphereLabel, portraitHtml } from './dressphereIcons.ts';
import type { GarmentGridDef } from './SpherechangeWheel.ts';

/**
 * The X-2 party-prep menus: dressphere assignment, a read-only Garment Grid
 * summary strip (§4.4 — the in-battle wheel in `SpherechangeWheel.ts` is a
 * different, interactive screen), accessories and items.
 *
 * Real Garment Grid *graphs* are data-owned and do not exist yet; pass them
 * via the optional fourth argument (`gridDefs`, keyed by `GarmentGridState.id`)
 * once a data agent ships `data/ffx2/garment-grids`. Without it the strip
 * falls back to naming the grid id.
 *
 * Accessory ids are not yet part of any contract (X-2 has no `AutoAbilityId`
 * equivalent), so the picker cycles a small placeholder catalog — swap
 * {@link PLACEHOLDER_ACCESSORIES} for the real one when it lands.
 */
const PLACEHOLDER_ACCESSORIES = ['(none)', 'ribbon', 'guard-bangle', 'mana-tonic', 'developers-ring'];
const TABS = ['dressphere', 'grid', 'accessories', 'items'] as const;
type Tab = (typeof TABS)[number];
const TAB_LABELS: Record<Tab, string> = {
  dressphere: 'Dressphere',
  grid: 'Garment Grid',
  accessories: 'Accessories',
  items: 'Items',
};

export interface PartyPrepHandle {
  unmount(): void;
}

export function mountFFX2PartyPrep(
  root: HTMLElement,
  build: FFX2PartyBuild,
  onDone: (build: FFX2PartyBuild) => void,
  gridDefs?: Record<string, GarmentGridDef>,
): PartyPrepHandle {
  const el = document.createElement('div');
  el.className = 'ffx2-win ffx2prep';
  root.appendChild(el);

  let memberIdx = 0;
  let tab: Tab = 'dressphere';

  const member = (): FFX2MemberBuild => build.members[memberIdx]!;

  function memberListHtml(): string {
    return build.members
      .map((m, i) => {
        const sel = i === memberIdx ? ' ffx2prep__member--sel' : '';
        return `<div class="ffx2prep__member${sel}" data-member="${i}">
          ${portraitHtml(m.id, m.name, 26)}
          <span class="ffx2-text">${m.name}</span>
        </div>`;
      })
      .join('');
  }

  function tabsHtml(): string {
    return TABS.map((t) => `<div class="ffx2prep__tab${t === tab ? ' ffx2prep__tab--sel' : ''}" data-tab="${t}">${TAB_LABELS[t]}</div>`).join('');
  }

  function dressphereTabHtml(m: FFX2MemberBuild): string {
    return `<div class="ffx2prep__list">${m.owned
      .map((id) => {
        const sel = id === m.currentDressphere ? ' ffx2prep__row--sel' : '';
        return `<div class="ffx2prep__row${sel}" data-dressphere="${id}">
          ${dressphereIconHtml(id, { size: 22 })}
          <span class="ffx2-text">${dressphereLabel(id)}</span>
          ${id === m.currentDressphere ? '<span class="ffx2-text-hi">WORN</span>' : ''}
        </div>`;
      })
      .join('')}</div>`;
  }

  function gridTabHtml(m: FFX2MemberBuild): string {
    const def = gridDefs?.[m.garmentGrid.id];
    if (!def) {
      return `<div class="ffx2prep__grid-fallback ffx2-text-dim">Grid "${m.garmentGrid.id}" — node ${m.garmentGrid.nodePosition + 1}. Gates passed: ${m.garmentGrid.passedGates.join(', ') || 'none'}.</div>`;
    }
    const nodes = def.nodes
      .map((n, i) => {
        const cur = i === m.garmentGrid.nodePosition;
        const icon = n.dressphereId
          ? dressphereIconHtml(n.dressphereId, { size: 20, ringClass: cur ? 'ffx2-icon--worn' : '' })
          : `<span class="ffx2-icon ffx2-icon--empty" style="width:20px;height:20px"></span>`;
        return `<span class="ffx2prep__gridnode">${icon}</span>`;
      })
      .join('<span class="ffx2prep__gridlink"></span>');
    return `<div class="ffx2prep__gridname ffx2-text-hi">${def.name.toUpperCase()}</div><div class="ffx2prep__gridstrip">${nodes}</div>`;
  }

  function accessoriesTabHtml(m: FFX2MemberBuild): string {
    return [0, 1]
      .map((slot) => {
        const current = m.accessories[slot] ?? '(none)';
        return `<div class="ffx2prep__row" data-accessory-slot="${slot}">
          <span class="ffx2-text">Slot ${slot + 1}</span>
          <span class="ffx2-text-hi">${current}</span>
        </div>`;
      })
      .join('');
  }

  function itemsTabHtml(): string {
    if (!build.inventory.length) return `<div class="ffx2-text-dim">No items.</div>`;
    return `<div class="ffx2prep__list">${build.inventory
      .map((e) => `<div class="ffx2prep__row"><span class="ffx2-text">${e.itemId}</span><span class="ffx2-text-hi">x${e.count}</span></div>`)
      .join('')}</div>`;
  }

  function bodyHtml(m: FFX2MemberBuild): string {
    if (tab === 'dressphere') return dressphereTabHtml(m);
    if (tab === 'grid') return gridTabHtml(m);
    if (tab === 'accessories') return accessoriesTabHtml(m);
    return itemsTabHtml();
  }

  function render(): void {
    const m = member();
    el.innerHTML = `
      <div class="ffx2prep__members">${memberListHtml()}</div>
      <div class="ffx2prep__tabs">${tabsHtml()}</div>
      <div class="ffx2prep__body">${bodyHtml(m)}</div>
      <div class="ffx2prep__gil ffx2-text-dim">Gil ${build.gil.toLocaleString()}</div>
    `;
    wire();
  }

  function wire(): void {
    el.querySelectorAll<HTMLElement>('[data-member]').forEach((e) => {
      e.addEventListener('click', () => {
        memberIdx = Number(e.dataset['member']);
        render();
      });
    });
    el.querySelectorAll<HTMLElement>('[data-tab]').forEach((e) => {
      e.addEventListener('click', () => {
        tab = e.dataset['tab'] as Tab;
        render();
      });
    });
    el.querySelectorAll<HTMLElement>('[data-dressphere]').forEach((e) => {
      e.addEventListener('click', () => {
        const id = e.dataset['dressphere']!;
        if (!member().owned.includes(id)) return;
        member().currentDressphere = id;
        onDone(build);
        render();
      });
    });
    el.querySelectorAll<HTMLElement>('[data-accessory-slot]').forEach((e) => {
      e.addEventListener('click', () => {
        const slot = Number(e.dataset['accessorySlot']);
        const m = member();
        const working: [string, string] = [m.accessories[0] ?? '(none)', m.accessories[1] ?? '(none)'];
        const next = PLACEHOLDER_ACCESSORIES[(PLACEHOLDER_ACCESSORIES.indexOf(working[slot] ?? '(none)') + 1) % PLACEHOLDER_ACCESSORIES.length]!;
        working[slot as 0 | 1] = next;
        m.accessories = working.filter((a) => a !== '(none)');
        onDone(build);
        render();
      });
    });
  }

  render();

  return {
    unmount(): void {
      el.remove();
    },
  };
}
