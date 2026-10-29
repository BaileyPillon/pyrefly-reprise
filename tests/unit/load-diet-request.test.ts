/**
 * The battle stage asks for the load diet (lane "load-diet", 2026-10-29; both games, shared figure-build plumbing): the figure request carries the stream ceiling and `?loaddiet=off` takes it away,
 * so the figure is built exactly as release 67 built it (every pose awaited). Also pins that nothing but the stage sets the option.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { figureSpec } from '../../src/engine/StageFigureRequest.ts';
import { CAVERN_STOLEN_FAYTH_SLOTS } from '../../src/scenes/cavern-stolen-fayth.ts';
import { STREAM_CEILING_MS, setLoadDiet } from '../../src/engine/LoadDiet.ts';

type Combatant = Parameters<typeof figureSpec>[1];
const fiend = (id: string, side: 'enemy' | 'party' = 'enemy'): Combatant => ({ id, side, slot: 0, alive: true, spriteKey: id, flags: { isBoss: false } }) as unknown as Combatant;
const env = { slots: CAVERN_STOLEN_FAYTH_SLOTS, rim: undefined, rigs: undefined, groundLuma: 0.3, game: undefined };
const art = { artId: 'yojimbo', poses: { idle: '/art/characters/yojimbo/idle.png', attack: '/art/characters/yojimbo/attack.png' } };

afterEach(() => setLoadDiet(null));

describe('the stage figure request', () => {
  it('carries the ceiling for a fiend and for a party member', () => {
    setLoadDiet(true);
    expect(figureSpec(env, fiend('yojimbo'), art).request.opts.streamCeilingMs).toBe(STREAM_CEILING_MS);
    expect(figureSpec(env, fiend('tidus', 'party'), art).request.opts.streamCeilingMs).toBe(STREAM_CEILING_MS);
  });

  it('a figure staged already down is waited for whole (review m3: its `ko` painting must be there when the stage snaps it down)', () => {
    setLoadDiet(true);
    const down = figureSpec(env, { ...fiend('tidus', 'party'), alive: false } as Combatant, art);
    expect('streamCeilingMs' in down.request.opts).toBe(false);
    const up = figureSpec(env, fiend('tidus', 'party'), art);
    expect(up.request.opts.streamCeilingMs).toBe(STREAM_CEILING_MS);
    expect(down.fingerprint).not.toBe(up.fingerprint);
  });

  it('a scene that cuts between painted keys (the hidden FF7 chapter) waits for every pose (review m6)', () => {
    setLoadDiet(true);
    const film = { ...env, slots: { ...CAVERN_STOLEN_FAYTH_SLOTS, poseCut: true as const } };
    expect('streamCeilingMs' in figureSpec(film, fiend('guard-scorpion'), art).request.opts).toBe(false);
    expect('streamCeilingMs' in figureSpec(film, fiend('cloud', 'party'), art).request.opts).toBe(false);
  });

  it('?loaddiet=off leaves the option out, and the fingerprint with it', () => {
    setLoadDiet(true);
    const on = figureSpec(env, fiend('yojimbo'), art);
    setLoadDiet(false);
    const off = figureSpec(env, fiend('yojimbo'), art);
    expect('streamCeilingMs' in off.request.opts).toBe(false);
    expect(on.fingerprint).not.toBe(off.fingerprint); // a figure parked with the diet on is not taken for a request with it off
    expect(off.fingerprint).not.toContain('streamCeilingMs');
  });
});

describe('who may set streamCeilingMs', () => {
  it('only the stage\'s figure request (and the actor that reads it)', () => {
    const root = resolve(__dirname, '..', '..', 'src');
    const hits: string[] = [];
    const walk = (dir: string): void => {
      for (const f of readdirSync(dir)) {
        const p = join(dir, f);
        if (statSync(p).isDirectory()) walk(p);
        else if (/\.tsx?$/.test(f) && /streamCeilingMs/.test(readFileSync(p, 'utf8'))) hits.push(p.slice(root.length + 1).replace(/\\/g, '/'));
      }
    };
    walk(root);
    expect(hits.sort()).toEqual(['engine/LoadDiet.ts', 'engine/PaintedActor.ts', 'engine/PaintedActorPoses.ts', 'engine/PaintedActorTypes.ts', 'engine/StageFigureRequest.ts']);
  });
});
