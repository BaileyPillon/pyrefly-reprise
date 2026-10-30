/**
 * THE PARTY RIM SWITCH (r63-play, 2026-10-23; a playtest switch for Bailey's judgement tonight; both games, presentation only).
 *
 * The pro look's two screen-space rims (see `RimFigures.ts`) draw a pale key-coloured ring on every figure's lit edge; the boss re-cut took it off the bosses. Bailey has not decided whether the PARTY keeps it.
 * This is the switch for him to look: `?partyrim=off` (or the playtest key `'` on the board, named in the `=` legend as "party rim") draws the party, and any aeon, with no screen-space rim, the same way the bosses are.
 *
 * **r64 (Bailey 2026-10-24 ~13:40 EDT, item 200e, the driver's call under "I'll go with all your recommendations"): the party's edge light is OFF by default** in the two demo chapters, so the party and the bosses share one clean edge
 * (both games). `?partyrim=on` brings today's rim back (and so does `?pack=off`, the old behaviour as a whole). Before r64 the default was ON (`?pack=demo` did not change it; `?partyrim=off` was the playtest switch).
 * Only in the two demo chapters (Chapter I `seymour-flux`, Chapter IV `ffx2-bahamut`, `motion/DemoGate.ts`), and only while the pro look draws its rims at all. The master key `0` and `?pro=off` do not touch it.
 * Console: `__pyrefly.partyRim('on' | 'off' | null)`.
 */
import { demoChapter, isTreatedChapter, packDemo, queryWord } from '../../motion/DemoGate.ts';

export type PartyRimMode = 'on' | 'off';

/**
 * `?partyrim=on|off` (pure): the named word wins; with none, the rim follows the conference pack (r64): OFF while the pack is on (the default in the demo chapters), ON (today's rim) under `?pack=off` and with no page.
 */
export function partyRimFromSearch(search: string | undefined): PartyRimMode {
  const w = queryWord(search, 'partyrim');
  if (w === 'on') return 'on';
  if (w === 'off') return 'off';
  return packDemo(search) ? 'off' : 'on';
}

let mode: PartyRimMode | null = null;
const here = (): string | undefined => (globalThis.location === undefined ? undefined : (globalThis.location.search ?? ''));

/** The switch as the page asked for it (or as a key or the console set it). */
export function partyRimMode(): PartyRimMode {
  if (mode === null) mode = partyRimFromSearch(here());
  return mode;
}

/** Tests, the key and `__pyrefly.partyRim(...)`: force the switch (`null` reads the address again). */
export function setPartyRim(value: PartyRimMode | null): void {
  mode = value;
}

/** True when the party draws no screen-space rim now: the switch says off and a demo chapter is running. */
export function partyRimOff(): boolean {
  return partyRimMode() === 'off' && isTreatedChapter(demoChapter(), 'rim');
}
