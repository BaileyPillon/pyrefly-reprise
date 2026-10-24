/**
 * THE DEMO'S HALF-FULL OVERDRIVE GAUGES (release 62, the conference demo; Bailey, 2026-10-22 ~00:00 EDT, decision 173c: "Start the demo with gauges half full (Recommended)"; demo mode only).
 *
 * **Game case: FFX only in effect, both games in intent.** Chapter I (Seymour Flux, FFX) has an Overdrive gauge per party member, so every member of a demo fight starts on {@link DEMO_START_GAUGE} percent
 * (a visitor reaches their first Overdrive in the first minute, not the fourth; the build's own gauges are 50, 40 and 100 for the fielded three: Kimahri's full gauge is the chapter's sourced rule (`data/ffx/builds/gagazet.ts`, research section 7.9.2), and a demo sets all of them to the same half, as Bailey asked). FFX-2 has no Overdrive gauge: its engine says so (`battle/ffx2/triggers.ts`: "X-2 has no Overdrive gauge"), and the
 * Chapter IV party build has no field for one, so Bahamut's fight comes back exactly as it was. Nothing is invented for FFX-2 (AGENTS.md rules 6 and 14); the ATB gauge is not an Overdrive gauge and is not touched.
 *
 * What it changes: the `overdrive.gauge` a party member's build starts with (0 to 100, one point a percent). The engine, the rules and every roll are the game's: the gauge only means the Overdrive command
 * is offered sooner. Outside demo mode, and for any chapter that is not one of the two demo fights, the build comes back as it came (the same object). A retry builds the setup again and gets the same 50.
 */

import type { FFX2PartyBuild, FFXPartyBuild } from '../../battle/common/types.ts';
import { demoModeOn } from '../demoMode.ts';
import { isDemoFight } from './demoFlow.ts';

/** The gauge every party member of a demo fight starts on, in percent of a full gauge. */
export const DEMO_START_GAUGE = 50;

/**
 * The party build a demo fight starts from. FFX builds get exactly {@link DEMO_START_GAUGE} on every member's gauge, the fielded three and the bench (decision 173c: "every party member's Overdrive gauge at 50 percent"); anything else comes back as given.
 * Pure but for {@link demoModeOn}.
 */
export function demoStartGauges<B extends FFXPartyBuild | FFX2PartyBuild | { game: string }>(chapterId: string, build: B): B {
  if (!demoModeOn() || !isDemoFight(chapterId) || build.game !== 'ffx') return build;
  const ffx = build as unknown as FFXPartyBuild;
  const members = ffx.members.map((m) => (m.overdrive.gauge === DEMO_START_GAUGE ? m : { ...m, overdrive: { ...m.overdrive, gauge: DEMO_START_GAUGE } }));
  return { ...ffx, members } as unknown as B;
}
