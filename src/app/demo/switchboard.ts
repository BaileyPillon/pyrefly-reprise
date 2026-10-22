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
 * | `7` | the curves (strike, cast lift, recoil, squash) | new, today |
 * | `8` | Tidus T1 / T2 (the art; reloads the page, so press it between fights) | t1, t2 |
 * | `9` | the per-game moments (victory, knock-out) | new, today |
 * | `-` | the contact shadow | follow, today |
 * | `0` | everything: if all are new, all go to today's; else all go to new | |
 * | `=` | hide or show the label | |
 *
 * The numbers are free: `app/Input.ts` maps WASD, the arrows, Enter, Space, Z, X, Esc, Backspace, Shift, Tab, Q, E, C, M, V, R, F, PageUp and PageDown, and the other screens use P, H, B, L, T and
 * Home; `` ` `` is the mark key and F6 to F8 the look keys. Modified keys (Ctrl, Alt, Meta) and keys typed into a text field are left alone. A flip outside a fight is remembered and takes effect in
 * the next Chapter I or Chapter IV fight (`engine/motion/DemoGate.ts`).
 */
import { demoChapter, isDemoChapter, packDemo, queryWord } from '../../engine/motion/DemoGate.ts';
import { HIDE_CODE, MASTER_CODE, TIDUS_CODE, SWITCHES, boardState, flipAll, normaliseCode, switchOfCode } from './switchboardModel.ts';

/** The switchboard is wanted: `?pack=demo&switchboard=1`. */
export function switchboardWanted(search: string | undefined): boolean {
  return packDemo(search) && queryWord(search, 'switchboard') === '1';
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
.sb{position:fixed;left:8px;bottom:8px;z-index:2147483000;pointer-events:none;max-width:min(96vw,1180px);padding:4px 9px 5px;border-radius:4px;
background:rgba(8,10,18,.66);color:#e9e6dc;font:clamp(11px,.95vh,15px)/1.45 ui-monospace,Consolas,'Cascadia Mono',monospace;white-space:normal;letter-spacing:.01em}
.sb[hidden]{display:none}.sb b{color:#e3b94a;font-weight:600}.sb i{font-style:normal;opacity:.5}.sb span{white-space:nowrap}
.sb .sb-new{color:#9fe2b0}.sb .sb-hit{background:#e3b94a;color:#10121a;border-radius:3px;padding:0 3px}.sb .sb-note{display:block;opacity:.7}
`;

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
  let hidden = false;

  const tidus = (): string => {
    const asked = tidusAsked(window.location.search, document.cookie);
    if (artVariant === null) return asked === 't1' ? 'T1' : 'T2 (art server off: T1)';
    return artVariant.toUpperCase();
  };

  const render = (): void => {
    const live = isDemoChapter(demoChapter());
    const parts = boardState().map((s) => {
      const cls = [s.isNew ? 'sb-new' : '', flashed === s.name ? 'sb-hit' : ''].filter(Boolean).join(' ');
      return `<span class="${cls}"><b>${s.key}</b> ${s.name} ${s.value}</span>`;
    });
    parts.splice(7, 0, `<span class="${flashed === 'Tidus' ? 'sb-hit' : ''}"><b>8</b> Tidus ${tidus()}</span>`);
    el.innerHTML =
      `${parts.join(' <i>|</i> ')} <i>|</i> <span><b>0</b> all</span> <i>|</i> <span><b>=</b> hide</span>` +
      `<span class="sb-note">${live ? 'live in this fight (Chapter I / IV)' : 'acts in the Chapter I and Chapter IV fights only'}</span>`;
    el.hidden = hidden;
  };

  const flash = (name: string): void => {
    flashed = name;
    render();
    if (flashTimer) clearTimeout(flashTimer);
    flashTimer = setTimeout(() => {
      flashed = '';
      render();
    }, 1600);
  };

  const flipTidus = (): void => {
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
      hidden = !hidden;
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

  const onKey = (e: KeyboardEvent): void => {
    if (e.repeat || e.ctrlKey || e.altKey || e.metaKey) return;
    const t = e.target as HTMLElement | null;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return;
    const code = normaliseCode(e.code);
    if (code === HIDE_CODE || code === MASTER_CODE || SWITCHES.some((s) => s.code === code)) press(code);
  };
  window.addEventListener('keydown', onKey);
  const tick = setInterval(render, 700); // the chapter note follows the fight
  render();

  void fetch('/art/characters/tidus/idle.json', { method: 'HEAD', cache: 'no-store' })
    .then((r) => {
      artVariant = r.headers.get('x-pyrefly-tidus');
      render();
    })
    .catch(() => undefined);

  const handle: SwitchboardHandle = {
    text: () => el.textContent ?? '',
    press,
    dispose: () => {
      window.removeEventListener('keydown', onKey);
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
