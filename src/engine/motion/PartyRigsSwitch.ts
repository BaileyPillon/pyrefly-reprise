/**
 * THE PARTY RIG PILOTS' SWITCH (conference demo, integration 2, 2026-10-22; Bailey: "2 pilots, then the rest": Tidus in Chapter I (FFX) and Rikku's Dark Knight dress in Chapter IV (FFX-2) are
 * drawn as a rig, one painting cut into parts, instead of as a painting set; "any that looks off stays painted"; he judges rigs IN MOTION, so they are looked at on their own).
 *
 * **Default: OFF**, and `?pack=demo` leaves it OFF: the pilots draw only with `?partyrigs=on` (or the switchboard's `.` key before the fight starts). Even then each pilot draws only in ITS chapter:
 * Tidus's rig in Chapter I (`seymour-flux`), Rikku's in Chapter IV (`ffx2-bahamut`); in every other chapter, and for every other figure, nothing changes. The bosses' rigs (`rig/RigLoad.ts`: Seymour
 * Flux, Bahamut and the rest) are not touched by this switch.
 *
 * **`?partyrigs=v2` (rigs-v2, 2026-10-29; default still OFF, nothing installed):** the NEW pilots, cut again from the live paintings by the party method with every key a piece of its own pose painting and
 * every move measured offline (`docs/handoff/rigs-v2.md`). The same two figures in the same two chapters; the rig is read from the folder `rigs/<subject>-v2/` ({@link partyRigFolder}) so the old pilots
 * (`on`, folder `rigs/<subject>/`) stay as they are beside it for the side-by-side. `v2` never loads the `on` folder: a missing v2 folder is the painting set, with the reason on record.
 *
 * Asked once per figure, when the stage builds it (`rig/RigStage.tryRigFigure`): a flip during a fight takes effect in the next fight (the switchboard says so).
 *
 * Game case (AGENTS.md rule 14): each pilot is its own game's: `tidus` is FFX only, `rikku-dark-knight` FFX-2 only. Pure: no `three`, no DOM but the address (hard rule 1).
 */
import { demoChapter, demoGameOf, isDemoChapter, queryWord, type DemoGame } from './DemoGate.ts';

export type PartyRigsMode = 'on' | 'v2' | 'off';

/** The two pilots, by art id, and the game (so the chapter) each one belongs to. */
export const PARTY_RIG_SUBJECTS: Readonly<Record<string, DemoGame>> = Object.freeze({
  tidus: 'ffx',
  'rikku-dark-knight': 'ffx2',
});

let mode: PartyRigsMode | null = null;

/** `?partyrigs=on|v2|off` from a search string (pure): `off` unless it says `on` (the 2026-10-22 pilots) or `v2` (the 2026-10-29 pilots). `?pack=demo` alone is `off`. */
export function partyRigsModeFromSearch(search: string | undefined): PartyRigsMode {
  const word = queryWord(search, 'partyrigs');
  return word === 'on' ? 'on' : word === 'v2' ? 'v2' : 'off';
}

/** The switch as the page asked for it (or the switchboard set it). */
export function partyRigsMode(): PartyRigsMode {
  if (mode === null) mode = partyRigsModeFromSearch(globalThis.location === undefined ? undefined : (globalThis.location.search ?? ''));
  return mode;
}

/** Tests and the switchboard: force the mode (`null` reads the address again). */
export function setPartyRigsMode(value: PartyRigsMode | null): void {
  mode = value;
}

/** Is this art id one of the two pilots? */
export function isPartyRigSubject(artId: string): boolean {
  return Object.prototype.hasOwnProperty.call(PARTY_RIG_SUBJECTS, artId);
}

/**
 * The folder under `art/rigs/` the rig of a figure is read from: `<subject>-v2` for a pilot under `?partyrigs=v2`, the subject's own name otherwise (every other figure and every other mode). The rig file inside
 * still says `name: <subject>`, so the loader's own "this rig is for this subject" check holds for both folders.
 */
export function partyRigFolder(artId: string, asked: PartyRigsMode = partyRigsMode()): string {
  return asked === 'v2' && isPartyRigSubject(artId) ? `${artId}-v2` : artId;
}

/**
 * May this figure be drawn as a rig? True for every figure that is not a pilot (the rig engine's own rules decide those, as they always did); for a pilot only when the switch is on AND the
 * running chapter is the pilot's own demo chapter.
 */
export function partyRigAllowed(artId: string): boolean {
  if (!isPartyRigSubject(artId)) return true;
  if (partyRigsMode() === 'off') return false;
  const chapter = demoChapter();
  return isDemoChapter(chapter) && demoGameOf(chapter) === PARTY_RIG_SUBJECTS[artId];
}
