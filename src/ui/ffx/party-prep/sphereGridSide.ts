/**
 * The markup of the Sphere Grid tab's option B (Bailey's pick D-295): the
 * portrait rail, the header, the selected-node card, the legend in words and
 * the pouch in words. Targets `docs/concepts/fb-0929/sphere/option-b-layout.jpg`
 * (1600x900) and `option-b-phone.jpg` (390x844); the CSS
 * (`sphere-grid-b.css`, `sphere-grid-b-phone.css`) lays the same DOM out as
 * the desktop board or the phone's stacked page.
 *
 * Pure `data -> HTML`, so it is testable without a canvas. **Game case: FFX
 * only.** The Sphere Grid is FFX's levelling board [research/visual-bible.md §5.4].
 */

import type { FFXPartyBuild } from '../../../battle/common/types.ts';
import { escapeHtml } from '../../common/html.ts';
import { partyFaceHtml } from '../../common/partyFace.ts';
import { LEGEND, NODE_BY_ID, sphereColor, sphereItemId, sphereLabel, statTag } from './sphereGridData.ts';
import type { NodePreview } from './sphereGridPreview.ts';
import { sphereShort } from './sphereGridPreview.ts';

/** The tab's DOM. The classes the older layout used are kept where the element is the same. */
export function sphereGridMarkup(): string {
  return `
    <div class="ffxprep-sg sgb">
      <div class="sgb-rail" data-role="sg-rail"></div>
      <div class="ffxprep-sg__head">
        <div class="sgb-title">
          <span class="ffxprep-sg__who"></span>
          <span class="ffxprep-sg__slv">S.LV <b class="ffxprep-sg__slv-n">0</b><span class="sgb-after" hidden> &rarr; <i class="sgb-after-n"></i></span></span>
        </div>
        <div class="sgb-tools">
          <button type="button" class="ffxprep-sg__btn ffxprep-sg__auto" data-sg="auto">AUTO-LEARN<span class="ffxprep-sg__key" data-pad="SELECT">M</span></button>
          <button type="button" class="ffxprep-sg__btn ffxprep-sg__walk" data-sg="walk">WALK</button>
          <button type="button" class="ffxprep-sg__btn" data-sg="out" aria-label="Zoom out">&minus;</button>
          <button type="button" class="ffxprep-sg__btn" data-sg="in" aria-label="Zoom in">+</button>
          <button type="button" class="ffxprep-sg__btn" data-sg="home">CENTRE</button>
          <button type="button" class="ffxprep-sg__btn ffxprep-sg__help" data-sg="help" aria-label="How the Sphere Grid works (H)">?<span class="ffxprep-sg__key" data-pad="X">H</span></button>
        </div>
      </div>
      <div class="ffxprep-sg__slot"></div>
      <div class="sgb-card" data-role="sg-card"></div>
      <div class="ffxprep-sg__pouch"></div>
      <div class="sgb-legend">${legendHtml()}</div>
    </div>
  `;
}

/** The roster as portraits with each character's S.Lv (the desktop rail and the phone's row of faces). */
export function railHtml(build: FFXPartyBuild, selectedId: string): string {
  return build.members
    .map(
      (m, i) => `
        <div class="sgb-face${m.id === selectedId ? ' sgb-face--sel' : ''}" data-action="prep:member-${i}" role="button" tabindex="0"
             aria-label="${escapeHtml(m.name)}, S.Lv ${m.sphereGrid.sLv}">
          <span class="sgb-face__img"><span class="sgb-face__init">${escapeHtml(m.name.charAt(0))}</span>${partyFaceHtml({ id: m.id, name: m.name })}</span>
          <b class="sgb-face__lv">${m.sphereGrid.sLv}</b>
        </div>`,
    )
    .join('');
}

/** The button's words for each action; the phone adds "TAP AGAIN:" (a second tap on the node does the same). */
const ACTION_WORDS: Record<NodePreview['action'], string> = {
  'walk-activate': 'Walk and activate',
  activate: 'Activate',
  open: 'Walk and open',
  walk: 'Walk there',
  none: '',
};

/** The big line: what the node gives. */
function gainHtml(p: NodePreview): string {
  if (p.change) return `${escapeHtml(p.change.label)} ${p.change.before} <em>&rarr; ${p.change.after}</em>`;
  if (p.learns) return `<span class="sgb-big-words">Learns <em>${escapeHtml(p.learns)}</em></span>`;
  const node = NODE_BY_ID.get(p.nodeId);
  if (p.action === 'open') return `<span class="sgb-big-words">Opens the path <em>for everyone</em></span>`;
  if (node?.kind === 'stat' && node.stat) return `<span class="sgb-big-words">+${node.value} ${escapeHtml(statTag(node.stat))}</span>`;
  if (node?.kind === 'ability') return `<span class="sgb-big-words">Learns an ability</span>`;
  return `<span class="sgb-big-words">Path only</span>`;
}

function sphereWords(p: NodePreview, model: { spheresHeld(f: string | null): number }): string {
  const node = NODE_BY_ID.get(p.nodeId);
  if (p.sphere) return `${escapeHtml(p.sphere.label)} &middot; ${p.sphere.before} &rarr; ${p.sphere.after}`;
  if (node?.sphere && p.action !== 'walk' && p.action !== 'none') return `${escapeHtml(sphereShort(node.sphere))} &middot; ${model.spheresHeld(node.sphere)} held`;
  return 'None';
}

function pathWords(p: NodePreview): string {
  const n = p.steps.length;
  if (!n) return 'Here &middot; 0 S.Lv';
  return `${n} step${n === 1 ? '' : 's'} &middot; ${p.sLvCost} S.Lv`;
}

/**
 * The selected-node card. The desktop shows the kicker, the three rows and
 * the note; the phone shows one sub-line instead (its target's card), from the
 * same markup.
 */
export function cardHtml(p: NodePreview | null, name: string, model: { spheresHeld(f: string | null): number }, note: string): string {
  if (!p) return `<div class="sgb-card__in"><div class="sgb-kicker">Selected node</div><p class="sgb-note ffxprep-sg__caption">${escapeHtml(note)}</p></div>`;
  const node = NODE_BY_ID.get(p.nodeId);
  const words = ACTION_WORDS[p.action];
  // The sphere only matters when the button spends one.
  const spends = node?.sphere && (p.action === 'walk-activate' || p.action === 'activate' || p.action === 'open') ? node.sphere : null;
  const sphereFull = spends ? escapeHtml(sphereLabel(spends)) : '';
  const held = spends ? `${p.sphere ? p.sphere.before : model.spheresHeld(spends)} held` : '';
  const sub = [sphereFull, held, p.steps.length ? `${p.steps.length} step${p.steps.length === 1 ? '' : 's'}, ${p.sLvCost} S.Lv` : '']
    .filter(Boolean)
    .join(' &middot; ');
  const button = words
    ? `<button type="button" class="sgb-go" data-sg="go"${p.ok ? '' : ' disabled aria-disabled="true"'}><span class="sgb-go__tap">Tap again: </span>${escapeHtml(words)}</button>`
    : '';
  const why = p.reason ? `<p class="sgb-why">${escapeHtml(p.reason)}</p>` : '';
  return `
    <div class="sgb-card__in">
      <div class="sgb-kicker">Selected node</div>
      <div class="sgb-card__top">
        <div class="sgb-name">${escapeHtml(p.title)}</div>
        <div class="sgb-big">${gainHtml(p)}</div>
      </div>
      <div class="sgb-sub">${sub || '&nbsp;'}</div>
      <div class="sgb-rows">
        <div class="sgb-row"><span>Sphere</span><b>${sphereWords(p, model)}</b></div>
        <div class="sgb-row"><span>Path</span><b>${pathWords(p)}</b></div>
        <div class="sgb-row"><span>${escapeHtml(name)} after</span><b>S.Lv ${p.ok ? p.sLvAfter : p.sLvBefore}</b></div>
      </div>
      ${button}
      ${why}
      <p class="sgb-note ffxprep-sg__caption">${escapeHtml(note)}</p>
    </div>`;
}

/** The on-grid gold tag at the target: `+2 STR`, `LEARN`, `OPEN`. */
export function routeTag(p: NodePreview): string {
  if (p.change) return `+${p.change.after - p.change.before} ${p.change.label.replace('MAX ', '')}`;
  if (p.learns) return 'LEARN';
  if (p.action === 'open') return 'OPEN';
  return '';
}

/** "What the colours mean", in words (the target's legend card). */
const LEGEND_WORDS: Record<string, string> = {
  HP: 'HP',
  MP: 'MP',
  STR: 'Strength',
  DEF: 'Defense',
  MAG: 'Magic',
  MDF: 'Magic Def',
  AGI: 'Agility',
  ABL: 'Ability',
  LOCK: 'Lock (key)',
  LCK: 'Luck',
  ACC: 'Accuracy',
  EVA: 'Evasion',
};
/** The target's ten entries, in its order (luck, accuracy and evasion stay on the canvas strip's full key). */
const LEGEND_ORDER = ['HP', 'MP', 'STR', 'DEF', 'MAG', 'MDF', 'AGI', 'ABL', 'LOCK'];

export function legendHtml(): string {
  const chips = LEGEND_ORDER.map((k) => {
    const key = LEGEND.find((l) => l.label === k);
    return key ? `<span class="sgb-chip"><i style="background:${key.color}"></i>${escapeHtml(LEGEND_WORDS[k] ?? k)}</span>` : '';
  }).join('');
  return `
    <div class="sgb-kicker sgb-kicker--gold">What the colours mean</div>
    <div class="sgb-legend__grid">${chips}<span class="sgb-chip"><i class="sgb-dot--ring"></i>Not yet taken</span></div>
    <div class="sgb-legend__gold">Gold line: walked ground, 1 S.Lv per 4 steps</div>`;
}

const POUCH: ReadonlyArray<[string, string]> = [
  ['power', 'Power'],
  ['speed', 'Speed'],
  ['mana', 'Mana'],
  ['ability', 'Ability'],
  ['fortune', 'Fortune'],
];

/** The pouch in words, keys folded into one `Keys 4·2·1·1` chip; the family the selected node takes is underlined. */
export function pouchHtml(build: FFXPartyBuild, wanted: string | null): string {
  const held = (f: string): number => build.sphereInventory[sphereItemId(f) ?? ''] ?? 0;
  const chip = (family: string, label: string, value: string, out: boolean, want: boolean): string =>
    `<span class="ffxprep-sg__sphere sgb-pouch-chip${out ? ' ffxprep-sg__sphere--out' : ''}${want ? ' ffxprep-sg__sphere--wanted' : ''}">` +
    `<i style="background:${sphereColor(family)}"></i>${escapeHtml(label)} <b>${value}</b></span>`;
  const keys = ['key1', 'key2', 'key3', 'key4'].map(held);
  return (
    POUCH.map(([f, label]) => chip(f, label, String(held(f)), held(f) < 1, wanted === f)).join('') +
    chip('key1', 'Keys', keys.join('&middot;'), keys.every((n) => n < 1), wanted?.startsWith('key') === true)
  );
}
