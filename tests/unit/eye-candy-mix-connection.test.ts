/**
 * Release 36: the two halves of D-317 meet. The EYE CANDY page's twelve switches (`app/fxParts.ts`, saved in the
 * settings, answered through the `eyeCandyFlags.ts` seam by `applyComfort`) and the MAX mix's nine parts
 * (`engine/fx/mix/gates.ts`, D-316) were built on two branches that agree only through the seam's key names.
 * This pins the connection with no browser: every page switch closes exactly the mix parts it should, for each
 * game, through the real `applyComfort` and the existing OPTIONS-row path (`fxLooksOf`), so a key renamed on one
 * side fails here. The browser proof for the same chain is `docs/handoff/rel36.md`.
 *
 * Pure (no DOM, no `three`). Game case: both; OVERDRIVE SHOT is FFX only and DRESSPHERE SHOT FFX-2 only.
 */
import { afterEach, describe, expect, it } from 'vitest';

import { applyComfort } from '../../src/app/applyComfort.ts';
import { FX_LOOK_ROWS, fxLooksOf } from '../../src/app/fxLooks.ts';
import { FX_PARTS, fxAllOffPatch, fxAllOnPatch, fxSwitchesFor, type FxSwitchField } from '../../src/app/fxParts.ts';
import { eyeCandyOn } from '../../src/engine/fx/eyeCandyFlags.ts';
import { deviceNote, LOOK_KEY, MIX_PARTS, PART_LOOK, partsOn, type GateEnv, type MixGame, type MixPart } from '../../src/engine/fx/mix/gates.ts';

type Settings = Record<FxSwitchField, boolean>;

/**
 * The anchors, written out (not derived from either table, so a pair swapped in one of them fails here): which mix
 * part each page switch is, and which page look it sits under. The label is the player's word, the mix part the code's.
 */
const PART_OF_FIELD: Readonly<Record<string, MixPart>> = {
  fxDof: 'depthOfField', // DEPTH OF FIELD
  fxFog: 'fog', // FOG
  fxEdges: 'smoothEdges', // SMOOTH EDGES
  fxBreath: 'breathing', // BREATHING
  fxKo: 'koCollapse', // KO COLLAPSE
  fxFraming: 'chapterFraming', // CHAPTER FRAMING
  fxHero: 'overdriveShot', // OVERDRIVE SHOT
  fxSphere: 'dressphereShot', // DRESSPHERE SHOT
  fxSplash: 'splashArt', // SPLASH ART
};
const LOOK_OF_FIELD: Readonly<Record<string, FxSwitchField>> = {
  fxDof: 'fxLight', fxFog: 'fxLight', fxEdges: 'fxLight', // CINEMA LIGHT
  fxBreath: 'fxLiving', fxKo: 'fxLiving', // LIVING PAINTINGS
  fxFraming: 'fxSpectacle', fxHero: 'fxSpectacle', fxSphere: 'fxSpectacle', fxSplash: 'fxSpectacle', // BATTLE SPECTACLE
};

const allOn = (): Settings => ({ ...fxAllOnPatch() });
const GAMES: readonly MixGame[] = ['ffx', 'ffx2'];
/** The part the other game owns: the mix never plays it, whatever the switches say. */
const OTHER_GAMES_SHOT: Record<MixGame, MixPart> = { ffx: 'dressphereShot', ffx2: 'overdriveShot' };
/** The held shot each game plays. */
const SHOT_OF: Record<MixGame, MixPart> = { ffx: 'overdriveShot', ffx2: 'dressphereShot' };

/** The mix's gates as the game wires them (`liveGates`): the seam `applyComfort` installed, and the OPTIONS-row look path. */
function envFor(game: MixGame, settings: Settings): GateEnv {
  applyComfort(settings, null);
  const looks = fxLooksOf(settings);
  return { game, tier: 'full', reduceMotion: false, look: (o) => looks[o], on: (k) => eyeCandyOn(k) };
}

/** The parts a game plays with every switch ON: the nine less the other game's shot. */
const gameParts = (game: MixGame): MixPart[] => MIX_PARTS.filter((p) => p !== OTHER_GAMES_SHOT[game]);

const playing = (game: MixGame, settings: Settings): MixPart[] => {
  const on = partsOn(envFor(game, settings));
  return MIX_PARTS.filter((p) => on[p]);
};

afterEach(() => {
  applyComfort(fxAllOnPatch(), null);
});

describe('the page and the mix name the same nine parts under the same three looks', () => {
  it('every page part key is a mix part and every mix part has a page switch', () => {
    expect(FX_PARTS.map((p) => p.key).sort()).toEqual([...MIX_PARTS].sort());
  });

  it('each page switch is the mix part its label names, under the look the label belongs to', () => {
    for (const p of FX_PARTS) {
      expect(p.key, p.label).toBe(PART_OF_FIELD[p.field]);
      expect(p.look, p.label).toBe(LOOK_OF_FIELD[p.field]);
    }
  });

  it('each page part sits under the look the mix gates it by (A: depth of field, fog, smooth edges; B: breathing, KO; C: the rest)', () => {
    for (const p of FX_PARTS) {
      const look = FX_LOOK_ROWS.find((r) => r.field === p.look);
      expect(look, p.label).toBeDefined();
      expect(look!.opt, p.label).toBe(PART_LOOK[p.key as MixPart]);
      expect(look!.key, p.label).toBe(LOOK_KEY[look!.opt]);
    }
    expect(FX_LOOK_ROWS.map((r) => r.key)).toEqual([LOOK_KEY.a, LOOK_KEY.b, LOOK_KEY.c]);
  });

  it('the page lists, for each game, exactly the parts the mix plays there', () => {
    for (const game of GAMES) {
      const listed = fxSwitchesFor(game)
        .filter((r) => r.kind === 'part')
        .map((r) => FX_PARTS.find((p) => p.field === r.field)!.key)
        .sort();
      expect(listed, game).toEqual([...gameParts(game)].sort());
    }
  });
});

describe('a switch flipped on the page closes exactly its parts in the mix', () => {
  it('every switch ON: the game plays its eight parts', () => {
    for (const game of GAMES) expect(playing(game, allOn()), game).toEqual(gameParts(game));
  });

  for (const game of GAMES) {
    for (const part of FX_PARTS) {
      it(`${game}: ${part.label} OFF closes ${part.label} alone`, () => {
        const s = { ...allOn(), [part.field]: false };
        expect(playing(game, s)).toEqual(gameParts(game).filter((p) => p !== PART_OF_FIELD[part.field]));
      });
    }
    for (const look of FX_LOOK_ROWS) {
      it(`${game}: ${look.label} OFF closes every part under it and nothing else, the parts keeping their own value`, () => {
        const s = { ...allOn(), [look.field]: false };
        const under = Object.entries(LOOK_OF_FIELD).filter(([, l]) => l === look.field).map(([f]) => PART_OF_FIELD[f]!);
        expect(under.length).toBeGreaterThan(0);
        expect(playing(game, s)).toEqual(gameParts(game).filter((p) => !under.includes(p)));
        // the page's parts keep ON in the save (drawn dim); only the seam and the mix stop
        for (const f of Object.keys(LOOK_OF_FIELD).filter((x) => LOOK_OF_FIELD[x] === look.field)) expect(s[f as FxSwitchField]).toBe(true);
      });
    }
  }

  it('the look the mix reads from the OPTIONS row and the look the seam answers are the same switch', () => {
    for (const look of FX_LOOK_ROWS) {
      const s = { ...allOn(), [look.field]: false };
      applyComfort(s, null);
      expect(fxLooksOf(s)[look.opt], look.label).toBe(false);
      expect(eyeCandyOn(look.key), look.label).toBe(false);
      for (const other of FX_LOOK_ROWS.filter((r) => r !== look)) {
        expect(fxLooksOf(s)[other.opt], other.label).toBe(true);
        expect(eyeCandyOn(other.key), other.label).toBe(true);
      }
    }
  });

  it('ALL OFF stops the whole mix, ALL ON brings it back, in both games', () => {
    for (const game of GAMES) {
      expect(playing(game, { ...allOn(), ...fxAllOffPatch() }), game).toEqual([]);
      expect(playing(game, { ...allOn(), ...fxAllOffPatch(), ...fxAllOnPatch() }), game).toEqual(gameParts(game));
    }
  });

  it('a part turned off stays off when its look comes back (the look is the master, the part keeps its value)', () => {
    for (const game of GAMES) {
      const off = { ...allOn(), fxFog: false, fxLight: false };
      expect(playing(game, off), game).not.toContain('fog');
      const lookBack = { ...off, fxLight: true };
      const p = playing(game, lookBack);
      expect(p, game).not.toContain('fog');
      expect(p, game).toEqual(expect.arrayContaining(['depthOfField', 'smoothEdges']));
    }
  });

  it("REDUCE MOTION and the tier act in the mix, never on the switches: the seam still answers every key ON", () => {
    for (const game of GAMES) {
      const env = { ...envFor(game, allOn()), reduceMotion: true, tier: 'phone' as const };
      const on = partsOn(env);
      expect(on.breathing, game).toBe(false);
      expect(on.depthOfField, game).toBe(false);
      expect(on.fog, game).toBe(true);
      for (const p of MIX_PARTS) expect(eyeCandyOn(p), p).toBe(true);
    }
  });

  it("REDUCE MOTION leaves each game's held shot playing, as the approved page says (ON · CUT: one static cut in, one cut back) and stills the breathing", () => {
    for (const game of GAMES) {
      const on = partsOn({ ...envFor(game, allOn()), reduceMotion: true });
      expect(on[SHOT_OF[game]], game).toBe(true);
      expect(on.koCollapse, game).toBe(true);
      expect(on.breathing, game).toBe(false);
    }
  });

  it("what the page says OFF HERE for a tier the mix does not play, and what it leaves plain or calls LESS HERE still plays (the phone layout is the DOM's, checked in the browser)", () => {
    for (const game of GAMES)
      for (const tier of ['full', 'phone', 'low'] as const) {
        const on = partsOn({ ...envFor(game, allOn()), tier });
        for (const part of gameParts(game)) {
          const limit = deviceNote(part, { tier, phone: false })?.limit ?? null;
          expect(on[part], `${game} ${tier} ${part}`).toBe(limit !== 'off');
        }
      }
  });
});
