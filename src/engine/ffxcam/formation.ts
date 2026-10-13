/**
 * **The formation host**: a {@link CameraHost} (`./host.ts`) that answers a camera program's questions from a table of who is on the field, kept by whoever drives it.
 *
 * The director (`./director.ts`) owns one. The scene registers the roster once (`setRoster`: our combatant ids against FFX character numbers and sides, `0..6` the party, `20..` the monsters) and
 * feeds the characters' frames (`setFrame`, or one `setSource` callback read live, so a shot follows an actor that lunges); the director sets who is acting and who is targeted at each beat, and the
 * command's FFX id. The host does the rest:
 *
 * - **Selectors** (SPEC 7.3): a character number, `0x1000 + n` a monster number, -2/-13/-18 the acting one, -3/-4 the targets, -5/-21 everyone, -6..-8 the first three of the party, -9..-12 the reserve,
 *   -14 the front line (party and aeons), -15 the monsters, -19 the party and reserve, -20 the aeons; anything else names nobody.
 * - **Properties** (`readBtlChrProperty`): what the owner has set, else a stand-in: alive and front line for those on the field, `Position` the party slot, BattleDistance 0. The stand-ins are not
 *   game data; they keep a program on its ordinary path until the owner knows better.
 * - **Value queries** the programs of the Evrae fight ask (the chosen command, reflect, how many of one group are in another, the character and enemy numbers, heights and widths, headings), constants
 *   from the loaded data (`CurrentBattle()`), and a handful of presentation questions (is there water, are subtitles on) that answer 0.
 *   Headings are the actor's own in degrees for both `btlGetChrDir` and `btlGetChrTargetDir2`, so their difference, which the spell shots use as a yaw, is 0: whether FFX's two differ is Open.
 *
 * A query the host has never heard of answers `undefined`, and the VM logs it once. Pure. Game case: FFX only.
 */

import type { CombatantId } from '../../battle/common/types.ts';
import type { ActorFrame, CameraHost, PresentationRandom } from './host.ts';
import { R2D } from './geometry.ts';

export type FormationSide = 'party' | 'reserve' | 'monster' | 'aeon';

export interface RosterEntry {
  readonly id: CombatantId;
  /** The FFX character number: 0..6 for the party, 20 and up for the monsters of a formation. */
  readonly chr: number;
  readonly side: FormationSide;
  /** A monster's number (`dereferenceCharacter` answers `0x1000 | number`). */
  readonly monsterNumber?: number | undefined;
}

/** The property ids the host gives stand-ins for (SPEC 7.1). */
export const PROP = { alive: 4, frontline: 21, position: 29, battleDistance: 30 } as const;

export interface FormationHostOptions {
  readonly random: PresentationRandom;
  /** Constant answers by query name (`CurrentBattle`): the loaded encounter's. */
  readonly constants?: Readonly<Record<string, number>> | undefined;
  /** A program wrote a character property (`writeBtlChrProperty`: 216 is "visible to the camera"); the characters its selector names right now. */
  readonly onWrite?: ((chrs: readonly number[], property: number, value: number) => void) | undefined;
}

/** Queries that answer 0 until an owner says otherwise: presentation and AI questions no camera program of the Evrae fight depends on. */
const ZERO_QUERIES: ReadonlySet<string> = new Set(['isWater?', 'SubtitlesEnabled?', 'btlGetVoiceStatus', 'btlDistTarget', 'btlDistTargetFrame2', 'btlGetChrTargetDir', 'btlGetTargetDir']);

const wrap180 = (deg: number): number => ((((deg + 180) % 360) + 360) % 360) - 180;

export class FormationHost implements CameraHost {
  /** The FFX id of the command being run (`chosenCommand()`). */
  command = 0;
  /** 1 when the target group reflects (`btlGetReflect()`); the director has no status data, so the owner sets it. */
  reflect = 0;
  /** `btlGetLastActionChr()` and `btlGetLastDeathChr()`. */
  lastActor = 0;
  lastDead = 0;

  private entries: readonly RosterEntry[] = [];
  private readonly byChr = new Map<number, RosterEntry>();
  private readonly byId = new Map<CombatantId, RosterEntry>();
  private readonly frames = new Map<number, ActorFrame>();
  private source: ((chr: number) => ActorFrame | undefined) | undefined;
  private readonly props = new Map<string, number>();
  private acting: number | undefined;
  private targeted: readonly number[] = [];
  private readonly random_: PresentationRandom;
  private readonly constants: ReadonlyMap<string, number>;
  private readonly onWrite: FormationHostOptions['onWrite'];

  constructor(opts: FormationHostOptions) {
    this.random_ = opts.random;
    this.constants = new Map(Object.entries(opts.constants ?? {}));
    this.onWrite = opts.onWrite;
  }

  // ------------------------------------------------------- what the owner sets

  setRoster(entries: readonly RosterEntry[]): void {
    this.entries = entries;
    this.byChr.clear();
    this.byId.clear();
    for (const e of entries) {
      this.byChr.set(e.chr, e);
      this.byId.set(e.id, e);
    }
  }

  chrOf(id: CombatantId): number | undefined {
    return this.byId.get(id)?.chr;
  }

  setFrame(chr: number, frame: ActorFrame | undefined): void {
    if (frame) this.frames.set(chr, frame);
    else this.frames.delete(chr);
  }

  /** A live frame provider, read on every query; it wins over `setFrame`'s. */
  setSource(source: ((chr: number) => ActorFrame | undefined) | undefined): void {
    this.source = source;
  }

  setProperty(chr: number, property: number, value: number): void {
    this.props.set(`${chr}:${property}`, value);
  }

  getProperty(chr: number, property: number): number | undefined {
    return this.props.get(`${chr}:${property}`);
  }

  setActing(chr: number | undefined): void {
    this.acting = chr;
  }

  setTargets(chrs: readonly number[]): void {
    this.targeted = chrs;
  }

  // ------------------------------------------------------------ CameraHost

  random(stream: number): number {
    return this.random_.next(stream);
  }

  actor(chr: number): ActorFrame | undefined {
    return this.source?.(chr) ?? this.frames.get(chr);
  }

  write(selector: number, property: number, value: number): void {
    this.onWrite?.(this.select(selector), property, value);
  }

  select(selector: number): readonly number[] {
    if (selector >= 0x1000) return this.entries.filter((e) => e.side === 'monster' && e.monsterNumber === selector - 0x1000).map((e) => e.chr);
    if (selector >= 0) return this.byChr.has(selector) ? [selector] : [];
    switch (selector) {
      case -2:
      case -13:
      case -18:
        return this.acting === undefined ? [] : [this.acting];
      case -3:
      case -4:
        return this.targeted.filter((c) => this.byChr.has(c));
      case -5:
      case -21:
        return this.entries.map((e) => e.chr);
      case -6:
      case -7:
      case -8: {
        const c = this.chrs('party')[-6 - selector];
        return c === undefined ? [] : [c];
      }
      case -9:
      case -10:
      case -11:
      case -12: {
        const c = this.chrs('reserve')[-9 - selector];
        return c === undefined ? [] : [c];
      }
      case -14:
        return this.entries.filter((e) => e.side === 'party' || e.side === 'aeon').map((e) => e.chr);
      case -15:
        return this.chrs('monster');
      case -19:
      case -24:
        return this.entries.filter((e) => e.side === 'party' || e.side === 'reserve').map((e) => e.chr);
      case -20:
        return this.chrs('aeon');
      case -23:
        return this.entries.filter((e) => e.side !== 'monster').map((e) => e.chr);
      default:
        return [];
    }
  }

  query(name: string, args: readonly number[]): number | undefined {
    const fixed = this.constants.get(name);
    if (fixed !== undefined) return fixed;
    const first = this.select(args[0] ?? -1)[0];
    switch (name) {
      case 'chosenCommand':
        return this.command;
      case 'btlGetReflect':
        return this.reflect;
      case 'btlGetLastActionChr':
        return this.lastActor;
      case 'btlGetLastDeathChr':
        return this.lastDead;
      case 'readBtlChrProperty':
        return first === undefined ? 0 : (this.getProperty(first, args[1] ?? 0) ?? this.standIn(first, args[1] ?? 0));
      case 'countChrOverlap': {
        const b = new Set(this.select(args[1] ?? -1));
        return this.select(args[0] ?? -1).filter((c) => b.has(c)).length;
      }
      case 'dereferenceCharacter': {
        const e = first === undefined ? undefined : this.byChr.get(first);
        if (!e) return -1;
        return e.side === 'monster' ? 0x1000 | (e.monsterNumber ?? 0) : e.chr;
      }
      case 'dereferenceEnemy': {
        if (first === undefined) return 0xff;
        const e = this.byChr.get(first);
        if (e?.side === 'monster') return Math.max(0, this.chrs('monster').indexOf(first));
        const slot = this.chrs('party').indexOf(first);
        return slot < 0 ? 0xff : -6 - slot;
      }
      case 'btlGetChrDir':
      case 'btlGetChrTargetDir2': {
        const f = first === undefined ? undefined : this.actor(first);
        return f ? wrap180(f.heading * R2D) : 0;
      }
      case 'btlGetCamHeight':
      case 'btlGetHeight':
        return (first === undefined ? undefined : this.actor(first))?.height ?? 0;
      case 'btlGetCamWidth':
        return (first === undefined ? undefined : this.actor(first))?.width ?? 0;
      case 'findMatchingChr':
      case 'btlSearchChrCamera':
        return first ?? 0;
    }
    return ZERO_QUERIES.has(name) ? 0 : undefined;
  }

  // -------------------------------------------------------------- internals

  private chrs(side: FormationSide): number[] {
    return this.entries.filter((e) => e.side === side).map((e) => e.chr);
  }

  /** The stand-in for a property nobody has set (not game data). */
  private standIn(chr: number, property: number): number {
    const e = this.byChr.get(chr);
    if (!e) return 0;
    if (property === PROP.alive) return 1;
    if (property === PROP.frontline) return e.side === 'party' || e.side === 'aeon' ? 1 : 0;
    if (property === PROP.position) return Math.max(0, this.chrs('party').indexOf(chr));
    return 0;
  }
}
