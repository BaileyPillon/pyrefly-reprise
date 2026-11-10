// @vitest-environment jsdom
/**
 * Test 21, the fight half, of the FFX-2 Special look (step D2; game case: FFX-2 only in what is seen: the three Special dresspheres exist only in FFX-2; the surfaces read below are
 * shared by both games and none is edited by this file's cases, see the handoff's section 13 for the one that is).
 *
 * The always-visible surfaces with a REAL form up (`formUp`: the real engine, each girl walked along her own Garment Grid to her Special), each against the required result of D-32:
 * the surfaces name the three plates (the girl, then the two parts by their own names) and nothing else; a part is never given a girl's plate or count; a girl who is away is never named,
 * counted or offered a revive. One `describe` per surface; each case runs once with the form up, the OFF half (the ordinary three-girl answer) where the surface has one.
 *
 * This file holds the turn cut-in, the Strategy Guide, the enemy-intent slab, the move advisor and the phone framing. The results page, the HUD's party column, the held-list case and the pro KO
 * marks are in `special-surfaces-fight-hud.test.ts` (the file was one of 444 lines until review fix pass 2, item O3, split it by whole `describe` blocks; no case changed). What both read
 * is in `helpers/specialFightSurfaces.ts`.
 *
 * Method: each case was written first against the head D2 started from; where it failed, the smallest edit in the surface's own read point was made (the handoff's table says which).
 * Removal check: delete `plateMemberFor` / the field-mark guard and the pause and field-mark cases fail; add a part-hiding filter to any surface and its case here fails.
 */

import { beforeEach, describe, expect, it } from 'vitest';
import type { BattleState } from '../../src/battle/common/types.ts';
import type { MomentsPort } from '../../src/engine/BattlePresenterPorts.ts';
import { setPortraitMode } from '../../src/engine/CutInMode.ts';
import { awayGirlIds } from '../../src/engine/SpecialFormMembers.ts';
import { TurnCutInBeat } from '../../src/engine/TurnCutIn.ts';
import { playTurnCutIn } from '../../src/ui/common/transitions/TurnCutInLayer.ts';
import { FRAME_WEIGHTS, framedIds, koFramingChapter } from '../../src/ui/common/phoneFraming.ts';
import { nextInput, openSpecial, unit } from './helpers/specialDrive.ts';
import { bahamutGroup, chapterIV, FORM_GIRLS, fell, formUp } from './helpers/specialFormState.ts';
import { cardOf, GIRL_IDS, guideLine, off, useFightHooks } from './helpers/specialFightSurfaces.ts';
import { awayOf, fallenPartMenu, namedAway, PLATE_NAMES, walkPlates } from './helpers/specialSurfaces.ts';

useFightHooks();

// ---------------------------------------------------------------------------------------------------------------------------------
// The turn cut-in (only under ?portraits=turns)
// ---------------------------------------------------------------------------------------------------------------------------------

type Req = Parameters<NonNullable<MomentsPort['turnCutIn']>>[0];
const cutInPort = (calls: Req[]): MomentsPort => ({ letterbox: async () => {}, nameSlab: async () => {}, vignette: () => {}, clear: () => {}, turnCutIn: async (req) => void calls.push(req) });

describe('the turn cut-in', () => {
  beforeEach(() => setPortraitMode('turns'));

  for (const { girl } of FORM_GIRLS) {
    it(`${girl}: ATB 1, 2, 3 OF 3 for the main and her two parts by their own names; an away girl has none`, async () => {
      const s = formUp(girl).state as BattleState;
      const calls: Req[] = [];
      const beat = new TurnCutInBeat({ moments: cutInPort(calls), speed: () => 'normal' });
      for (const id of s.activeIds) await beat.play(s, id);
      for (const away of awayGirlIds(s)) {
        expect(beat.wants(s, away), away).toBe(false);
        await beat.play(s, away);
      }
      expect(calls.map((c) => c.label)).toEqual(['ATB 1 OF 3', 'ATB 2 OF 3', 'ATB 3 OF 3']);
      expect(calls.map((c) => c.name)).toEqual(PLATE_NAMES[girl]);
      expect(calls.map((c) => c.actorId)).toEqual(s.activeIds);
      // D-32 (b) and AC-13: a part has no portrait of its own, so the portrait asked for is its main's, never one named for the part
      expect(calls.map((c) => c.portraitId ?? c.actorId), 'the main\'s portrait on each of the three slabs').toEqual([girl, girl, girl]);
      expect(calls[0]!.portraitId, 'the main asks for her own').toBeUndefined();
    });

    it(`${girl}: the slab draws the main's portrait file for a part, and the part's id is in no URL`, async () => {
      const s = formUp(girl).state as BattleState;
      const calls: Req[] = [];
      const beat = new TurnCutInBeat({ moments: cutInPort(calls), speed: () => 'normal' });
      for (const id of s.activeIds) await beat.play(s, id);
      const host = document.createElement('div');
      Object.defineProperty(host, 'clientWidth', { value: 1600 });
      Object.defineProperty(host, 'clientHeight', { value: 900 });
      document.body.append(host);
      for (const req of calls) {
        const played = playTurnCutIn(host, { ...req, holdMs: 5 });
        const src = host.querySelector<HTMLImageElement>('[data-role="turn-cut-in"] img.ig-cutin__portrait')!.getAttribute('src')!;
        await played;
        expect(src, req.actorId).toContain(`art/portraits/${girl}-x2.png`);
        for (const part of FORM_GIRLS.find((g) => g.girl === girl)!.parts) expect(src, req.actorId).not.toContain(part);
      }
    });
  }

  it('OFF: the ordinary three girls, ATB 1 to 3 OF 3', async () => {
    const calls: Req[] = [];
    const beat = new TurnCutInBeat({ moments: cutInPort(calls), speed: () => 'normal' });
    const s = off();
    for (const id of GIRL_IDS) await beat.play(s, id);
    expect(calls.map((c) => [c.name, c.label])).toEqual([['Yuna', 'ATB 1 OF 3'], ['Rikku', 'ATB 2 OF 3'], ['Paine', 'ATB 3 OF 3']]);
  });
});

// ---------------------------------------------------------------------------------------------------------------------------------
// The Strategy Guide's NEXT line
// ---------------------------------------------------------------------------------------------------------------------------------


describe('the Strategy Guide', () => {
  for (const { girl } of FORM_GIRLS) {
    it(`${girl}: the NEXT line is for the acting plate and names plates or non-party words only, never an away girl`, () => {
      const met = walkPlates(girl, (m) => {
        const line = guideLine(m);
        const enemies = m.state.enemyIds.map((id) => m.state.combatants[id]!.name);
        expect(line.chapter).toBe('ffx2-bahamut');
        expect(line.actor, m.d.actorId).toBe(m.state.combatants[m.d.actorId]!.name);
        expect(PLATE_NAMES[girl]).toContain(line.actor);
        expect([...PLATE_NAMES[girl], ...enemies, 'the party', 'all enemies'], `${m.d.actorId} aims at ${line.target}`).toContain(line.target);
        expect(namedAway(girl, line.actor, line.target, line.label, line.phase, ...line.watch), m.d.actorId).toEqual([]);
      });
      expect(met).toHaveLength(3);
    });
  }

  it('OFF: the line is for one of the ordinary three girls', () => {
    const engine = openSpecial({ build: chapterIV(), group: bahamutGroup, seed: 1, specials: false });
    const d = nextInput(engine)!;
    const line = guideLine({ engine, state: engine.state() as BattleState, snapshot: engine.gaugeSnapshot(), d });
    expect(['Yuna', 'Rikku', 'Paine']).toContain(line.actor);
  });
});

// ---------------------------------------------------------------------------------------------------------------------------------
// The enemy-intent slab
// ---------------------------------------------------------------------------------------------------------------------------------

describe('the enemy-intent slab', () => {
  for (const { girl } of FORM_GIRLS) {
    it(`${girl}: the targets listed are the plates that stand, all three when the move hits the party, never an away girl`, () => {
      const up = formUp(girl);
      for (const id of up.state.activeIds) delete unit(up.engine, id).statuses['invincible']; // a rig of the measurement: nobody is spared by it, so every plate is touched
      let party: string[] | null = null;
      for (let i = 0; i < 60 && party === null; i++) {
        const intent = up.engine.intent();
        const s = up.engine.state() as BattleState;
        const rows = [...(intent?.estimate?.perTarget ?? []), ...((intent?.randomTarget as { rows?: Array<{ targetId: string }> } | null | undefined)?.rows ?? [])].map((r) => r.targetId);
        for (const id of rows) expect(s.activeIds, `${intent?.moveName} lists ${id}`).toContain(id);
        for (const away of awayOf(girl)) expect(rows, away).not.toContain(away);
        if (intent?.moveName === 'Impulse') party = [...(intent.estimate?.perTarget ?? [])].map((r) => r.targetId);
        const d = nextInput(up.engine);
        if (d === null) break;
        up.engine.submit({ kind: 'defend', targets: [] });
      }
      expect(party, 'Bahamut reaches an Impulse, which hits the whole party').not.toBeNull();
      expect([...party!].sort()).toEqual([girl, ...FORM_GIRLS.find((g) => g.girl === girl)!.parts].sort());
    });
  }

  it('OFF: the ordinary answer, the three girls (never a part)', () => {
    const engine = openSpecial({ build: chapterIV(), group: bahamutGroup, seed: 1, specials: false, immortal: true });
    for (const id of GIRL_IDS) delete unit(engine, id).statuses['invincible']; // the same rig as above: nobody is spared by it
    let party: string[] | null = null;
    for (let i = 0; i < 60 && party === null; i++) {
      const intent = engine.intent();
      if (intent?.moveName === 'Impulse') party = [...(intent.estimate?.perTarget ?? [])].map((r) => r.targetId);
      if (nextInput(engine) === null) break;
      engine.submit({ kind: 'defend', targets: [] });
    }
    expect(party, 'Bahamut reaches an Impulse, which hits the whole party').not.toBeNull();
    expect([...party!].sort()).toEqual([...GIRL_IDS].sort());
  });
});

// ---------------------------------------------------------------------------------------------------------------------------------
// The move advisor's card
// ---------------------------------------------------------------------------------------------------------------------------------


describe('the move advisor', () => {
  for (const { girl } of FORM_GIRLS) {
    it(`${girl}: the card is for the acting plate and its lines name no away girl; every aim is a plate or a foe`, () => {
      const met = walkPlates(girl, (m) => {
        const { view, lines } = cardOf(m);
        expect(view, m.d.actorId).not.toBeNull();
        expect(view!.actorName).toBe(m.state.combatants[m.d.actorId]!.name);
        expect(namedAway(girl, ...lines), m.d.actorId).toEqual([]);
        const legal = [...m.state.activeIds, ...m.state.enemyIds];
        for (const x of view!.suggestions) for (const t of x.command.targets) expect(legal, `${x.label} -> ${t}`).toContain(t);
      });
      expect(met).toHaveLength(3);
    });
  }

  for (const girl of ['yuna', 'rikku'] as const) {
    it(`${girl}: a fallen part is a legal revive target of the menu, an away girl never is, and the card offers no revive to an away girl`, () => {
      const found = fallenPartMenu(girl);
      expect(found, 'a menu with a part down and a Revival row').not.toBeNull();
      const { moment, fallen, revive } = found!;
      const parts = FORM_GIRLS.find((g) => g.girl === girl)!.parts as readonly string[];
      expect(fallen.every((f) => parts.includes(f))).toBe(true);
      expect(fallen.some((f) => revive.validTargets.includes(f))).toBe(true);
      for (const away of awayOf(girl)) expect(revive.validTargets, away).not.toContain(away);
      const { view, lines } = cardOf(moment);
      expect(namedAway(girl, ...lines)).toEqual([]);
      for (const x of view?.suggestions ?? []) for (const t of x.command.targets) expect(awayOf(girl)).not.toContain(t);
      expect(awayGirlIds(moment.state).sort()).toEqual(awayOf(girl).sort());
    });
  }

  it('OFF: the card is for one of the ordinary three girls, and every aim is one of the three or the foe', () => {
    const engine = openSpecial({ build: chapterIV(), group: bahamutGroup, seed: 1, specials: false });
    const d = nextInput(engine)!;
    const state = engine.state() as BattleState;
    const { view, lines } = cardOf({ engine, state, snapshot: engine.gaugeSnapshot(), d });
    expect(view).not.toBeNull();
    expect(['Yuna', 'Rikku', 'Paine']).toContain(view!.actorName);
    const legal = [...GIRL_IDS, ...state.enemyIds] as string[];
    for (const x of view!.suggestions) for (const t of x.command.targets) expect(legal, `${x.label} -> ${t}`).toContain(t);
    for (const line of lines) expect(String(line), 'no part is named').not.toMatch(/Pistil|Smasher|Crusher|Sinistral|Dextral/);
  });
});

// ---------------------------------------------------------------------------------------------------------------------------------
// The phone framing
// ---------------------------------------------------------------------------------------------------------------------------------

describe('the phone framing', () => {
  for (const { girl } of FORM_GIRLS) {
    it(`${girl}: the three plates, then the foe; the actor weighs the actor's, the other plates the party's; no away girl`, () => {
      walkPlates(girl, (m) => {
        const framed = framedIds(m.state, m.d.actorId);
        expect(framed.map(([id]) => id)).toEqual([...m.state.activeIds, ...m.state.enemyIds]);
        for (const [id, w] of framed.filter(([id]) => m.state.activeIds.includes(id))) expect(w, id).toBe(id === m.d.actorId ? FRAME_WEIGHTS.actor : FRAME_WEIGHTS.party);
        for (const away of awayOf(girl)) expect(framed.map(([id]) => id)).not.toContain(away);
      });
    });
  }

  it('a downed part weighs the ko weight only on a KO-framing road (the fallen aeons); in Chapter IV it weighs the party weight', () => {
    const { state } = formUp('yuna');
    const s = state as BattleState;
    const part = s.activeIds[1]!;
    fell(s.combatants[part] as never);
    expect(koFramingChapter(s)).toBe(false);
    expect(framedIds(s, 'yuna').find(([id]) => id === part)![1]).toBe(FRAME_WEIGHTS.party);
    const road = { ...s, enemyIds: ['x2-shiva'] } as BattleState; // a clone of the board on the Chapter XI road
    expect(koFramingChapter(road)).toBe(true);
    expect(framedIds(road, 'yuna').find(([id]) => id === part)![1]).toBe(FRAME_WEIGHTS.ko);
    expect(framedIds(road, 'yuna').find(([id]) => id === 'yuna')![1]).toBe(FRAME_WEIGHTS.actor);
  });

  it('OFF: the three girls then the foe', () => {
    const s = off();
    expect(framedIds(s, 'rikku').map(([id]) => id)).toEqual(['yuna', 'rikku', 'paine', 'bahamut']);
  });
});
