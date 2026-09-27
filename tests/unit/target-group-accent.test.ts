// @vitest-environment jsdom
/**
 * PR-0031 side finding (method check): a party-wide set took its accent from its first entry, the
 * caster ('self', cool blue), so Hastega lit the allies blue; the approved tile s1 shows them in
 * the ally colour. A group's accent is now the group's kind. Both games (the shared cursor).
 */
import { describe, expect, it } from 'vitest';
import { TargetCursor, type TargetEntry } from '../../src/ui/ffx/TargetCursor.ts';

const PARTY: TargetEntry[] = [
  { id: 'tidus', name: 'Tidus', kind: 'self' },
  { id: 'yuna', name: 'Yuna', kind: 'ally' },
  { id: 'auron', name: 'Auron', kind: 'ally' },
];

describe('a group selection names the group kind', () => {
  it('Hastega on the party reads ally, not self', () => {
    const c = new TargetCursor();
    c.setProjector(() => ({ x: 10, y: 10, w: 50, h: 100 }));
    c.showGroup(PARTY);
    expect(c.selection!.kind).toBe('ally');
  });
});
