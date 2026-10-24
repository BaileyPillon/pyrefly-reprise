/**
 * Chapter I's Talk exchanges, voiced (the sound pass, `?audio=new` / `?pack=demo`; FFX only, Seymour Flux; conference demo, 2026-10-22; Bailey's decision 184: "You choose all sound effects and music and voice
 * overs for me for now please").
 *
 * The real fight voices two Talk exchanges and three Seymour taunts: Yuna's Talk (Seymour, Seymour, Yuna) and Kimahri's Talk (Kimahri, Kimahri) (`D:/Tools/ffx-parity/ai/ffx-seymour/dis/btl-mtgz02_00.txt`, read
 * against its decoded string table; INVENTORY 4.1 of the audio pass). Our Talk command shows its banner and nothing else. This adds the exchanges as ordinary mid-battle scripts (the same kind as
 * `seymour-half`) fired by the Talk command itself (`ability-used` with the ability `talk`, the id the Trigger Command's `action-start` carries), in the project's OWN words, in the cast's voices
 * (the retail script's text is not reproduced; the lines are written to `research/writing-bible.md` section 1's voice guides: Seymour's courteous condescension and "Lady Yuna" even mid-fight, Yuna's
 * "No." as a whole beat, Kimahri's third person and dropped articles). The three Seymour taunts are the four lines the chapter already carries (`seymour-half`, `seymour-lance`), voiced.
 *
 * Off by default: the triggers and scripts exist only while the sound pass is on (`passMidFor`, `passScriptsFor`); with it off the engine is given exactly the chapter's own triggers. The engine is
 * deterministic either way: the same seed and the same triggers give the same events. Each exchange is kept under the mid-battle beat's 8 s (`registry.MID_SCRIPT_BUDGET_MS`) with its recordings: the Talk command has its own camera, so
 * the scripts move none (the recorded fight cut Yuna's third line at 8.0 s when the exchange was longer).
 *
 * Game case: FFX only (Seymour Flux has no FFX-2 counterpart; FFX-2 is unvoiced and its Bahamut fight has no voiced battle line in the sources).
 */

import type { MidBattleTrigger } from '../../battle/common/types.ts';
import { audioNewOn } from '../../audio/pass/passSwitch.ts';
import { say, type StoryScript } from '../dsl.ts';

const TRIGGERS: readonly MidBattleTrigger[] = [
  // `id === script` (the project's rule for every `mid` entry: the engine emits the trigger's id and the presenter looks the script up by that name).
  { id: 'pass-talk-yuna', when: { type: 'ability-used', who: 'yuna', ability: 'talk' }, once: true, script: 'pass-talk-yuna' },
  { id: 'pass-talk-kimahri', when: { type: 'ability-used', who: 'kimahri', ability: 'talk' }, once: true, script: 'pass-talk-kimahri' },
];

const SCRIPTS: Readonly<Record<string, StoryScript>> = {
  'pass-talk-yuna': [
    say('seymour', 'Lady Yuna. You need not suffer.', { auto: 1200 }),
    say('seymour', 'Let me end it kindly.', { auto: 1100 }),
    say('yuna', 'No. I will walk it to the end.', { auto: 1200 }),
  ],
  'pass-talk-kimahri': [
    say('kimahri', 'Kimahri does not fear Seymour.', { auto: 1200 }),
    say('kimahri', 'Kimahri stands. Yuna walks on.', { auto: 1200 }),
  ],
};

/** Extra mid-battle triggers for a chapter while the sound pass is on: Chapter I's Talk exchanges. Empty otherwise (and for every other chapter). */
export function passMidFor(chapterId: string): readonly MidBattleTrigger[] {
  return chapterId === 'seymour-flux' && audioNewOn() ? TRIGGERS : [];
}

/** The scripts those triggers run. */
export function passScriptsFor(chapterId: string): Readonly<Record<string, StoryScript>> {
  return chapterId === 'seymour-flux' && audioNewOn() ? SCRIPTS : {};
}
