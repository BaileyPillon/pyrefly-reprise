/**
 * THE PLAYTEST SWITCHBOARD (conference demo, Bailey's playtest of 2026-10-22; both games; presentation only; dev and demo builds): number keys that flip the new motion pieces DURING a fight, and a
 * small label in the corner that says what each one is set to. It exists only behind `?pack=demo&switchboard=1`: without both words in the address nothing is installed, no key is listened to and
 * no element is made.
 *
 * | key | piece | values |
 * |---|---|---|
 * | `1` | smear | paint, blur, off |
 * | `2` | camera punch | new, today |
 * | `3` | hit-stop | short, today |
 * | `4` | gamepad rumble | on, off |
 * | `5` | motion sounds | on, off |
 * | `6` | spell effects and the bosses' attacks (fx) | new, today |
 * | `7` | the curves (strike, cast lift, recoil, squash) | new, today (in a real mode, key `,`, it reads real-snappy or real; this key then goes back to today) |
 * | `,` | the curves driven by the REAL game's clips (integration 2) | off, snappy (the real proportions at the 1.1 s pick), real speed |
 * | `.` | the two party rig pilots: Tidus in Chapter I, Rikku's Dark Knight in Chapter IV (integration 2; read when a fight starts) | on, off |
 * | `8` | Tidus T1 / T2 (the art; reloads the page, so press it between fights) | t1, t2 |
 * | `9` | the per-game moments (victory, knock-out) | new, today |
 * | `-` | the contact shadow | follow, today |
 * | `/` | the pro look (lane "pro-look": arena grade, Chapter IV seam, ink hits, glass numbers, markers) | pro, today |
 * | `;` | the directed camera (lane "pro-camera": the real FFX shots re-staged, moves on plain attacks, FFX-2's auto camera) | pro, today |
 * | `\` (backslash) | the pro staging (lane "pro-staging": held breath, boss card, victory freeze, defeat card, Overdrive opening, Change plate; a flip in a fight plays from the next beat) | pro, today |
 * | `'` (apostrophe) | the party rim (r63-play: the pale key-coloured edge light on the party and the aeons; on is today's, off draws them like the bosses; not a "new" piece, so `0` leaves it alone) | on, off |
 * | `0` | everything on the board that is a piece: if all are new, all go to today's; else all go to new (not the party rim) | |
 * | `=` | the legend (every key in plain words with its value), then hide the label, then the label again | |
 *
 * The numbers are free: `app/Input.ts` maps WASD, the arrows, Enter, Space, Z, X, Esc, Backspace, Shift, Tab, Q, E, C, M, V, R, F, PageUp and PageDown, and the other screens use P, H, B, L, T and
 * Home; `` ` `` is the mark key and F6 to F8 the look keys. Modified keys (Ctrl, Alt, Meta) and keys typed into a text field are left alone. A flip outside a fight is remembered and takes effect in
 * the next Chapter I or Chapter IV fight (`engine/motion/DemoGate.ts`).
 */
import { artUrl } from '../../engine/PaintedArt.ts';
import { demoChapter, isDemoChapter, queryWord } from '../../engine/motion/DemoGate.ts';
import { partyRigsMode } from '../../engine/motion/PartyRigsSwitch.ts';
import { HIDE_CODE, MASTER_CODE, TIDUS_CODE, SWITCHES, boardState, flipAll, legendRows, normaliseCode, switchOfCode } from './switchboardModel.ts';

/**
 * The switchboard is wanted: `?pack=demo&switchboard=1`, both spelled out. r64 (item 200b): the conference pack is now the default, so `?switchboard=1` alone is NOT enough (the playtest keys are swallowed in the capture
 * phase, and a public address that happens to carry the one word must not grow them); the playtest address is unchanged.
 */
export function switchboardWanted(search: string | undefined): boolean {
  return queryWord(search, 'pack') === 'demo' && queryWord(search, 'switchboard') === '1';
}

const COOKIE = 'pyrefly_tidus';

/** The Tidus the address (or the cookie) asks for. */
export function tidusAsked(search: string, cookie: string): 't1' | 't2' {
  const q = queryWord(search, 'tidus');
  if (q === 't1' || q === 't2') return q;
  const m = new RegExp(`(?:^|;\\s*)${COOKIE}=(t1|t2)\\b`, 'i').exec(cookie);
  return m ? (m[1]!.toLowerCase() as 't1' | 't2') : 't1';
}

const CSS = `
.sb{position:fixed;left:50%;transform:translateX(-50%);top:4px;z-index:998;pointer-events:none;max-width:min(36vw,920px);text-align:center;padding:4px 9px 5px;border-radius:4px;
background:rgba(8,10,18,.66);color:#e9e6dc;font:clamp(11px,.95vh,15px)/1.45 ui-monospace,Consolas,'Cascadia Mono',monospace;white-space:normal;letter-spacing:.01em}
.sb{transition:opacity .25s}.sb.sb-quiet{opacity:.2}
.sb[hidden]{display:none}.sb b{color:#e3b94a;font-weight:600}.sb i{font-style:normal;opacity:.5}.sb span{white-space:nowrap}
.sb .sb-new{color:#9fe2b0}.sb .sb-hit{background:#e3b94a;color:#10121a;border-radius:3px;padding:0 3px}.sb .sb-note{display:block;opacity:.7}
.sb.sb-legend{left:auto;transform:none;right:8px;top:8px;text-align:left;max-width:min(64vw,1180px);padding:9px 14px 10px;background:rgba(8,10,18,.88);opacity:1;font-size:clamp(13px,1.2vh,19px)}
.sb.sb-legend span{white-space:normal}
/* r64 (playtest only): over the pause screen the label sits at the bottom edge, clear of the tab row (TIDUS .. CONTROLS / MUSIC) that its last line covered at the top */
.sb.sb-pause{top:auto;bottom:4px}
.sb .sb-title{display:block;color:#e3b94a;margin-bottom:3px}.sb .sb-row{display:grid;grid-template-columns:1.6em 7.5em 8.5em 1fr;column-gap:.6em;align-items:baseline;padding:1px 0}
.sb .sb-row .sb-pl{white-space:normal;opacity:.88}.sb .sb-row .sb-v{opacity:.95}.sb .sb-row .sb-nm{opacity:.95}
`;

/** The pause screen is up (its stage is mounted; `PauseScreen` makes `.pause__stage`). */
export function pauseScreenUp(): boolean {
  return typeof document !== 'undefined' && document.querySelector('.pause__stage') !== null;
}

export interface SwitchboardHandle {
  /** The label's text, for checks. */
  text(): string;
  /** Press a key by its code, as the page would hear it. */
  press(code: string): void;
  dispose(): void;
}

/** Install the board (once, at boot). Returns null when the address does not ask for it. */
export function installSwitchboard(api?: Record<string, unknown>): SwitchboardHandle | null {
  if (typeof window === 'undefined' || typeof document === 'undefined') return null;
  if (!switchboardWanted(window.location.search)) return null;

  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);
  const el = document.createElement('div');
  el.className = 'sb';
  el.setAttribute('data-switchboard', '1');
  el.setAttribute('aria-hidden', 'true');
  document.body.appendChild(el);

  let artVariant: string | null = null; // what the art server says it is serving (`X-Pyrefly-Tidus`); null: it does not know (plain `vite`, no variants)
  let flashed = '';
  let flashTimer: ReturnType<typeof setTimeout> | undefined;
  let view: 'label' | 'legend' | 'hidden' = 'label'; // `=` walks label, legend, hidden

  const tidus = (): string => {
    const asked = tidusAsked(window.location.search, document.cookie);
    if (artVariant === null) return asked === 't1' ? 'T1' : 'T2 (art server off: T1)';
    return artVariant.toUpperCase();
  };

  let rigsAtFight: string | null = null; // what the party rigs said when this fight's figures were built: a flip since then plays in the NEXT fight (the stage asks once per figure)

  const render = (): void => {
    const live = isDemoChapter(demoChapter());
    if (!live) rigsAtFight = null;
    else if (rigsAtFight === null) rigsAtFight = partyRigsMode();
    el.classList.toggle('sb-pause', pauseScreenUp()); // r64-fixes review F4: for the legend too, or a legend opened over the pause screen kept the class and sat over the command menu after the resume
    if (view === 'legend') {
      renderLegend(live);
      return;
    }
    el.classList.remove('sb-legend');
    const state = boardState();
    const parts = state.map((s) => {
      const cls = [s.isNew ? 'sb-new' : '', flashed === s.name ? 'sb-hit' : ''].filter(Boolean).join(' ');
      const later = s.name === 'party rigs' && live && rigsAtFight !== null && rigsAtFight !== s.value ? ' (next fight)' : '';
      return `<span class="${cls}"><b>${s.key}</b> ${s.name} ${s.value}${later}</span>`;
    });
    parts.splice(Math.max(0, state.findIndex((s) => s.key === '9')), 0, `<span class="${flashed === 'Tidus' ? 'sb-hit' : ''}"><b>8</b> Tidus ${tidus()}</span>`);
    el.innerHTML =
      `${parts.join(' <i>|</i> ')} <i>|</i> <span><b>0</b> all</span> <i>|</i> <span><b>=</b> legend</span>` +
      `<span class="sb-note">${live ? 'live in this fight (Chapter I / IV)' : 'acts in the Chapter I and Chapter IV fights only'}</span>` +
      (note ? `<span class="sb-note">${note}</span>` : '');
    el.hidden = view === 'hidden';
    // Playtest skeptic, 2026-10-22 (m5): the label sat over the Chapter IV countdown banner, the active-plate chips and the pause screen's RB chip. In a fight it now fades to a faint ghost and
    // comes back to full for a few seconds after any key of the board (the state is still there to read; the HUD below is not hidden by it).
    el.classList.toggle('sb-quiet', live && !loud);
  };

  /** The legend `=` shows: every key in plain words with what it is set to now, the piece that is new in green. */
  const renderLegend = (live: boolean): void => {
    const rows = legendRows().map((r) => {
      const value = r.key === '8' ? tidus() : r.value;
      return `<div class="sb-row${r.isNew ? ' sb-new' : ''}"><b>${r.key}</b><span class="sb-nm">${r.name}</span><span class="sb-v">${value}</span><span class="sb-pl">${r.plain}</span></div>`;
    });
    el.classList.add('sb-legend');
    el.classList.remove('sb-quiet');
    el.innerHTML =
      `<span class="sb-title">THE KEYS (green = the new version is showing) <i>|</i> press = again to hide</span>${rows.join('')}` +
      `<span class="sb-note">${live ? 'live in this fight (Chapter I / IV)' : 'acts in the Chapter I and Chapter IV fights only'}. Address words: ?pro=off starts with the look, camera and staging off; ?look=today, ?camera=off, ?staging=today flip one; ?hud=today, ?audio=today and ?boss=today put back today's HUD, sound and boss edges; ?partyrim=off starts with the party rim off.</span>`;
    el.hidden = false;
  };

  let note = ''; // a one-line answer under the label (key 8 on a build that cannot serve T2)
  let loud = false; // true for a few seconds after a board key in a fight
  let loudTimer: ReturnType<typeof setTimeout> | undefined;
  const wake = (): void => {
    loud = true;
    if (loudTimer) clearTimeout(loudTimer);
    loudTimer = setTimeout(() => {
      loud = false;
      render();
    }, 4000);
  };

  const flash = (name: string): void => {
    flashed = name;
    wake();
    render();
    if (flashTimer) clearTimeout(flashTimer);
    flashTimer = setTimeout(() => {
      flashed = '';
      render();
    }, 1600);
  };

  const flipTidus = (): void => {
    if (artVariant === null) { // m8: the production build cannot serve T2 (only the dev art server answers it); a reload would end the run and still draw T1
      flashed = 'Tidus';
      note = '<b>8</b> Tidus T2 needs the dev link (port 5320); nothing changed';
      wake();
      render();
      if (flashTimer) clearTimeout(flashTimer);
      flashTimer = setTimeout(() => { // the note and the flash go together (the tick re-renders every 700 ms, so the note lives in the state, not in the element)
        flashed = '';
        note = '';
        render();
      }, 3000);
      return;
    }
    const next = tidusAsked(window.location.search, document.cookie) === 't1' ? 't2' : 't1';
    try {
      document.cookie = `${COOKIE}=${next}; Path=/; SameSite=Lax; Max-Age=86400`;
    } catch {
      /* a blocked cookie: the address still carries it */
    }
    flashed = 'Tidus';
    el.innerHTML = `<b>8</b> Tidus ${next.toUpperCase()}: reloading the page (the art is read once)`;
    const url = new URL(window.location.href);
    url.searchParams.set('tidus', next);
    setTimeout(() => window.location.assign(url.toString()), 120);
  };

  const press = (rawCode: string): void => {
    const code = normaliseCode(rawCode);
    if (code === HIDE_CODE) {
      view = view === 'label' ? 'legend' : view === 'legend' ? 'hidden' : 'label';
      render();
      return;
    }
    if (code === MASTER_CODE) {
      flipAll();
      flash('all');
      return;
    }
    if (code === TIDUS_CODE) {
      flipTidus();
      return;
    }
    const s = switchOfCode(code);
    if (!s?.flip) return;
    s.flip();
    flash(s.name);
  };

  // In the CAPTURE phase and swallowed: the pause screen's keyboard claim stops a key before any bubble listener sees it (review m2: the keys did nothing under the pause screen), and a key the
  // game never hears must not turn the pad's hints and rumble over to the keyboard (review m4: pressing 4 for the rumble then silenced it until the next pad press). The game uses none of these keys.
  const onKey = (e: KeyboardEvent): void => {
    if (e.ctrlKey || e.altKey || e.metaKey) return;
    const t = e.target as HTMLElement | null;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return;
    const code = normaliseCode(e.code);
    if (!(code === HIDE_CODE || code === MASTER_CODE || SWITCHES.some((s) => s.code === code))) return;
    e.stopImmediatePropagation();
    if (!e.repeat) press(code);
  };
  window.addEventListener('keydown', onKey, true);
  const tick = setInterval(render, 700); // the chapter note follows the fight
  render();

  void fetch(artUrl('art/characters/tidus/idle.png'), { method: 'HEAD', cache: 'no-store' })
    .then((r) => {
      artVariant = r.headers.get('x-pyrefly-tidus');
      render();
    })
    .catch(() => undefined);

  const handle: SwitchboardHandle = {
    text: () => el.textContent ?? '',
    press,
    dispose: () => {
      window.removeEventListener('keydown', onKey, true);
      clearInterval(tick);
      if (flashTimer) clearTimeout(flashTimer);
      el.remove();
      style.remove();
    },
  };
  if (api) {
    api['switchboard'] = (): { state: ReturnType<typeof boardState>; tidus: string; text: string } => ({ state: boardState(), tidus: tidus(), text: handle.text() });
    api['switchboardPress'] = (code: string): void => press(code);
  }
  return handle;
}
