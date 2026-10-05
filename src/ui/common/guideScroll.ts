/**
 * How the strategy guide's reading sheet is scrolled (`./StrategyGuide.ts`): the mouse wheel, a few keys and the
 * pad's right stick, beside its own scroll bar. Pure arithmetic on the sheet element; nothing here reads the
 * battle, the document or the advisor.
 *
 * `src/app/Input.ts` and `src/ui/ffx/rawInput.ts` claim most of the keyboard in a battle (the arrows, `WASD`,
 * `Enter`, `Space`, `Esc`, `Shift`, `Tab`, `E`, `C`, `M`, `V`, `R`, `F`, and `PageUp` / `PageDown` as the
 * pad's L1 and R1), and the HUDs claim `G`, `N`, `E`, `J`, `H` and `P`. The sheet takes the keys nobody has:
 * `[` and `]` for a page up and down, `Home` and `End` for the top and the foot. On the pad it takes the
 * right stick (standard axis 3), which `PAD_MAP` leaves alone, beside the spare face button the toggle uses.
 */

/** The keys the sheet scrolls with (`KeyboardEvent.code`). */
export const SCROLL_KEYS: readonly string[] = ['BracketLeft', 'BracketRight', 'Home', 'End'];

/** How much of the sheet a page key moves, as a fraction of its height (a line or two stays in view). */
const PAGE_FRACTION = 0.85;

/** The pad's right stick, vertical: standard axis 3. */
export const PAD_SCROLL_AXIS = 3;

/** Stick travel under which the sheet does not move. */
const PAD_SCROLL_DEADZONE = 0.3;

/** How fast a fully pushed stick scrolls the sheet, in layout (grid) px a second. */
const PAD_SCROLL_SPEED = 130;

/** The longest frame the stick is allowed to spend at once, in seconds (a stalled tab must not fling the sheet). */
const MAX_STEP_SECONDS = 0.1;

/** Scroll the sheet for one of {@link SCROLL_KEYS}: a page up or down, or to the top or the foot. */
export function scrollSheetByKey(sheet: HTMLElement, code: string): void {
  const page = Math.max(1, sheet.clientHeight * PAGE_FRACTION);
  switch (code) {
    case 'BracketLeft':
      sheet.scrollTop -= page;
      break;
    case 'BracketRight':
      sheet.scrollTop += page;
      break;
    case 'Home':
      sheet.scrollTop = 0;
      break;
    case 'End':
      sheet.scrollTop = sheet.scrollHeight;
      break;
  }
}

/** The height of a wheel "line", in screen px, for a browser that reports the wheel in lines (Firefox, some mice). */
const WHEEL_LINE_PX = 19;

/** A wheel event of this many px or more is a notch (a mouse wheel reports 100); less is a touchpad's finger. */
const COARSE_WHEEL_PX = 40;

/**
 * How far the sheet scrolls for one wheel event, in layout px.
 *
 * The sheet is drawn inside the HUD's letterbox stage, which is scaled by `min(w / 640, h / 360)` (2.5 at 1600x900), and
 * a browser applies a wheel's pixels to a scroll offset as they are: one notch (100 px) moved the sheet 100 layout px,
 * which is 250 screen px, three and a half times what it shows. The step is the wheel's screen px divided by the
 * scale the sheet is drawn at (`scale`: screen px per layout px, the stage's and TEXT SIZE's together), so a notch
 * moves the text by what the wheel says and a touchpad's finger keeps the text under it. 0 when the sheet has no
 * layout, which leaves the event to the browser.
 */
export function wheelStep(deltaY: number, deltaMode: number, scale: number, sheetHeight: number): number {
  if (!(scale > 0)) return 0;
  const px = deltaMode === 1 ? deltaY * WHEEL_LINE_PX : deltaMode === 2 ? deltaY * sheetHeight * scale : deltaY;
  return px / scale;
}

/**
 * A wheel event over the sheet (the desktop's only; the phone's sheet is left to the browser): the sheet scrolls by
 * {@link wheelStep}. A notch (a coarse step) is eased by the browser; a touchpad's many small steps are applied at
 * once, as they already are smooth, and so is everything where motion is reduced or the browser cannot ease. A pinch
 * (`ctrlKey`), a sideways wheel and a sheet with no layout are the browser's.
 */
export function scrollSheetByWheel(sheet: HTMLElement, e: WheelEvent): void {
  if (e.ctrlKey || e.deltaY === 0) return;
  const scale = sheet.offsetWidth > 0 ? sheet.getBoundingClientRect().width / sheet.offsetWidth : 0;
  const step = wheelStep(e.deltaY, e.deltaMode, scale, sheet.clientHeight);
  if (step === 0) return;
  e.preventDefault();
  const coarse = e.deltaMode !== 0 || Math.abs(e.deltaY) >= COARSE_WHEEL_PX;
  const still = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (typeof sheet.scrollBy === 'function') sheet.scrollBy({ top: step, behavior: coarse && !still ? 'smooth' : 'auto' });
  else sheet.scrollTop += step;
}

/** The stick's travel (-1 up .. 1 down) past the dead zone, or 0 inside it. */
export function padScrollTravel(axis: number | undefined): number {
  const v = axis ?? 0;
  return Math.abs(v) > PAD_SCROLL_DEADZONE ? Math.max(-1, Math.min(1, v)) : 0;
}

/** How far the stick moves the sheet in a frame of `dt` seconds, in layout px (negative is up). */
export function padScrollStep(travel: number, dt: number): number {
  return travel * PAD_SCROLL_SPEED * Math.min(MAX_STEP_SECONDS, Math.max(0, dt));
}

/**
 * The empty space above a block of the document, in layout px: what lies between it and the block before it
 * (a margin, which the box before it does not paint), or its whole distance from the top for the first block.
 * `body` is the element the blocks are laid out in; a list item is measured from its list.
 */
export function gapAbove(target: HTMLElement, body: HTMLElement): number {
  let el: HTMLElement = target;
  while (!el.previousElementSibling && el.parentElement && el.parentElement !== body) el = el.parentElement;
  const before = el.previousElementSibling as HTMLElement | null;
  return Math.max(0, before ? target.offsetTop - (before.offsetTop + before.offsetHeight) : target.offsetTop);
}

/**
 * The scale TEXT SIZE draws an element at: its individual `scale` property (`text-size.css` grows FFX's column from its top left
 * corner by 1.15 or 1.3), 1 when it has none or the browser cannot say. The column's room is divided by it, so the grown column
 * still ends at its fence.
 */
export function drawnScale(el: HTMLElement): number {
  const s = typeof getComputedStyle === 'function' ? Number.parseFloat(getComputedStyle(el).scale) : 1;
  return s > 0 ? s : 1;
}
