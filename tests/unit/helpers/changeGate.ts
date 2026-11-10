/**
 * Helpers for the gate on an ordinary Change (`src/battle/ffx2/spherechange.ts#ordinaryChangeAllowed`; FFX-2 only; the review fix pass 3 of the Special Dress Up).
 *
 * Every FFX-2 chapter build the tree has is opened through `setupForChapter` (the very setup the app builds) with the `specialDressUp` option ABSENT (the shipped default), explicitly OFF, or ON.
 * A girl is brought to her first menu with the others defending; a command is then forged and handed to `engine.submit`, the public command API (the debug console's `forceCommand` is the same call).
 * The state, the event list and the random stream afterwards are compared with the engine's own refusal of an unlinked Change (`Not linked`, her turn spent): the reference refusal.
 */

import type { BattleEvent, Command, FFX2PartyBuild } from '../../../src/battle/common/types.ts';
import type { BattleRng, RngSnapshot } from '../../../src/battle/common/streams.ts';
import { FFX2Engine, garmentGridRegistryFrom } from '../../../src/battle/ffx2/index.ts';
import { adjacentNodes } from '../../../src/battle/ffx2/garment-grids.ts';
import { gridNodeContents } from '../../../src/battle/ffx2/setup.ts';
import { setupForChapter } from '../../../src/app/screens/BattleScreenSetup.ts';
import { CHAPTERS, EXPERIMENT_CHAPTERS, UNLISTED_CHAPTERS, type Chapter } from '../../../src/data/encounters.ts';
import * as data from '../../../src/data/ffx2/index.ts';
import { ffx2Options } from './ffx2ChapterDrive.ts';
import { nextInput, unit, type Input } from './specialDrive.ts';

export type Mode = 'absent' | 'off' | 'on';
export const MODES: readonly Mode[] = ['absent', 'off', 'on'];
export const SPECIALS = ['floral-fallal', 'machina-maw', 'full-throttle'] as const;
export const OWN_SPECIAL: Readonly<Record<string, string>> = { yuna: 'floral-fallal', rikku: 'machina-maw', paine: 'full-throttle' };

const grids = garmentGridRegistryFrom(Object.values(data.GARMENT_GRIDS));

/** Every FFX-2 chapter build the tree has: the listed chapters, the unlisted ones (51 and 52 among them) and the experiments (exp-leblanc). */
export const ffx2Chapters = (): Chapter[] => [...CHAPTERS, ...UNLISTED_CHAPTERS, ...EXPERIMENT_CHAPTERS].filter((c) => c.game === 'ffx2');

/** The real engine for a chapter, set up as the app sets the first link up; the switch ABSENT, OFF or ON. */
export function openIn(chapter: Chapter, mode: Mode, seed = 1, tweak?: (party: FFX2PartyBuild) => void): FFX2Engine {
  const option = mode === 'absent' ? {} : { specialDressUp: mode === 'on' };
  const engine = new FFX2Engine(ffx2Options({ atbMode: 'wait', ...option }));
  engine.setSeed(seed);
  const setup = setupForChapter(chapter, seed);
  const party = structuredClone(setup.party) as FFX2PartyBuild;
  tweak?.(party); // a rig: a build the shipped data does not have (a Special listed within the node count)
  engine.init({ ...setup, party });
  return engine;
}

/** The girls of a chapter's party who wear dresspheres, in the build's order. */
export const girlsOf = (chapter: Chapter): string[] => (setupForChapter(chapter, 1).party as FFX2PartyBuild).members.filter((m) => m.garmentGrid !== undefined).map((m) => m.id);

/** Play on (everyone else defends) to the girl's first menu; `null` if the battle ended first. */
export function toGirl(engine: FFX2Engine, girl: string): Input | null {
  for (let i = 0; i < 200; i++) {
    const d = nextInput(engine);
    if (d === null) return null;
    if (d.actorId === girl) return d;
    engine.submit({ kind: 'defend', targets: [] });
  }
  return null;
}

export const stateOf = (engine: FFX2Engine): unknown => JSON.parse(JSON.stringify(engine.state()));
export const rngOf = (engine: FFX2Engine): RngSnapshot => (engine as unknown as { rng: BattleRng }).rng.saveState();

/** The node contents the engine laid out for a girl in this mode, from the very function `setup.ts` calls. */
export function layoutOf(chapter: Chapter, girl: string, mode: Mode): Array<string | null> {
  const member = (setupForChapter(chapter, 1).party as FFX2PartyBuild).members.find((m) => m.id === girl)!;
  return gridNodeContents(member, grids.get(member.garmentGrid.id)!.nodes, mode === 'on');
}

/** The nodes one link from where she stands, with the gates on the link. */
export function linkedNodes(engine: FFX2Engine, girl: string): Array<{ node: number; gates: string[] }> {
  const sphere = unit(engine, girl).dresspheres!;
  return adjacentNodes(grids.get(sphere.garmentGrid.id)!, sphere.garmentGrid.nodePosition);
}

export interface Forged {
  label: string;
  command: Command;
  /** The Special path itself takes this command (switch ON, her own Special, flag true): it answers `Not ready` instead of `Not linked`. */
  specialPath: boolean;
}

const cmd = (to: string | null, node: number, flag: boolean | undefined, gates: string[] = []): Command =>
  ({ kind: 'spherechange', targets: [], extra: { toDressphere: to, toNode: node, gatesCrossed: gates, ...(flag === undefined ? {} : { specialDressUp: flag }) } }) as unknown as Command;

/**
 * Every forged route of the fix 2 proof (a Special named at a node linked to hers, with the flag true, false or absent; another girl's Special; a dress that does not exist), and the ones the gate
 * adds: an empty dress, a dress she owns that sits on another node, the node's own dress carrying the Special flag.
 */
export function forgeries(girl: string, mode: Mode, link: { node: number; gates: string[] }, layout: ReadonlyArray<string | null>, owned: readonly string[]): Forged[] {
  const out: Forged[] = [];
  for (const special of SPECIALS) {
    for (const flag of [true, false, undefined] as const) {
      out.push({ label: `${special}, flag ${String(flag)}, node ${link.node}`, command: cmd(special, link.node, flag, link.gates), specialPath: mode === 'on' && flag === true && special === OWN_SPECIAL[girl] });
    }
  }
  out.push({ label: `no-such-dress, node ${link.node}`, command: cmd('no-such-dress', link.node, false, link.gates), specialPath: false });
  out.push({ label: `an empty dress, node ${link.node}`, command: cmd(null, link.node, undefined, link.gates), specialPath: false });
  const here = layout[link.node];
  const elsewhere = owned.find((d) => d !== here && !SPECIALS.includes(d as (typeof SPECIALS)[number]));
  if (elsewhere !== undefined) out.push({ label: `${elsewhere} (another dress she owns), node ${link.node}`, command: cmd(elsewhere, link.node, undefined, link.gates), specialPath: false });
  if (here != null) out.push({ label: `${here} (the node's own dress) carrying the Special flag, node ${link.node}`, command: cmd(here, link.node, true, link.gates), specialPath: false });
  return out;
}

/** The `extra` of a spherechange row. */
export const extraOf = (row: { command: Command }): { toNode: number; toDressphere: string; specialDressUp?: boolean } => (row.command as unknown as { extra: { toNode: number; toDressphere: string; specialDressUp?: boolean } }).extra;

/** The events of a refusal, as the messages they carry. */
export const messagesOf = (events: BattleEvent[]): string[] => events.flatMap((e) => (e.type === 'message' ? [e.text] : []));
