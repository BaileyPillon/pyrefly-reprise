/**
 * THE READY PAINTING THAT IS NOT THE FIGURE (PR-0517; method check section 3.5; pc-residues lane, 2026-10-28; FFX-2's dresses, both games' plumbing; Bailey's delegation, "i'll go with all your
 * recommendations and decision-making for the next couple days"). Ports only: no `three`, no DOM, no engine state.
 *
 * `tools/pose-identity.mjs` measures each figure's ready painting against its idle with its attack as the ceiling (the colour distance per body region). A painting that is {@link FAIL_RATIO} times over
 * that ceiling reads as ANOTHER figure (Paine Warrior's white top where her idle wears a black jacket, Yuna White Mage's hood down where it is up in her idle and attack, Rikku Warrior's hair) and
 * is listed in `src/data/art/readyIdentity.ts`. For such a figure the engine keeps the idle PAINTING through the whole ready stance, the menu AND the attack's wind-up: the stance, its lean and its
 * ring are the same (`setPose('ready', { paint: 'idle' })`, exactly `?stance=v1b`'s rule for that one figure), so the figure never shows the painting that is not her. A repaint that passes the
 * measure clears the row (`node tools/pose-identity.mjs --write`) and the ready painting is back.
 *
 * WHERE IT PLAYS (the review of this lane, M5, 2026-10-28; the driver's call under Bailey's delegation): exactly where the stance look plays ({@link stanceNow}: the pack on, a desktop-class screen, a pack chapter
 * or `?swapscope=all`, and a stance word that is not `today`). The hold is one more rule of the stance look, so `?stance=today`, `?pack=off`, a phone, a tablet and a chapter outside the pack are release 66's
 * ready painting for these three dresses too ("the today words give release 66" holds without a second word), and `?swapscope=all` (MF-22) widens the hold with the picks. `?readyid=today` turns the hold
 * off alone (release 67's look with every other pick on; the A/B word for the clips). Everything else, every other figure and every other pose, is exactly as it was.
 */
import { READY_IDENTITY_FAILS } from '../../data/art/readyIdentity.ts';
import { queryWord } from './DemoGate.ts';
import { stanceNow } from './SwapSwitch.ts';

let off: boolean | null = null;

/** `?readyid=today` from a search string (pure): true when the hold is switched off. */
export function readyIdOffFromSearch(search: string | undefined): boolean {
  return queryWord(search, 'readyid') === 'today';
}

/** Tests and `window.__pyrefly`: force the switch (`null` reads the address again). */
export function setReadyIdOff(v: boolean | null): void {
  off = v;
}

function readyIdOff(): boolean {
  return (off ??= readyIdOffFromSearch(globalThis.location === undefined ? undefined : (globalThis.location.search ?? '')));
}

/** True when this art subject's ready painting fails the identity measure AND the stance look plays now: the figure holds the idle painting through the ready stance. `artId` is `BattleStage.artOf` (a dress is its own subject). */
export function readyHeldOnIdle(artId: string | undefined): boolean {
  return artId !== undefined && !readyIdOff() && Object.hasOwn(READY_IDENTITY_FAILS, artId) && stanceNow() !== 'today';
}
