import './hud-mock.css';
import { artUrl } from '../../engine/PaintedArt.ts';

/**
 * A **static** mock of the FFX battle HUD.
 *
 * It is not wired to a battle and has no state machine — it exists so the
 * painted-2.5D art direction can be judged with real UI in frame, and so the
 * agent who builds the live HUD has an exact pixel target. Every coordinate is
 * a verbatim rect from `research/visual-bible.md` §3.1–§3.6, authored on the
 * 640 x 360 logical grid and letterbox-scaled with a single transform.
 *
 * Replace it, do not extend it: the real HUD wants data binding, the CTB slide
 * animation and the damage-numeral pool, none of which belong here.
 */

const CTB_ROWS: Array<{
  who: string;
  side: 'party' | 'enemy';
  portrait?: string;
  tint: string;
  tag?: string;
  overdrive?: boolean;
  label?: string;
}> = [
  { who: 'Tidus', side: 'party', portrait: 'tidus', tint: '#3f6fa8', label: 'TIDUS', overdrive: true },
  { who: 'Seymour', side: 'enemy', portrait: 'seymour-flux', tint: '#4a3a6e', tag: 'A', label: 'SEYMOUR' },
  { who: 'Yuna', side: 'party', portrait: 'yuna', tint: '#b8a37e', label: 'YUNA' },
  { who: 'Mortibody', side: 'enemy', portrait: 'mortibody', tint: '#2e5a4a', tag: 'B' },
  { who: 'Auron', side: 'party', portrait: 'auron', tint: '#7a2a24' },
  { who: 'Tidus', side: 'party', portrait: 'tidus', tint: '#3f6fa8' },
  { who: 'Seymour', side: 'enemy', portrait: 'seymour-flux', tint: '#4a3a6e', tag: 'A' },
  { who: 'Yuna', side: 'party', portrait: 'yuna', tint: '#b8a37e' },
  { who: 'Mortibody', side: 'enemy', portrait: 'mortibody', tint: '#2e5a4a', tag: 'B' },
  { who: 'Auron', side: 'party', portrait: 'auron', tint: '#7a2a24' },
];

/** FFX's base action set plus Tidus's character command (§3.3). */
const COMMANDS: Array<{
  label: string;
  mp?: string;
  disabled?: boolean;
  selected?: boolean;
  ready?: boolean;
}> = [
  { label: 'Attack', selected: true },
  { label: 'Skill' },
  { label: 'Item' },
  { label: 'Defend' },
  { label: 'Overdrive', ready: true },
];

interface PartyRow {
  name: string;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  overdrive: number;
  acting?: boolean;
}

const PARTY: PartyRow[] = [
  { name: 'TIDUS', hp: 2419, maxHp: 2600, mp: 68, maxMp: 92, overdrive: 1, acting: true },
  { name: 'YUNA', hp: 1782, maxHp: 1900, mp: 240, maxMp: 312, overdrive: 0.62 },
  { name: 'AURON', hp: 3080, maxHp: 3080, mp: 34, maxMp: 60, overdrive: 0.28 },
];

/** The 13x11 gloved finger cursor, drawn as inline SVG (§3.3 palette). */
const CURSOR_SVG = `
<svg viewBox="0 0 13 11" width="13" height="11" aria-hidden="true">
  <g shape-rendering="crispEdges">
    <path d="M0 3h5v1H0z M5 2h4v1H5z M9 3h3v1H9z M4 4h8v3H4z M5 7h6v1H5z M6 8h4v1H6z"
          fill="#f4f1e8" stroke="#0b0a12" stroke-width="0.6" stroke-linejoin="miter"/>
    <path d="M4 4h2v3H4z" fill="#4e86c8"/>
    <path d="M6 6h5v1H6z M6 7h4v1H6z" fill="#b9c4d2"/>
  </g>
</svg>`;

export interface HudMockOptions {
  /** Where the overlay is mounted. Usually the screen's root element. */
  root: HTMLElement;
  /** Line shown in the top-left message bar. */
  message?: string;
  /** Small caption under the message bar; use it to flag placeholder art. */
  caption?: string;
  /** Start hidden. */
  visible?: boolean;
}

/** Static FFX battle HUD, letterbox-scaled from a 640x360 authoring grid. */
export class HudMock {
  readonly el: HTMLElement;
  private readonly stage: HTMLElement;
  private readonly captionEl: HTMLElement;
  private readonly messageEl: HTMLElement;
  private readonly onResize = (): void => this.layout();
  private mounted = false;

  constructor(private readonly opts: HudMockOptions) {
    this.el = document.createElement('div');
    this.el.className = 'hudm';
    this.el.dataset['role'] = 'hud-mock';

    this.stage = document.createElement('div');
    this.stage.className = 'hudm__stage';
    this.el.appendChild(this.stage);

    this.stage.innerHTML =
      this.messageHtml(opts.message ?? 'Tidus attacks!') +
      this.captionHtml(opts.caption ?? '') +
      this.ctbHtml() +
      this.commandHtml() +
      this.partyHtml() +
      this.reticleHtml() +
      this.damageHtml();

    this.messageEl = this.stage.querySelector('.hudm-message') as HTMLElement;
    this.captionEl = this.stage.querySelector('.hudm-caption') as HTMLElement;
    this.el.hidden = opts.visible === false;
  }

  // ------------------------------------------------------------------ markup

  private messageHtml(text: string): string {
    const [first, ...rest] = text.split(' ');
    return `<div class="hudm-win hudm-message"><b>${first ?? ''}</b>&nbsp;${rest.join(' ')}</div>`;
  }

  private captionHtml(text: string): string {
    return `<div class="hudm-caption">${text}</div>`;
  }

  private ctbHtml(): string {
    const rows = CTB_ROWS.map((r, i) => {
      const current = i === 0;
      const cls = [
        'hudm-ctb__row',
        r.side === 'enemy' ? 'hudm-ctb__row--enemy' : '',
        current ? 'hudm-ctb__row--current' : '',
      ]
        .filter(Boolean)
        .join(' ');
      // Rows 5-9 dissolve downward, §3.2.
      const fade = i < 5 ? 1 : 1 - ((i - 4) / 6) * 0.55;
      const y = i * 23;
      const label = r.label && i < 3 ? `<span class="hudm-ctb__name">${r.label}</span>` : '';
      const tag = r.tag ? `<span class="hudm-ctb__tag">${r.tag}</span>` : '';
      const od = r.overdrive ? `<span class="hudm-ctb__od"></span>` : '';
      // No portrait yet? Fall back to a monogram on the character's tint, so
      // the row still reads as a person rather than as a coloured hole.
      const mono = `<span class="hudm-ctb__mono">${r.who.slice(0, 2).toUpperCase()}</span>`;
      const img = r.portrait
        ? `<img src="${artUrl(`art/portraits/${r.portrait}.png`)}" alt=""
             onerror="this.remove()" />`
        : '';
      return `<div class="${cls}" style="top:${y}px;opacity:${fade.toFixed(2)}">
        ${label}
        <span class="hudm-ctb__icon" style="background:${r.tint}">${mono}${img}${tag}${od}</span>
      </div>`;
    }).join('');
    return `<div class="hudm-ctb">${rows}</div>`;
  }

  private commandHtml(): string {
    const rows = COMMANDS.map((c) => {
      const cls = [
        'hudm-command__row',
        c.selected ? 'hudm-command__row--selected' : '',
        c.disabled ? 'hudm-command__row--disabled' : '',
      ]
        .filter(Boolean)
        .join(' ');
      const cursor = c.selected ? `<span class="hudm-cursor">${CURSOR_SVG}</span>` : '';
      const mp = c.mp ? `<span class="hudm-command__mp">${c.mp}</span>` : '';
      const label = `<span class="hudm-command__label${
        c.ready ? ' hudm-command__label--ready' : ''
      }">${c.label}</span>`;
      return `<div class="${cls}">${cursor}${label}${mp}</div>`;
    }).join('');
    return `<div class="hudm-win hudm-command">${rows}</div>`;
  }

  private partyHtml(): string {
    const rows = PARTY.map((p, i) => {
      const crit = p.hp < p.maxHp * 0.5;
      const full = p.overdrive >= 1;
      return `<div class="hudm-party__row ${p.acting ? 'hudm-party__row--acting' : ''}"
                   style="top:${4 + i * 20}px">
        <span class="hudm-party__name">${p.name}</span>
        <span class="hudm-party__tag">HP</span>
        <span class="hudm-party__value hudm-party__value--hp ${crit ? 'hudm-party__value--crit' : ''}">
          ${p.hp}<small>/${p.maxHp}</small>
        </span>
        <span class="hudm-party__tag">MP</span>
        <span class="hudm-party__value hudm-party__value--mp">${p.mp}<small>/${p.maxMp}</small></span>
        <span class="hudm-party__od ${full ? 'hudm-party__od--full' : ''}">
          <i style="width:${Math.round(p.overdrive * 100)}%"></i>
        </span>
      </div>`;
    }).join('');
    return `<div class="hudm-win hudm-party">${rows}</div>`;
  }

  private damageHtml(): string {
    // Up and left of the boss's head, clear of both his face and the CTB
    // column, caught at the top of its bounce arc (§3.6).
    return `<div class="hudm-damage" style="left:470px;top:48px">1268</div>`;
  }

  /**
   * The enemy target reticle (§3.5): a four-corner bracket scaled to the boss's
   * on-screen box, plus his name plate with the disambiguating letter tag.
   *
   * Static, like everything else here — the live HUD will project this from the
   * actor's bounding box each frame.
   */
  private reticleHtml(): string {
    return `<div class="hudm-reticle" style="left:412px;top:64px;width:104px;height:166px">
      <i class="hudm-reticle__c hudm-reticle__c--tl"></i>
      <i class="hudm-reticle__c hudm-reticle__c--tr"></i>
      <i class="hudm-reticle__c hudm-reticle__c--bl"></i>
      <i class="hudm-reticle__c hudm-reticle__c--br"></i>
      <span class="hudm-reticle__name">Seymour <b>A</b></span>
    </div>`;
  }

  // ------------------------------------------------------------------- mount

  mount(): void {
    if (this.mounted) return;
    this.opts.root.appendChild(this.el);
    this.mounted = true;
    this.layout();
    window.addEventListener('resize', this.onResize, { passive: true });
  }

  unmount(): void {
    if (!this.mounted) return;
    window.removeEventListener('resize', this.onResize);
    this.el.remove();
    this.mounted = false;
  }

  get visible(): boolean {
    return !this.el.hidden;
  }

  setVisible(v: boolean): void {
    this.el.hidden = !v;
    if (v) this.layout();
  }

  toggle(): boolean {
    this.setVisible(!this.visible);
    return this.visible;
  }

  setMessage(text: string): void {
    const [first, ...rest] = text.split(' ');
    this.messageEl.innerHTML = `<b>${first ?? ''}</b>&nbsp;${rest.join(' ')}`;
  }

  setCaption(html: string): void {
    this.captionEl.innerHTML = html;
  }

  /** Letterbox the 640x360 grid into whatever the viewport is. */
  layout(): void {
    const rect = this.el.getBoundingClientRect();
    const w = rect.width || window.innerWidth;
    const h = rect.height || window.innerHeight;
    const scale = Math.min(w / 640, h / 360);
    const x = (w - 640 * scale) / 2;
    const y = (h - 360 * scale) / 2;
    this.stage.style.transform = `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px) scale(${scale.toFixed(4)})`;
  }
}
