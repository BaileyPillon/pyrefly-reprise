/**
 * The DOM of the Sphere Grid's two new cards, built to Bailey's pick D-290
 * (`docs/concepts/fb-0929/sphere/`):
 *
 * - **A**, the first-time explainer (`option-a-explainer.jpg`): MOVE,
 *   ACTIVATE, CLICK TWICE and "not saved on reload", with GOT IT and SHOW ME
 *   ON THE GRID;
 * - **C**, the AUTO-LEARN result (`option-c-autolearn.jpg`): what changed,
 *   with UNDO and KEEP.
 *
 * Markup only; `sphereGridHelp.ts` places, opens and closes them and
 * `sphere-grid-help.css` draws them. The copy is the approved picture's,
 * word for word, with the character's name and the run's own figures
 * filled in. The sphere families it names are the grid data's own
 * (`standard-grid.json`: Power for STR/DEF/HP, Mana for MAG/MDEF/MP, Speed
 * for AGI/ACC/EVA), and the prices are `SphereGridModel.moveCost`'s
 * [ffx-combat-core §10.1]. FFX only.
 */

import type { AutoLearnResult } from './sphereGridAutoLearn.ts';

function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

/** `Tidus's`, `Rikku's`. */
function possessive(name: string): string {
  return `${name}'s`;
}

/** The target says "his own path"; the party's own pronouns, and "their" for anyone else. */
const PRONOUN: Record<string, string> = {
  tidus: 'his',
  wakka: 'his',
  auron: 'his',
  kimahri: 'his',
  yuna: 'her',
  lulu: 'her',
  rikku: 'her',
};

/**
 * Pointer or touch wording (F6): the same swap the first-run guide uses
 * (`.frg__pointer` / `.frg__touch`), flipped by `(pointer: coarse)` in the CSS.
 */
function pt(pointer: string, touch: string): string {
  return `<span class="sgx-pointer">${pointer}</span><span class="sgx-touch">${touch}</span>`;
}

/** Card A: the first-time explainer. Buttons carry `data-sgx` = `got` / `show`. */
export function explainerHtml(name: string): string {
  return `
    <div class="sgx-dim"></div>
    <div class="sgx-card-pos">
      <div class="sgx-slab sgx-card" role="dialog" aria-modal="true" aria-labelledby="sgx-card-title">
        <div class="sgx-in">
          <div class="sgx-kicker">First time on the Sphere Grid</div>
          <div class="sgx-title" id="sgx-card-title">Spend ${esc(possessive(name))} Sphere Levels before the fight</div>
          <div class="sgx-steps">
            <div class="sgx-step">
              <h3><b>1</b>MOVE</h3>
              <div class="sgx-viz" aria-hidden="true">
                <i class="sgx-l sgx-l--gold" style="left:30px;width:80px"></i><i class="sgx-l" style="left:120px;width:90px"></i>
                <i class="sgx-n" style="left:22px;border-color:#f2c21e;background:#f2c21e"></i>
                <i class="sgx-n" style="left:100px;border-color:#8fd0f0;background:#8fd0f0"></i>
                <i class="sgx-n" style="left:196px;border-color:#f28a6a"></i>
                <span class="sgx-t" style="left:120px;top:6px">1 S.LV</span><span class="sgx-t" style="left:26px;top:6px">1 PER 4</span>
              </div>
              <p>A step onto a new node costs <b>1 S.Lv</b>. Walking back over gold, travelled ground costs 1 S.Lv per <b>4</b> steps.</p>
            </div>
            <div class="sgx-step">
              <h3><b>2</b>ACTIVATE</h3>
              <div class="sgx-viz" aria-hidden="true">
                <i class="sgx-n" style="left:40px;border-color:#f28a6a;background:#f28a6a"></i>
                <span class="sgx-t sgx-t--wide" style="left:74px;top:30px">STR +2 &nbsp;&middot;&nbsp; 1 POWER SPHERE</span>
              </div>
              <p>Stand on a node and spend the sphere it asks for: <b>Power</b> for STR, DEF, HP &middot; <b>Mana</b> for MAG, MDEF, MP &middot; <b>Speed</b> for AGI, ACC, EVA &middot; <b>Ability</b> for abilities &middot; <b>Keys</b> for locks.</p>
            </div>
            <div class="sgx-step">
              <h3><b>3</b>${pt('CLICK', 'TAP')} TWICE</h3>
              <div class="sgx-viz" aria-hidden="true">
                <i class="sgx-n sgx-n--sel" style="left:60px"></i>
                <span class="sgx-t" style="left:100px;top:18px">${pt('CLICK', 'TAP')}: SELECT</span>
                <span class="sgx-t" style="left:100px;top:40px">${pt('AGAIN / ENTER', 'AGAIN')}: DO IT</span>
              </div>
              <p>${pt('Click a node to select it; click it again, or press Enter, to move there or activate it. Drag to pan, wheel to zoom.', 'Tap a node to select it; tap it again to move there or activate it. Drag to pan, pinch to zoom.')}</p>
            </div>
          </div>
          <div class="sgx-note">What you spend here goes into this chapter's fight. It is not saved: reloading the page starts the chapter's preset again.</div>
          <div class="sgx-foot">
            <button type="button" class="sgx-btn sgx-btn--dark" data-sgx="got">Got it</button>
            <button type="button" class="sgx-btn" data-sgx="show">Show me on the grid</button>
            <span class="sgx-chip">Reopen any time with <span class="sgx-btn sgx-btn--dark sgx-q">?</span></span>
          </div>
        </div>
      </div>
    </div>`;
}

/** `3 Power and 1 Speed Sphere`: the noun follows the last count, as the target writes it. */
function spentLine(spent: AutoLearnResult['spent']): string {
  if (!spent.length) return '';
  const parts = spent.map((s) => `<b>${s.count}</b> ${esc(s.label)}`);
  const last = spent[spent.length - 1]!;
  const noun = last.count === 1 ? 'Sphere' : 'Spheres';
  const list = parts.length === 1 ? parts[0]! : `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]!}`;
  return `, ${list} ${noun}`;
}

/** Card C: what AUTO-LEARN changed. Buttons carry `data-sgx` = `undo` / `keep`. */
export function resultHtml(r: AutoLearnResult): string {
  const n = r.activated.length;
  const whose = PRONOUN[r.memberId] ?? 'their';
  const gains = r.gains.map((g) => `<span>${esc(g.label)} ${g.before} <em>&rarr; ${g.after}</em></span>`);
  for (const a of r.learned) gains.push(`<span>LEARNS <em>${esc(a)}</em></span>`);
  const sLv = r.sLvBefore - r.sLvAfter;
  return `
    <div class="sgx-cover" aria-hidden="true"></div>
    <div class="sgx-result-pos">
      <div class="sgx-slab sgx-result" role="status">
        <div class="sgx-in">
          <div class="sgx-kicker">Auto-learned for ${esc(r.name)} &middot; ${n} node${n === 1 ? '' : 's'} along ${whose} own path</div>
          <div class="sgx-gain">${gains.join('')}</div>
          <div class="sgx-line">Spent <b>${sLv} S.Lv</b> (${r.sLvBefore} &rarr; ${r.sLvAfter})${spentLine(r.spent)}.
            <span class="sgx-acts"><button type="button" class="sgx-btn sgx-btn--dark sgx-btn--small" data-sgx="undo">Undo</button><button type="button" class="sgx-btn sgx-btn--small" data-sgx="keep">Keep</button></span></div>
        </div>
      </div>
    </div>`;
}

/** The phone's own row of the two new buttons, 44 px each, under the letterboxed board. */
export function dockHtml(): string {
  return `
    <button type="button" class="sgx-btn sgx-btn--auto sgx-dock__auto" data-sgx="auto">Auto-learn</button>
    <button type="button" class="sgx-btn sgx-btn--auto sgx-dock__help" data-sgx="help" aria-label="How the Sphere Grid works">?</button>`;
}
