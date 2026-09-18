/**
 * The FFX-2 prep tabs: Dresspheres (with the Garment Grid summary),
 * Accessories and Items.
 *
 * Until now the X-2 prep menu had exactly one tab — the chapter briefing — so
 * a player walking into Bahamut or Vegnagun could read the fight but not the
 * party: which dressphere each girl is wearing, what she has learned in it,
 * which Garment Grid is equipped and what it grants, what the accessories
 * actually do, what is in the bag. All of that is already in the build
 * (`src/data/ffx2/builds/*.ts`) and in the engine's own tables; these panels
 * only read it.
 *
 * **Nothing here invents a mechanic and nothing here is editable.** X-2's real
 * prep menu assigns dresspheres and builds Grids; doing that from this screen
 * would change the battle the chapter's research was written against, so the
 * tabs display the loadout and the in-battle Spherechange wheel
 * (`src/ui/ffx2/SpherechangeWheel.ts`) remains the only place a dressphere
 * changes. Every number is quoted from the data layer:
 * `STANDARD_DRESSPHERES`/`SPECIAL_DRESSPHERES` for the AP ladder,
 * `GARMENT_GRIDS` for the Grid, `accessoryEffect()` for the accessories and
 * `FFX2_ITEMS` for the bag.
 *
 * They compose into `PartyPrepScreen`'s Ink & Gold frame (`fullScreen: false`)
 * exactly as the FFX panels do, and read the shared layer only through
 * `var(--ig-*)` [CONTRACT-CHANGES decision 10].
 */

import type { FFX2MemberBuild, FFX2PartyBuild } from '../../../battle/common/types.ts';
import type { PrepPanel, PrepPanelContext } from '../../../app/screens/PartyPrepScreen.ts';
import { accessoryEffect } from '../../../battle/ffx2/accessories.ts';
import { GARMENT_GRIDS, STANDARD_DRESSPHERES, SPECIAL_DRESSPHERES, FFX2_ITEMS, ABILITIES } from '../../../data/ffx2/index.ts';
import { dressphereAbbr, dressphereColour, dressphereLabel } from '../dressphereIcons.ts';
import './party-prep.css';

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

function ffx2Build(ctx: PrepPanelContext): FFX2PartyBuild | null {
  return ctx.chapter.buildRef.game === 'ffx2' ? ctx.chapter.buildRef : null;
}

/** The dressphere's definition, standard or special. */
function dressphereDef(id: string): { name: string; commands: string[]; masteryAp: number; abilities: readonly { abilityId: string; apCost: number }[] } | null {
  const table: Record<string, unknown> = { ...STANDARD_DRESSPHERES, ...SPECIAL_DRESSPHERES };
  const def = table[id] as
    | { name: string; commands: string[]; masteryAp: number; abilities: readonly { abilityId: string; apCost: number }[] }
    | undefined;
  return def ?? null;
}

/** An ability's display name, or its id when the table has not caught up. */
function abilityName(id: string): string {
  return ABILITIES[id]?.name ?? id;
}

/** `A · B · C`, or an em dash. */
function joinOr(parts: readonly string[], empty = '—'): string {
  return parts.length ? parts.map(escapeHtml).join(' &middot; ') : empty;
}

/**
 * The AP clause after `learned/total`.
 *
 * Deliberately not a `banked/cost` fraction: `DressphereProgress.ap` is AP
 * banked toward *the next ability she buys*, and the builds bank it against a
 * rung they have chosen (Yuna's 40 AP is "banked toward Curaga (80 AP)"), not
 * against the cheapest one left on the ladder. Printing "40/30" would read as
 * a full bar that has not paid out. So the bank and the cheapest rung left are
 * two separate facts, stated as two facts.
 */
function apText(ap: number, next: { abilityId: string; apCost: number } | undefined): string {
  const parts: string[] = [];
  if (ap > 0) parts.push(`${ap} AP banked`);
  if (next) parts.push(`next ${abilityName(next.abilityId)} ${next.apCost} AP`);
  return parts.length ? ` &middot; ${parts.join(' &middot; ')}` : '';
}

/**
 * How many learned-ability chips the Dresspheres tab lists before it stops
 * naming them and counts the rest.
 *
 * The ivory sheet is a fixed band — it starts at 75.56 and the hint line is at
 * 213.33 (`src/ui/common/party-prep.css`) — and a Chapter 5 girl has mastered
 * her dressphere, so White Mage's full 16 chips wrapped to five rows and the
 * sheet grew down over `▲▼ PARTY ◄► TABS ENTER BEGINS THE BATTLE ESC BACK`.
 * Ten is what the left column holds in three rows at the widest chip the table
 * has ("White Magic Lv. 3"), and the header already carries the true total.
 */
const MAX_LEARNED_CHIPS = 10;

/** The learned list as chips, with the tail counted rather than named. */
function learnedChipsHtml(learned: readonly string[]): string {
  if (!learned.length) return '<span class="ffxprep-chip ffxprep-chip--empty">&mdash;</span>';
  const shown = learned.slice(0, MAX_LEARNED_CHIPS);
  const rest = learned.length - shown.length;
  const chips = shown.map((a) => `<span class="ffxprep-chip">${escapeHtml(abilityName(a))}</span>`);
  if (rest > 0) chips.push(`<span class="ffxprep-chip x2prep-chip--more">+${rest}</span>`);
  return chips.join('');
}

// ------------------------------------------------------------- Dresspheres

/**
 * The Dresspheres tab: what she is wearing, what she has learned in it, what
 * else she owns, and the Garment Grid that is equipped.
 *
 * The AP line is the real ladder: `learned / total entries` for the worn
 * dressphere plus the banked AP against the next rung's cost, straight out of
 * `DressphereDef.abilities` — the same table the engine reads, so a build's
 * "~190 AP invested" comment and this panel can never disagree.
 */
export function makeDresspherePanel(): PrepPanel {
  let build: FFX2PartyBuild | null = null;
  let bodyEl: HTMLElement | null = null;

  const gridHtml = (m: FFX2MemberBuild): string => {
    const state = m.garmentGrid;
    const def = GARMENT_GRIDS[state.id as keyof typeof GARMENT_GRIDS];
    if (!def) {
      return `<div class="x2prep-grid">
        <div class="x2prep-grid__name">${escapeHtml(state.id)}</div>
        <div class="x2prep-note">Node ${state.nodePosition + 1}.</div>
      </div>`;
    }
    const gates = def.gateColours.length
      ? def.gateColours
          .map(
            (c) =>
              `<i class="x2prep-gate x2prep-gate--${c}${state.passedGates.includes(c) ? ' x2prep-gate--passed' : ''}" title="${c}${
                state.passedGates.includes(c) ? ' (passed)' : ''
              }"></i>`,
          )
          .join('')
      : '<span class="x2prep-note">no gates</span>';
    // The nodes are empty slots the player fills at runtime [garment-grids/
    // types.ts]; the strip shows how many there are and which one she is
    // standing on, which is what `nodePosition` actually means.
    const nodes = Array.from(
      { length: def.nodeCount },
      (_, i) => `<i class="x2prep-node${i === state.nodePosition ? ' x2prep-node--here' : ''}"></i>`,
    ).join('');
    return `<div class="x2prep-grid">
      <div class="x2prep-grid__name"><b>GARMENT GRID</b> ${escapeHtml(def.name)}</div>
      <div class="x2prep-grid__strip">${nodes}<span class="x2prep-grid__gates">${gates}</span>
        <span class="x2prep-note">${escapeHtml(def.equip?.description ?? 'no equip effect')}</span></div>
    </div>`;
  };

  const render = (memberId: string): void => {
    const member = build?.members.find((m) => m.id === memberId);
    if (!bodyEl || !member) return;
    const worn = member.currentDressphere;
    const def = dressphereDef(worn);
    const progress = member.abilitiesLearned[worn];
    const learned = progress?.learned ?? [];
    const total = def?.abilities.length ?? learned.length;
    // The cheapest rung she has not learned yet is what her banked AP is going
    // towards — `DressphereProgress.ap` is "AP banked toward the next ability".
    const next = (def?.abilities ?? [])
      .filter((a) => !learned.includes(a.abilityId as never) && a.apCost > 0)
      .sort((a, b) => a.apCost - b.apCost)[0];
    const others = member.owned.filter((id) => id !== worn);
    // Two columns, because the ivory sheet is 820 units wide and ~138 tall:
    // stacked, this panel ran off the bottom of the sheet and under the START
    // BATTLE button. Worn dressphere across the top, what she knows on the
    // left, what she is carrying it on — the Grid — and the rest of the
    // wardrobe on the right.
    bodyEl.innerHTML = `
      <div class="x2prep-worn" style="--ffx2-job:${dressphereColour(worn)}">
        <span class="x2prep-worn__tile">${dressphereAbbr(worn)}</span>
        <span class="x2prep-worn__name">${escapeHtml(def?.name ?? dressphereLabel(worn))}</span>
        <span class="x2prep-note x2prep-worn__cmds">${joinOr(def?.commands ?? [])}</span>
        <span class="x2prep-worn__lv">LV ${member.level}</span>
      </div>
      <div class="x2prep__col">
        <div class="x2prep-line"><b>LEARNED</b> ${learned.length}/${total}${apText(progress?.ap ?? 0, next)}</div>
        <div class="ffxprep-chips">${learnedChipsHtml(learned)}</div>
      </div>
      <div class="x2prep__col">
        ${gridHtml(member)}
        <div class="x2prep-line"><b>ALSO OWNED</b> ${others.length}</div>
        <div class="x2prep-owned">${others
          .map(
            (id) =>
              `<span class="x2prep-owned__tile" style="--ffx2-job:${dressphereColour(id)}" title="${escapeHtml(
                dressphereLabel(id),
              )}">${dressphereAbbr(id)}</span>`,
          )
          .join('')}</div>
      </div>`;
  };

  return {
    id: 'dresspheres',
    label: 'Dresspheres',
    game: 'ffx2',
    order: 0,
    fullScreen: false,
    mount(root, ctx: PrepPanelContext) {
      build = ffx2Build(ctx);
      root.innerHTML = '<div class="x2prep"></div>';
      bodyEl = root.querySelector('.x2prep');
      render(ctx.memberId);
    },
    unmount() {
      build = null;
      bodyEl = null;
    },
    selectMember: render,
  };
}

// ------------------------------------------------------------- Accessories

/**
 * The Accessories tab: both slots and what each one actually does.
 *
 * The effect text is generated from `battle/ffx2/accessories.ts` — the table
 * the engine reads when it builds the stat block — so a slot can never claim a
 * bonus the fight will not honour. An accessory the baseline table has no row
 * for says so rather than guessing: that is the file's own "anything unknown
 * contributes nothing rather than throwing" rule, made visible.
 */
export function makeAccessoryPanel(): PrepPanel {
  let build: FFX2PartyBuild | null = null;
  let bodyEl: HTMLElement | null = null;

  const effectText = (id: string): string => {
    const effect = accessoryEffect(id);
    if (!effect) return 'no modelled effect';
    const parts: string[] = [];
    for (const [key, value] of Object.entries(effect.stats ?? {})) {
      if (typeof value === 'number' && value !== 0) parts.push(`${key.toUpperCase()} ${value > 0 ? '+' : ''}${value}`);
    }
    if (effect.hpPercent) parts.push(`max HP +${Math.round(effect.hpPercent * 100)}%`);
    if (effect.mpPercent) parts.push(`max MP +${Math.round(effect.mpPercent * 100)}%`);
    return parts.length ? parts.join(', ') : 'no modelled effect';
  };

  const label = (id: string): string =>
    id
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');

  const render = (memberId: string): void => {
    const member = build?.members.find((m) => m.id === memberId);
    if (!bodyEl || !member) return;
    // Two slots, hard limit [types.ts `FFX2Combatant.accessories`].
    bodyEl.innerHTML = [0, 1]
      .map((slot) => {
        const id = member.accessories[slot];
        if (!id) {
          return `<div class="ffxprep-gear">
            <div class="ffxprep-gear__name"><b>SLOT ${slot + 1}</b> <span class="x2prep-note">empty</span></div>
          </div>`;
        }
        return `<div class="ffxprep-gear">
          <div class="ffxprep-gear__name"><b>SLOT ${slot + 1}</b> ${escapeHtml(label(id))}</div>
          <div class="ffxprep-chips"><span class="ffxprep-chip">${escapeHtml(effectText(id))}</span></div>
        </div>`;
      })
      .join('') +
      '<div class="x2prep-note x2prep-foot">Accessories stop working inside a special dressphere.</div>';
  };

  return {
    id: 'accessories',
    label: 'Accessories',
    game: 'ffx2',
    order: 20,
    fullScreen: false,
    mount(root, ctx: PrepPanelContext) {
      build = ffx2Build(ctx);
      root.innerHTML = '<div class="x2prep"></div>';
      bodyEl = root.querySelector('.x2prep');
      render(ctx.memberId);
    },
    unmount() {
      build = null;
      bodyEl = null;
    },
    selectMember: render,
  };
}

// ------------------------------------------------------------------- Items

/** The Items tab: the party bag and the gil, with real item names. Party-wide, so it ignores `selectMember`. */
export function makeItemsPanel(): PrepPanel {
  return {
    id: 'items',
    label: 'Items',
    game: 'ffx2',
    order: 30,
    fullScreen: false,
    mount(root, ctx: PrepPanelContext) {
      const build = ffx2Build(ctx);
      if (!build) {
        root.innerHTML = '<div class="ffxprep-empty">No items.</div>';
        return;
      }
      const rows = build.inventory
        .map(
          (entry) =>
            `<div class="ffxprep-item-row"><span>${escapeHtml(
              FFX2_ITEMS[entry.itemId]?.name ?? entry.itemId,
            )}</span><span class="ffxprep-item-row__qty">&times;${entry.count}</span></div>`,
        )
        .join('');
      root.innerHTML =
        (rows ? `<div class="ffxprep-items">${rows}</div>` : '<div class="ffxprep-empty">No items.</div>') +
        `<div class="x2prep-line"><b>GIL</b> ${build.gil.toLocaleString()}</div>`;
    },
  };
}
