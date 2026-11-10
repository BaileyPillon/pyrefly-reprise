/**
 * The rows and ids the two Special-form end-to-end specs open by name, in ONE table that the specs (`pause-with-form.spec.ts`, `special-touch-aim.spec.ts`, `special-walk.ts`) and the unit
 * test that proves them against the real engine (`tests/unit/special-e2e-rows.test.ts`) all read. FFX-2 only: the three Special dresspheres exist only in FFX-2. No playwright import here,
 * so a vitest file can import it.
 *
 * Why a table and a unit test: the specs are written and not run (Stage 2 runs them), and one row name was once taken from the test helper's mastered rig, which offers rows the chapter's
 * own party build does not (review finding R3-2: Ma'at's Feather on Paine's left wing in Chapter V). Every entry below is a label the menu prints (`.ffx2cmd__label`) for the party build of
 * the chapter the spec plays, checked on the real engine by `special-e2e-rows.test.ts`; an entry is a short list, and the spec opens the FIRST of it that the menu shows, enabled.
 */

export type Girl = 'yuna' | 'rikku' | 'paine';

/** The chapter each girl's Special is reached in: Chapter IV for Yuna and Rikku; Chapter V for Paine (the build gives her Full Throttle there, `farplane.ts`). */
export const CHAPTER_OF: Record<Girl, string> = { yuna: 'ffx2-bahamut', rikku: 'ffx2-bahamut', paine: 'ffx2-vegnagun-shuyin' };

/** The ids of each girl's two parts, right part first (`FORMS[special].pods`). */
export const PARTS: Record<Girl, readonly [string, string]> = {
  yuna: ['floral-fallal-right-pistil', 'floral-fallal-left-pistil'],
  rikku: ['machina-maw-smasher-r', 'machina-maw-crusher-l'],
  paine: ['full-throttle-right', 'full-throttle-left'],
};

/** The girls whose parts have a one-target ally pick to aim on (e2e 24 runs these two). Yuna's Floral Fallal parts offer only all-allies groups and self rows, so there is nothing to aim on her side. */
export const AIMED_GIRLS = ['rikku', 'paine'] as const;

/** What a row does once picked: `single` = the command window opens a cursor on one target; `all` = it opens a group cursor on every valid target, and a confirm sends it. */
export type RowAim = 'single' | 'all';

export interface RowPick {
  /** The text the menu prints on the row. */
  readonly label: string;
  /** The aim the pick opens (`selection.mode` of the cursor). */
  readonly aim: RowAim;
}

/**
 * The ENEMY row of each part that the touch-aim spec opens to put a foe under the cursor and tap the plates (AC-5: a tap on a plate while a foe is aimed does nothing). A part is offered no
 * Attack row, only its own skills. A one-target skill comes first where the part has one. Paine's LEFT wing (Sinistral) has none in Chapter V's own build (its enemy rows are White Feather and
 * Buckle Feather, which hit all enemies), so the pick there is a group aim: the foe is aimed as a group and the plate taps are still asserted to do nothing. Nothing is invented: every
 * label is a row the build offers.
 */
export const ENEMY_ROWS: Readonly<Record<string, readonly RowPick[]>> = {
  'machina-maw-smasher-r': [
    { label: 'Howitzer', aim: 'single' },
    { label: 'Homing Ray', aim: 'single' },
  ],
  'machina-maw-crusher-l': [
    { label: 'Howitzer', aim: 'single' },
    { label: 'Homing Ray', aim: 'single' },
  ],
  'full-throttle-right': [
    { label: 'Venom Wing', aim: 'single' },
    { label: 'Blind Wing', aim: 'single' },
  ],
  'full-throttle-left': [
    { label: 'White Feather', aim: 'all' },
    { label: 'Buckle Feather', aim: 'all' },
  ],
};

/** The one-target ALLY row of each part: the aim opens on the three plates of the form, and the spec taps each. */
export const ALLY_ROWS: Readonly<Record<string, readonly RowPick[]>> = {
  'machina-maw-smasher-r': [
    { label: 'HP Repair', aim: 'single' },
    { label: 'MP Repair', aim: 'single' },
  ],
  'machina-maw-crusher-l': [
    { label: 'HP Repair', aim: 'single' },
    { label: 'MP Repair', aim: 'single' },
  ],
  'full-throttle-right': [
    { label: 'Stamina', aim: 'single' },
    { label: 'Mettle', aim: 'single' },
  ],
  'full-throttle-left': [
    { label: 'Stamina', aim: 'single' },
    { label: 'Mettle', aim: 'single' },
  ],
};

// ------------------------------------------------------------------------------------------------ the walk's own rows

/** The rows the walk to a Special (`special-walk.ts#walkToForm`) and the specs name. */
export const ROW_ATTACK = 'Attack';
export const ROW_CHANGE = 'Change';

/**
 * What a plate that is not being walked does to pass its turn: the first of these the menu shows enabled, anywhere in it. Attack is on the Warrior, Dark Knight and Gunner menus, but NOT on
 * the White Mage's, which is what Yuna starts both chapters in (her menu is White Magic, Change and Item); Cure is a spell on that White Mage menu in both chapters and aims one ally, harmlessly. Read off the
 * real engine on each chapter's own build (`special-e2e-rows.test.ts`).
 */
export const PASS_ROWS: readonly RowPick[] = [
  { label: ROW_ATTACK, aim: 'single' },
  { label: 'Cure', aim: 'single' },
];
/** A Change row that leads into the Special is printed `<Special> (Special)`. */
export const SPECIAL_ROW = /\(Special\)$/;
/** The main's way out of a form, printed `Leave <Special>`; the specs never open it. */
export const LEAVE_ROW = /^Leave /;

/**
 * The walk's choice inside the Change list: the index of the row labelled `... (Special)` if it is enabled, else the first enabled row whose dress has not been worn yet, else -1.
 * `walkToForm` reads the page's rows and calls this; the unit test calls it on the real engine's rows.
 */
export function nextChangeRow(rows: readonly string[], disabled: readonly boolean[], worn: ReadonlySet<string>): number {
  const special = rows.findIndex((r, i) => SPECIAL_ROW.test(r) && !disabled[i]);
  return special >= 0 ? special : rows.findIndex((r, i) => !disabled[i] && !worn.has(r));
}

/** The first pick of `picks` that `rows` shows enabled (`disabled` parallel to `rows`), or undefined. The specs and the unit test resolve a candidate list with this one function. */
export function firstPresent(picks: readonly RowPick[], rows: readonly string[], disabled: readonly boolean[]): RowPick | undefined {
  return picks.find((p) => {
    const i = rows.indexOf(p.label);
    return i >= 0 && !disabled[i];
  });
}
