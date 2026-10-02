import { describe, expect, it, vi } from 'vitest';
import { downWithoutKoPainting, KO_FALLBACK_TILT, lacksKoPainting } from '../../../src/engine/KoFallback.ts';

/**
 * VP-1001-04 (FFX-2 in practice, plumbing both): a dressphere with no KO
 * painting resolves `ko` to the idle (D-179), and the girl stood upright at
 * 0 HP. The helper lays such a figure down with the shipped `lieDown`.
 */
const actor = (ko: string | undefined) => ({
  poseUrls: ko === undefined ? { idle: '/art/characters/x/idle.png' } : { idle: '/art/characters/x/idle.png', ko },
  lieDown: vi.fn(async (_ms?: number, _tilt?: number): Promise<void> => {}),
});

describe('lacksKoPainting', () => {
  it('is true when ko fell back to the idle or the hurt painting', () => {
    expect(lacksKoPainting(actor('/art/characters/rikku-alchemist/idle.png'))).toBe(true);
    expect(lacksKoPainting(actor('/base/art/characters/yuna-dark-knight/hurt.png'))).toBe(true);
  });

  it('is false for a real KO painting, with or without a query string', () => {
    expect(lacksKoPainting(actor('/art/characters/yuna/ko.png'))).toBe(false);
    expect(lacksKoPainting(actor('/art/characters/yuna/ko.png?v=3'))).toBe(false);
  });

  it('is false when the pose map cannot be read (no change for sprites and doubles)', () => {
    expect(lacksKoPainting({})).toBe(false);
  });

  it('treats a subject with no ko entry at all as lacking one', () => {
    // setPose('ko') then resolves through POSE_FALLBACKS to a standing painting.
    expect(lacksKoPainting(actor(undefined))).toBe(true);
  });
});

describe('downWithoutKoPainting', () => {
  it('lays a fallback figure down with the readable partial tip', () => {
    const a = actor('/art/characters/rikku-alchemist/idle.png');
    downWithoutKoPainting(a);
    expect(a.lieDown).toHaveBeenCalledTimes(1);
    expect(a.lieDown.mock.calls[0]![1]).toBe(KO_FALLBACK_TILT);
  });

  it('lies down at once when staging someone already down', () => {
    const a = actor('/art/characters/paine-warrior/idle.png');
    downWithoutKoPainting(a, 0);
    expect(a.lieDown.mock.calls[0]![0]).toBe(0);
  });

  it('leaves a figure with a KO painting to its painting', () => {
    const a = actor('/art/characters/yuna/ko.png');
    downWithoutKoPainting(a);
    expect(a.lieDown).not.toHaveBeenCalled();
    downWithoutKoPainting(undefined);
    downWithoutKoPainting(null);
  });
});
