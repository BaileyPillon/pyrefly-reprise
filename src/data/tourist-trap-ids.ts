/**
 * The ids of the hidden FFX-2 chapter Tourist Trap (Yojimbo and Daigoro in the Cavern of the Stolen Fayth; branch `ch-tourist-trap`), in one dependency-free place: the chapter record,
 * its pause metadata, the scene registry and the word on chapter select all read these, so none of them imports another's module just for a string. **FFX-2 only** [AGENTS.md rule 14].
 */

/** The chapter's id: its key in the experiments' store. Named for the mission, not "experiment": the project already means a hidden preview by that word (`Chapter.experimental`). */
export const TOURIST_TRAP_ID = 'ffx2-tourist-trap' as const;

/** The scene key: the FFX-2 stage for the Cavern (`src/scenes/tourist-trap-cavern.ts`). */
export const TOURIST_TRAP_SCENE = 'ffx2-tourist-trap-cavern';

/** The painting: Chapter IX's approved Cavern plate, read-only and shared (`public/art/backdrops/cavern-stolen-fayth.png`). Nothing is copied or replaced. */
export const TOURIST_TRAP_PLATE = 'cavern-stolen-fayth';
