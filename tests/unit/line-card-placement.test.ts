// @vitest-environment jsdom
/**
 * PR-0211, option A (D-232): the mid-battle line card takes the first of four
 * slots clear of the party's and the speaker's on-screen boxes, once per beat,
 * and falls back to the bottom band when none is clear. Plus the adapter that
 * applies it (and PR-0037's fielded speakers) to the live dialogue box.
 *
 * Game case: both (one shared box; Chapters III and V are the acceptance
 * frames). The boxes below are read off the concept's frames
 * (`docs/concepts/line-card-2026-09-27/frames/`), rounded; the live acceptance
 * is the real-key capture in `docs/handoff/iter2-b4.md`.
 */

import { describe, expect, it } from 'vitest';

import type { ScreenRect } from '../../src/engine/ScreenRects.ts';
import {
  SMALL_CARD_SCALE,
  coveredArea,
  grow,
  guardFor,
  lineCardBand,
  lineCardSlots,
  pickLineCardPlace,
  torsoOf,
} from '../../src/ui/common/lineCardPlacement.ts';
import { SETTLE_MS, SMALL_CARD_BEATS, STILL_MS, beatSpeakers, createMidBeatLineCard, speakerCombatants } from '../../src/app/screens/midbeatLineCard.ts';
import { say } from '../../src/story/dsl.ts';
import type { DialoguePort } from '../../src/story/runner/CutsceneRunner.ts';
import type { SayStep } from '../../src/story/dsl.ts';

const R = (x: number, y: number, w: number, h: number): ScreenRect => ({ x, y, w, h });

describe('pickLineCardPlace (pure)', () => {
  it('Chapter III at 1600x900: Jecht speaks from the Aeon; the top-left slot clears the party and the boss', () => {
    const party = [R(410, 520, 200, 330), R(700, 520, 260, 330), R(740, 450, 110, 180)];
    const bfa = R(815, 210, 380, 340);
    const pick = pickLineCardPlace({ width: 1600, height: 900, hard: [...party, bfa], soft: [] });
    expect(pick.place).toBe('top-left');
    expect(coveredArea(pick.rect, [...party, bfa])).toBe(0);
    // The compact size: about 45% of the width, the concept's card.
    expect(pick.rect.w / 1600).toBeGreaterThan(0.4);
    expect(pick.rect.w / 1600).toBeLessThan(0.47);
  });

  it('Chapter V at 2000x1012 (the camera the fixed band failed on): a slot clears Rikku\'s head', () => {
    const party = [R(600, 430, 380, 500), R(980, 430, 300, 380), R(1250, 420, 200, 320)];
    const head = R(1400, 0, 600, 650);
    const pick = pickLineCardPlace({ width: 2000, height: 1012, hard: party, soft: [head] });
    expect(pick.place).toBe('top-left');
    expect(coveredArea(pick.rect, party)).toBe(0);
  });

  it('prefers, among clear slots, the one that covers least of the other fiends', () => {
    const party = [R(600, 500, 400, 350)];
    const leftFiend = R(0, 0, 800, 300);
    const pick = pickLineCardPlace({ width: 1600, height: 900, hard: party, soft: [leftFiend] });
    expect(pick.place).toBe('top-right');
  });

  it('falls back to the bottom band when every slot touches the party or the speaker', () => {
    const everywhere = [R(0, 0, 1600, 900)];
    const pick = pickLineCardPlace({ width: 1600, height: 900, hard: everywhere });
    expect(pick.place).toBe('band');
    expect(pick).toEqual(lineCardBand(1600, 900));
    expect(pick.rect.y + pick.rect.h).toBeLessThanOrEqual(900);
  });

  it('390x844: a full-width card under the boss bar, above the party; the band when the speaker fills the rest', () => {
    const party = [R(10, 330, 70, 110), R(95, 330, 70, 110), R(180, 330, 60, 110)];
    const boss = R(200, 150, 190, 250);
    const clearField = pickLineCardPlace({ width: 390, height: 844, hard: party, soft: [] });
    expect(clearField.place).toBe('upper');
    // With the boss in the upper slot, the card moves to the one that covers least of him.
    const voice = pickLineCardPlace({ width: 390, height: 844, hard: party, soft: [boss] });
    expect(voice.place).toBe('top');
    expect(coveredArea(voice.rect, [boss])).toBeLessThan(coveredArea(clearField.rect, [boss]));
    expect(voice.rect.x).toBe(12);
    expect(voice.rect.w).toBe(390 - 24);
    expect(coveredArea(voice.rect, party)).toBe(0);
    const speaking = pickLineCardPlace({ width: 390, height: 844, hard: [...party, boss] });
    expect(speaking.place).toBe('band');
  });

  it('every slot sits inside the frame, clear of the PAUSE chip corner', () => {
    for (const [w, h] of [[1600, 900], [2000, 1012], [1280, 720], [390, 844]] as const) {
      for (const s of lineCardSlots(w, h)) {
        expect(s.rect.x).toBeGreaterThanOrEqual(0);
        expect(s.rect.y).toBeGreaterThanOrEqual(w > 560 ? 36 : 0);
        expect(s.rect.x + s.rect.w).toBeLessThanOrEqual(w);
        expect(s.rect.y + s.rect.h).toBeLessThanOrEqual(h);
      }
    }
  });

  // The boxes the 2026-09-27 check measured at Chapter III's opening camera
  // ('bfa-low', Jecht speaking from the Aeon), where the old pick fell back to
  // the band across Yuna's hips (13,000 to 25,000 px² of her top 65%).
  const bfaLow = {
    1600: { party: [R(694, 518, 252, 328), R(426, 516, 144, 335), R(578, 468, 171, 259)], aeon: R(657, 214, 391, 360) },
    2000: { party: [R(887, 582, 283, 368), R(590, 580, 159, 375), R(754, 524, 192, 292)], aeon: R(857, 239, 439, 407) },
  } as const;
  for (const [w, h] of [[1600, 900], [2000, 1012]] as const) {
    it(`Chapter III opening camera at ${w}x${h}: no 0.7 slot is clear, so a 0.6 card goes top-left, clear with room, not the band`, () => {
      const { party, aeon } = bfaLow[w];
      const hard = [...party.map(torsoOf), aeon];
      for (const s of lineCardSlots(w, h)) expect(coveredArea(s.rect, hard) + coveredArea(s.rect, party)).toBeGreaterThan(0);
      const pick = pickLineCardPlace({ width: w, height: h, hard, prefer: party });
      expect(pick.place).toBe('top-left');
      expect(pick.scale).toBe(SMALL_CARD_SCALE);
      expect(coveredArea(pick.rect, [...party, aeon].map((r) => grow(r, guardFor(w))))).toBe(0);
    });
  }

  it('a slot that only crosses legs beats the band, which crosses everyone', () => {
    // A close camera: the party's whole boxes reach every slot, their torsos only the top ones.
    const party = [R(100, 150, 400, 700), R(600, 150, 400, 700), R(1100, 150, 400, 700)];
    const pick = pickLineCardPlace({ width: 1600, height: 900, hard: party.map(torsoOf), prefer: party });
    expect(pick.place.startsWith('bottom-')).toBe(true);
    expect(coveredArea(pick.rect, party.map(torsoOf))).toBe(0);
  });

  it('keeps room around a guarded box: a slot that clears it by less than the guard is passed over', () => {
    const slot = lineCardSlots(1600, 900)[0]!;
    const near = R(slot.rect.x + slot.rect.w + 4, 38, 200, 200); // 4 px right of the top-left card
    const pick = pickLineCardPlace({ width: 1600, height: 900, hard: [near] });
    expect(pick.place).not.toBe('top-left');
    expect(pickLineCardPlace({ width: 1600, height: 900, hard: [near], guard: 0 }).place).toBe('top-left');
  });
});

describe('speakers and their bodies', () => {
  it('Jecht speaks from Braska\'s Final Aeon; a Seymour portrait id finds his staged form; a voice finds nothing', () => {
    const staged = ['tidus', 'yuna', 'auron', 'braskas-final-aeon'];
    expect(speakerCombatants('ffx', 'jecht', staged)).toEqual(['braskas-final-aeon']);
    expect(speakerCombatants('ffx', 'seymour-macalania', ['tidus', 'seymour-macalania-idle', 'anima'])).toEqual([
      'seymour-macalania-idle',
    ]);
    expect(speakerCombatants('ffx2', 'jecht', ['yuna', 'rikku', 'paine', 'vegnagun-head'])).toEqual([]);
    expect(speakerCombatants('ffx2', 'rikku-x2', ['yuna', 'rikku', 'paine'])).toEqual(['rikku']);
  });

  it('a beat names every speaker it can put on the card, stand-ins included', () => {
    const beat = [say('rikku', 'Eeew!', { fallback: [{ who: 'kimahri' }] }), say('lulu', 'Stay grey.')];
    expect(beatSpeakers(beat).sort()).toEqual(['kimahri', 'lulu', 'rikku']);
  });
});

describe('the adapter on the live box', () => {
  function setup(rects: Map<string, ScreenRect>, sides: Record<string, 'party' | 'enemy' | 'aeon'>) {
    Object.defineProperty(window, 'innerWidth', { value: 1600, configurable: true });
    Object.defineProperty(window, 'innerHeight', { value: 900, configurable: true });
    const root = document.createElement('div');
    const box = document.createElement('div');
    box.className = 'dbox';
    root.appendChild(box);
    document.body.appendChild(root);
    const said: SayStep[] = [];
    const port: DialoguePort = {
      say: (s) => {
        said.push(s);
        return Promise.resolve();
      },
      narrate: () => Promise.resolve(),
      choice: () => Promise.resolve(''),
    };
    const card = createMidBeatLineCard({
      root,
      box,
      game: 'ffx',
      stage: { staged: () => [...rects.keys()], sideOf: (id) => sides[id], screenRects: () => rects },
    });
    return { card, box, said, guarded: card.guard(port) };
  }

  it('Chapter I: benched Rikku and Lulu hand the Zombie lines to Kimahri and Yuna, on a card clear of everyone', async () => {
    const rects = new Map([
      ['tidus', R(410, 520, 200, 330)],
      ['yuna', R(700, 520, 260, 330)],
      ['kimahri', R(980, 480, 220, 370)],
      ['seymour-flux', R(900, 150, 350, 330)],
    ]);
    const { card, box, said, guarded } = setup(rects, { tidus: 'party', yuna: 'party', kimahri: 'party', 'seymour-flux': 'enemy' });
    const beat = [
      say('rikku', "Eeew! Yunie, don't heal him!", { fallback: [{ who: 'kimahri', text: 'Yuna. Do not heal him.' }] }),
      say('lulu', "He's turned. Cures will kill him now.", { fallback: [{ who: 'yuna', text: "He's turned. A cure would hurt him now." }] }),
    ];
    card.beginBeat(beat);
    for (const s of beat) await guarded.say(s);
    expect(said.map((s) => s.who)).toEqual(['kimahri', 'yuna']);
    expect(box.classList.contains('dbox--card')).toBe(true);
    expect(box.dataset['place']).toBe('top-left');
    expect(box.style.getPropertyValue('--lc-scale')).toBe('0.7');
    card.endBeat();
    expect(box.classList.contains('dbox--card')).toBe(false);
    expect(box.style.getPropertyValue('--lc-x')).toBe('');
  });

  it("D-247 (FFX): Chapter III's Talk beat always wears the 0.6 card, even where a 0.7 slot is clear; every other beat keeps 0.7", async () => {
    expect([...SMALL_CARD_BEATS]).toEqual(['bfa-talk']);
    // A wide empty frame: the 0.7 card fits top-left, so only the beat's own rule can make it 0.6.
    const rects = new Map([['tidus', R(410, 620, 200, 230)]]);
    const talk = setup(rects, { tidus: 'party' });
    const beat = [say('tidus', 'Hey! You still in there?')];
    talk.card.beginBeat(beat, 'bfa-talk');
    await talk.guarded.say(beat[0]!);
    expect(talk.box.dataset['place']).toBe('top-left');
    expect(talk.box.style.getPropertyValue('--lc-scale')).toBe(String(SMALL_CARD_SCALE));
    // The next beat in the same chapter is the ordinary card again.
    talk.card.beginBeat(beat, 'bfa-sword');
    await talk.guarded.say(beat[0]!);
    expect(talk.box.style.getPropertyValue('--lc-scale')).toBe('0.7');
    talk.card.beginBeat(beat); // no name (a pre-battle or test caller): the default
    await talk.guarded.say(beat[0]!);
    expect(talk.box.style.getPropertyValue('--lc-scale')).toBe('0.7');
  });

  it('while the camera settles the card is hidden and re-picked every frame; then it shows and stays', async () => {
    const rects = new Map([['tidus', R(0, 0, 900, 400)]]); // an action push: the top-left slot is covered
    const { card, box, guarded } = setup(rects, { tidus: 'party' });
    card.beginBeat([say('tidus', 'One.')]);
    await guarded.say(say('tidus', 'One.'));
    expect(box.classList.contains('dbox--settling')).toBe(true);
    expect(box.dataset['place']).not.toBe('top-left');
    rects.set('tidus', R(410, 520, 200, 330)); // the camera eases back to the wide frame
    card.update(0.1);
    expect(box.dataset['place']).toBe('top-left');
    expect(box.classList.contains('dbox--settling')).toBe(true);
    card.update(SETTLE_MS / 1000);
    expect(box.classList.contains('dbox--settling')).toBe(false);
    // After the settle nothing moves mid-line, whatever the camera does.
    rects.set('tidus', R(0, 0, 1600, 900));
    card.update(0.1);
    expect(box.dataset['place']).toBe('top-left');
  });

  it('between lines the card moves only when the party or the speaker has come under it', async () => {
    const rects = new Map([['tidus', R(410, 520, 200, 330)], ['seymour-flux', R(1000, 100, 300, 300)]]);
    const { card, box, guarded } = setup(rects, { tidus: 'party', 'seymour-flux': 'enemy' });
    card.beginBeat([say('tidus', 'One.'), say('tidus', 'Two.'), say('tidus', 'Three.')]);
    await guarded.say(say('tidus', 'One.'));
    card.update(1);
    expect(box.dataset['place']).toBe('top-left');
    rects.set('seymour-flux', R(0, 0, 900, 300)); // a fiend who is not speaking: the card stays
    await guarded.say(say('tidus', 'Two.'));
    expect(box.dataset['place']).toBe('top-left');
    rects.set('tidus', R(0, 0, 1600, 520)); // the party's torso now reaches every top slot
    await guarded.say(say('tidus', 'Three.'));
    expect(box.dataset['place']).toMatch(/^bottom-/);
    rects.set('tidus', R(0, 0, 1600, 1500)); // and every slot: the band
    await guarded.say(say('tidus', 'Four.'));
    expect(box.dataset['place']).toBe('band');
    expect(box.classList.contains('dbox--band')).toBe(true);
  });

  it('holds the line while the boxes move, shows it once they hold still, and never later than the cap', async () => {
    const rects = new Map([['tidus', R(410, 520, 200, 330)]]);
    const { card, box, guarded } = setup(rects, { tidus: 'party' });
    card.beginBeat([say('tidus', 'One.')]);
    await guarded.say(say('tidus', 'One.'));
    expect(card.holding).toBe(true);
    // The camera is still easing: every frame moves the party a few px.
    for (let i = 1; i <= 5; i++) {
      rects.set('tidus', R(410 + i * 5, 520, 200, 330));
      expect(card.update(1 / 60)).toBe(true);
    }
    // Still: the line shows after STILL_MS, well inside the cap.
    let frames = 0;
    while (card.update(1 / 60)) frames++;
    expect(frames * (1000 / 60)).toBeLessThanOrEqual(STILL_MS + 20);
    expect(card.holding).toBe(false);
    expect(box.classList.contains('dbox--settling')).toBe(false);

    // A camera that never stops: the cap ends the hold.
    card.beginBeat([say('tidus', 'Two.')]);
    await guarded.say(say('tidus', 'Two.'));
    let t = 0;
    let x = 410;
    while (card.update(1 / 60)) {
      rects.set('tidus', R((x += 3), 520, 200, 330));
      t += 1000 / 60;
    }
    expect(t).toBeGreaterThanOrEqual(SETTLE_MS - 20);
    expect(t).toBeLessThanOrEqual(SETTLE_MS + 20);
  });

  it("a beat's camera move puts the card away, and the next line is placed afresh for the new camera", async () => {
    const rects = new Map([['tidus', R(410, 520, 200, 330)], ['shuyin', R(781, 122, 261, 436)]]);
    const { card, box, guarded } = setup(rects, { tidus: 'party', shuyin: 'enemy' });
    const beat = [say('shuyin', "No. I'll end all of it."), say('shuyin', 'Why are you still standing?')];
    card.beginBeat(beat);
    await guarded.say(beat[0] as SayStep);
    while (card.update(1 / 60));
    expect(box.dataset['place']).toBe('top-left');
    card.cameraMoves(); // camera('action', 700) after the line: Shuyin comes left, under the card's old place
    expect(box.classList.contains('dbox--settling')).toBe(true);
    expect(card.update(1 / 60)).toBe(false); // nothing is held: no line is waiting
    rects.set('shuyin', R(600, 122, 261, 436));
    await guarded.say(beat[1] as SayStep);
    expect(card.holding).toBe(true);
    while (card.update(1 / 60));
    expect(box.classList.contains('dbox--settling')).toBe(false);
    expect(box.dataset['place']).not.toBe('top-left');
    expect(coveredArea(card.lastPick!.rect, [R(600, 122, 261, 436)])).toBe(0);
  });
});
