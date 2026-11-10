// @vitest-environment jsdom
/**
 * Test 21, the fight half, of the FFX-2 Special look (step D2; game case: FFX-2 only in what is seen: the three Special dresspheres exist only in FFX-2; the surfaces read below are
 * shared by both games and none is edited by this file's cases, see the handoff's section 13 for the one that is).
 *
 * The always-visible surfaces with a REAL form up (`formUp`: the real engine, each girl walked along her own Garment Grid to her Special), each against the required result of D-32:
 * the surfaces name the three plates (the girl, then the two parts by their own names) and nothing else; a part is never given a girl's plate or count; a girl who is away is never named,
 * counted or offered a revive. One `describe` per surface; each case runs once with the form up, the OFF half (the ordinary three-girl answer) where the surface has one, and the last
 * `describe` holds the HUD's party list in three different ways: the surfaces read the engine's live state, so their answers must not move with the held list (only the HUD's own party
 * column follows it).
 *
 * Method: each case was written first against the head D2 started from; where it failed, the smallest edit in the surface's own read point was made (the handoff's table says which).
 * Removal check: delete `plateMemberFor` / the field-mark guard and the pause and field-mark cases fail; add a part-hiding filter to any surface and its case here fails.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { App } from '../../src/app/App.ts';
import { SaveStore } from '../../src/app/SaveData.ts';
import { ResultsScreen } from '../../src/app/screens/ResultsScreen.ts';
import { buildTabs } from '../../src/app/screens/pause/tabs.ts';
import type { BattleResult, BattleState } from '../../src/battle/common/types.ts';
import { getChapter } from '../../src/data/encounters.ts';
import type { MomentsPort } from '../../src/engine/BattlePresenterPorts.ts';
import { setPortraitMode } from '../../src/engine/CutInMode.ts';
import { awayGirlIds } from '../../src/engine/SpecialFormMembers.ts';
import { TurnCutInBeat } from '../../src/engine/TurnCutIn.ts';
import { buildAdvisorView, clearAdvisorCache } from '../../src/engine/tactics/advisor.ts';
import { buildGuideView } from '../../src/engine/tactics/guide.ts';
import { setAtbBarsSmooth } from '../../src/ui/ffx2/AtbLive.ts';
import { FFX2BattleHud } from '../../src/ui/ffx2/FFX2BattleHud.ts';
import { FRAME_WEIGHTS, framedIds, koFramingChapter } from '../../src/ui/common/phoneFraming.ts';
import { buildMemberRows } from '../../src/ui/common/resultsMath.ts';
import { setProMode, setProPiece } from '../../src/engine/look/pro/ProSwitch.ts';
import { setDemoChapter } from '../../src/engine/motion/DemoGate.ts';
import { ffx2Options } from './helpers/ffx2ChapterDrive.ts';
import { nextInput, openSpecial, unit } from './helpers/specialDrive.ts';
import { bahamutGroup, chapterIV, FORM_GIRLS, fell, formUp, playUntilOver } from './helpers/specialFormState.ts';
import { awayOf, fallenPartMenu, namedAway, PLATE_NAMES, walkPlates, type Moment } from './helpers/specialSurfaces.ts';

const CARD = { ffx2: { abilities: ffx2Options().abilities, items: ffx2Options().items } };
const GIRL_IDS = ['yuna', 'rikku', 'paine'] as const;
const off = (): BattleState => openSpecial({ build: chapterIV(), group: bahamutGroup, seed: 1, specials: false }).state() as BattleState;

beforeEach(() => {
  document.body.innerHTML = '';
  vi.stubGlobal('requestAnimationFrame', () => 0);
  vi.stubGlobal('cancelAnimationFrame', () => {});
  vi.spyOn(performance, 'now').mockReturnValue(1000);
  setAtbBarsSmooth(false);
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  setAtbBarsSmooth(null);
  setPortraitMode(null);
  setProMode(null);
  setProPiece(null);
  setDemoChapter(undefined);
  document.body.innerHTML = '';
});

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

/** The panel's line for a menu: the acting plate, the target's words, the watch rows and the phase label (hint prose is static chapter text and is not read). */
function guideLine(m: Moment) {
  const view = buildGuideView(m.state, { actorId: m.d.actorId, commands: m.d.commands });
  return { chapter: view?.chapterId ?? null, actor: view?.next?.actorName ?? null, target: view?.next?.targetName ?? null, label: view?.next?.label ?? null, watch: (view?.watch ?? []).map((w) => w.enemyName), phase: view?.phase?.label ?? null };
}

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
});

// ---------------------------------------------------------------------------------------------------------------------------------
// The move advisor's card
// ---------------------------------------------------------------------------------------------------------------------------------

function cardOf(m: Moment) {
  clearAdvisorCache();
  const view = buildAdvisorView(m.state, { actorId: m.d.actorId, commands: m.d.commands }, CARD);
  return { view, lines: (view?.suggestions ?? []).flatMap((x) => [x.label, x.targetName, x.reason, x.effect, x.warning, x.menu]).concat(view ? [view.actorName, view.note] : []) };
}

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

// ---------------------------------------------------------------------------------------------------------------------------------
// The results page
// ---------------------------------------------------------------------------------------------------------------------------------

function screenRows(result: BattleResult): string[] {
  const save = new SaveStore('d2-surfaces-results', null);
  save.recordAttempt('ffx2-bahamut');
  const screen = new ResultsScreen({ chapterId: 'ffx2-bahamut', result });
  const root = document.createElement('div');
  document.body.appendChild(root);
  screen.app = { save, fade: () => Promise.resolve() } as unknown as App;
  screen.root = root;
  void screen.enter();
  screen.update(10);
  return [...root.querySelectorAll<HTMLElement>('.rres__member')].map((m) => m.textContent ?? '');
}

describe('the results page after a victory inside a form', () => {
  for (const { girl } of FORM_GIRLS) {
    it(`${girl}: the engine ends the form silently once the result is built, so the rows are the three girls and never a part`, () => {
      const up = formUp(girl);
      fell(unit(up.engine, 'bahamut'));
      playUntilOver(up.engine);
      const s = up.engine.state() as BattleState;
      expect(s.result?.outcome).toBe('victory');
      expect(s.activeIds).toEqual([...GIRL_IDS]);
      const result = s.result as BattleResult;
      const rows = buildMemberRows(getChapter('ffx2-bahamut'), result);
      expect(rows.map((r) => r.id)).toEqual([...GIRL_IDS]);
      expect(rows.map((r) => r.name)).toEqual(['Yuna', 'Rikku', 'Paine']);
      const text = screenRows(result);
      expect(text).toHaveLength(3);
      for (const [i, name] of ['Yuna', 'Rikku', 'Paine'].entries()) expect(text[i]).toContain(name);
      for (const name of PLATE_NAMES[girl].slice(1)) expect(text.join('|'), name).not.toContain(name);
    });
  }
});

// ---------------------------------------------------------------------------------------------------------------------------------
// The mounted HUD's party column
// ---------------------------------------------------------------------------------------------------------------------------------

function mountHud(m: Moment): { hud: FFX2BattleHud; root: HTMLElement; ids: () => string[] } {
  const root = document.createElement('div');
  document.body.appendChild(root);
  const hud = new FFX2BattleHud();
  hud.mount(root);
  hud.sync(m.state, m.snapshot);
  return { hud, root, ids: () => [...root.querySelectorAll<HTMLElement>('.ffx2hud__party .ig-stat')].map((e) => e.dataset['actorId'] as string) };
}

describe('the party column of a mounted FFX2BattleHud', () => {
  it('a downed part shows its own KO styling (and the KO pill under the pro look); the main and the other part do not', () => {
    const up = formUp('yuna');
    const s = up.state as BattleState;
    const part = s.activeIds[1]!;
    fell(s.combatants[part] as never);
    setProMode('pro');
    setDemoChapter('ffx2-bahamut');
    const { root, ids } = mountHud({ engine: up.engine, state: s, snapshot: up.snapshot, d: null as never });
    expect(ids()).toEqual(s.activeIds);
    const row = (id: string): string => root.querySelector<HTMLElement>(`.ig-stat[data-actor-id="${id}"]`)!.outerHTML;
    expect(row(part)).toContain('ffx2-hp--ko');
    expect(row(part)).toContain('pro-mark--ko');
    expect(row('yuna')).not.toContain('ffx2-hp--ko');
    expect(row(s.activeIds[2]!)).not.toContain('ffx2-hp--ko');
  });
});

// ---------------------------------------------------------------------------------------------------------------------------------
// Whatever list the HUD holds
// ---------------------------------------------------------------------------------------------------------------------------------

describe('whatever list the HUD holds, the surfaces read the engine, not the list', () => {
  it('the tabs, the Guide, the intent slab, the advisor and the phone framing answer the same with the girls, one girl or the three parts held; the HUD column follows the list', () => {
    for (const { girl, parts } of FORM_GIRLS) {
      walkPlates(girl, (m) => {
        const answers = () => ({
          tabs: buildTabs(m.state).map((t) => [t.id, t.label, t.hp, t.ko ?? false]),
          guide: guideLine(m),
          intent: (m.engine.intent()?.estimate?.perTarget ?? []).map((t) => t.targetId),
          advisor: cardOf(m).lines,
          framing: framedIds(m.state, m.d.actorId),
          away: awayGirlIds(m.state),
        });
        const base = answers();
        const { hud, ids } = mountHud(m);
        for (const held of [[...GIRL_IDS], ['yuna'], [...m.state.activeIds]]) {
          hud.holdRows(held);
          hud.sync(m.state, m.snapshot);
          expect(ids(), `${girl}: the HUD column`).toEqual(held);
          expect(answers(), `${girl} at ${m.d.actorId} with ${held.join(',')} held`).toEqual(base);
        }
        hud.holdRows(null);
        expect(ids()).toEqual([girl, ...parts]);
      });
    }
  });
});
