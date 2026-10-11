/**
 * **The program book**: which camera program answers a request, and what a loaded encounter's camera data is made of.
 *
 * FFX never says "play this shot". Battle code raises a numbered **tag** (Enter 24, Select 25, Normal 28, command accepted 61, victory 66, defeat 67, the MagicStart family 27/50/59...), optionally with
 * the id of the command being run, and the engine starts the first script that has a handler for it (`SPEC.md` section 5):
 *
 * 1. the **formation's** script, then 2. the **common** script, and within each script
 * 3. the **command worker** first when the command id has one (the id's top nibble picks the worker: 0x2xxx items, 0x3xxx party and aeon commands, 0x4xxx, 0x6xxx monster moves; the tag is `id & 0xFFF`),
 * 4. then the camera handler with each of the request's tags in turn.
 *
 * Starting a request kills whatever the camera thread was running. {@link ProgramBook.resolve} is that lookup over a tag table (`script:hookSlot:tag` -> program id; the hook slot in decimal, the
 * camera handler is slot 0) and the loaded programs; it does the choosing, the VM (`./vm.ts`) does the running.
 *
 * Also here: the shapes of the rest of what `./load.ts` hands the director for an encounter: the per-ability **action table** (which tags an ability raises, in which order), the **range** rules for
 * a pull back and a move in, and constants the programs ask the host (`CurrentBattle()`). All of that is data from Bailey's local folder, none of it in the repo (rule 8).
 *
 * Pure. Game case: FFX only.
 */

import type { CharExtents } from './extents.ts';
import type { Program } from './ir.ts';

/** The hook slot of the camera handler. Every `camReq` and every beat's own request goes to it. */
export const CAMERA_SLOT = 0;

/** Command worker hook slots by the command id's top nibble (SPEC 5). */
export const COMMAND_WORKER_SLOT: Readonly<Record<number, number>> = { 0x2: 0x44, 0x3: 0x41, 0x4: 0x47, 0x6: 0x4a };

/** A shot request: the tags to try, in order, and the command being run when there is one. */
export interface CameraRequest {
  readonly tags: readonly number[];
  readonly command?: number | undefined;
}

export class ProgramBook {
  private readonly byId = new Map<string, Program>();

  /**
   * @param tags `"script:hookSlot:tag"` -> program id, for every script
   * @param scripts the scripts in candidate order: the formation's first, the common script's last
   */
  constructor(
    programs: Iterable<Program>,
    private readonly tags: Readonly<Record<string, string>>,
    private readonly scripts: readonly string[],
  ) {
    for (const p of programs) this.byId.set(p.id, p);
  }

  get size(): number {
    return this.byId.size;
  }

  ids(): string[] {
    return [...this.byId.keys()];
  }

  get(id: string): Program | undefined {
    return this.byId.get(id);
  }

  /** The table keys a request tries, in order (what {@link resolve} walks). */
  candidates(req: CameraRequest): string[] {
    const keys: string[] = [];
    const worker = req.command === undefined ? undefined : COMMAND_WORKER_SLOT[req.command >> 12];
    for (const script of this.scripts) {
      if (worker !== undefined && req.command !== undefined) keys.push(`${script}:${worker}:${req.command & 0xfff}`);
      for (const tag of req.tags) keys.push(`${script}:${CAMERA_SLOT}:${tag}`);
    }
    return keys;
  }

  /** The first candidate with a handler, as the engine starts it; undefined when nothing answers. */
  resolve(req: CameraRequest): Program | undefined {
    for (const key of this.candidates(req)) {
      const id = this.tags[key];
      const program = id === undefined ? undefined : this.byId.get(id);
      if (program) return program;
    }
    return undefined;
  }

  /** Shorthand for a single-tag request. */
  forTag(tag: number): Program | undefined {
    return this.resolve({ tags: [tag] });
  }
}

/**
 * One request an ability raises besides "command accepted" and "after the action": at the action's **start** (the cast begins, the swing is launched at acceptance) or at its **launch** (the effect
 * fires). `worker`: the command's own worker is asked first with the command id.
 */
export interface ActionStep {
  readonly at: 'start' | 'launch';
  readonly tags: readonly number[];
  readonly worker: boolean;
}

/** An ability's camera facts: its FFX command id (what `chosenCommand()` answers while it runs) and the requests it raises. */
export interface ActionRow {
  readonly command: number;
  readonly steps: readonly ActionStep[];
}

/** Rows by the repo's ability id (and item id); `attack` is the plain Attack of each side. */
export interface ActionTable {
  readonly party: Readonly<Record<string, ActionRow>>;
  readonly monster: Readonly<Record<string, ActionRow>>;
  readonly items: Readonly<Record<string, ActionRow>>;
  readonly attack: { readonly party?: ActionRow | undefined; readonly monster?: ActionRow | undefined };
}

/** What a range change (the airship pulling back or closing in) sets before the scene program runs. */
export interface RangeMove {
  /** The value the scene program's selector variable gets. */
  readonly value: number;
  /** The distance property the host answers while and after the move (BattleDistance: 0 close, 3 far). */
  readonly distance: number;
}

export interface RangeSpec {
  /** The tag of the scene program (the airship cinematic). */
  readonly tag: number;
  /** The battle variable the scene program reads to tell a pull back from a move in. */
  readonly variable: string;
  /** The character whose distance property the programs read, and the property. */
  readonly chr: number;
  readonly distanceProp: number;
  readonly pullBack: RangeMove;
  readonly moveIn: RangeMove;
}

/** Everything the director needs of one encounter's loaded camera data. */
export interface FfxCameraPrograms {
  readonly encounter: string;
  /** Where the data came from, in words (provenance; never shown). */
  readonly source: string;
  readonly book: ProgramBook;
  readonly actions: ActionTable;
  /** Constant answers to value queries (`CurrentBattle`): the host seeds itself with them. */
  readonly constants: Readonly<Record<string, number>>;
  /** Null when the encounter has no range game. */
  readonly range: RangeSpec | null;
  /** The characters' camera extents (`./extents.ts`), by FFX character number; empty when the folder has no `extents.json` (the scene then measures its own models). */
  readonly extents: CharExtents;
}
