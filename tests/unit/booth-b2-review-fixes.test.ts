/**
 * THE JOB NUMBERS OF BATCH 2 (release 70, review of `booth-b2`, finding m1 and observation o3; both games: the notes and the comments cover Chapters II, V, XV and XI).
 *
 * Each lane numbered its browser jobs from J1 in its own note (`docs/handoff/booth-ffx-yunalesca.md`, `docs/handoff/booth-ffx2-b2.md`); the merged note `docs/handoff/booth-b2.md` renumbered the union J1 to J22 and says it wins.
 * A source comment that says "J5" with no note named lands a reader on the wrong job (J5 is Shuyin's deploy gate in the merged note and was the still pairs in the FFX-2 lane's). So: every job a comment cites in the files the lanes touched
 * names the note it counts in, and the numbers the comments rely on are the merged note's jobs they claim. The Shuyin gate (J5) is prose only: no tool reads it, so its words stay pinned here until a tool does.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const NOTE = readFileSync(resolve('docs/handoff/booth-b2.md'), 'utf8');
/** The files both lanes touched that carry job numbers in their comments. */
const SOURCES = [
  'src/engine/look/LookBoldConfig.ts',
  'src/engine/look/LookConfig.ts',
  'src/engine/look/LookGrades.ts',
  'src/engine/look/LookGradesBold.ts',
  'src/engine/look/pro/ProGrade.ts',
  'src/engine/look/pro/RimFigures.ts',
  'src/engine/motion/DemoGate.ts',
  'src/engine/motion/PieceHolds.ts',
] as const;

/** The merged note's job lines: `- **J<n> (...): title ...`. */
function jobs(): Map<number, string> {
  const out = new Map<number, string>();
  for (const line of NOTE.split('\n')) {
    const m = /^- \*\*J(\d{1,2})\b/.exec(line);
    if (m) out.set(Number(m[1]), line);
  }
  return out;
}

describe('the merged note numbers its jobs J1 to J22, once each', () => {
  it('has exactly the 22 jobs, in order', () => {
    expect([...jobs().keys()]).toEqual(Array.from({ length: 22 }, (_, i) => i + 1));
  });

  it('the jobs the source comments cite are the jobs they claim', () => {
    const j = jobs();
    expect(j.get(1), 'J1 is the camera decision of Chapter II').toMatch(/Chapter II's camera/);
    expect(j.get(5), 'J5 is the Shuyin gate').toMatch(/GATE: no deploy that includes Chapter V/);
    expect(j.get(5)).toMatch(/Shuyin's freeze/);
    expect(j.get(7), "J7 is the Den's shades with the rim on and off").toMatch(/the Den's shades against the arena, rim ON and OFF/);
    expect(j.get(11), 'J11 is the still pairs').toMatch(/the still pairs for Bailey/);
    expect(j.get(17), 'J17 is the air (the dome embers question)').toMatch(/the air\./);
    expect(j.get(17)).toMatch(/embers/);
  });
});

describe('a source comment never cites a bare job number (review of booth-b2, m1)', () => {
  it.each(SOURCES)('%s: every J<n> has the name of the note it counts in within 150 characters', (file) => {
    const text = readFileSync(resolve(file), 'utf8');
    const bare: string[] = [];
    for (const m of text.matchAll(/\bJ\d{1,2}\b/g)) {
      const at = m.index ?? 0;
      const near = text.slice(Math.max(0, at - 150), at + 150);
      if (!/booth-[a-z0-9-]+\.md/.test(near)) bare.push(`${m[0]} at ${at}: ...${text.slice(Math.max(0, at - 60), at + 40).replace(/\s+/g, ' ')}...`);
    }
    expect(bare, `${file} cites a job with no note named`).toEqual([]);
  });

  it('the comments that cite a merged number cite the right one (the pairs, the shades, Shuyin, the dome embers)', () => {
    const grade = readFileSync(resolve('src/engine/look/pro/ProGrade.ts'), 'utf8');
    expect(grade).toMatch(/the still pairs decide \(J11 of `docs\/handoff\/booth-b2\.md`/);
    const rim = readFileSync(resolve('src/engine/look/pro/RimFigures.ts'), 'utf8');
    expect(rim).toMatch(/job J7 of `docs\/handoff\/booth-b2\.md` \(the shade with the rim ON against OFF/);
    expect(rim).toMatch(/or its J5 \(Shuyin's frame/);
    const bold = readFileSync(resolve('src/engine/look/LookBoldConfig.ts'), 'utf8');
    expect(bold).toMatch(/job J17 of `docs\/handoff\/booth-b2\.md`/);
  });
});

describe('the Shuyin gate is in the note, where the release plan reads it (observation o3: no deploy tool knows it yet)', () => {
  it('the section of open questions and the merged state both say that Chapter V waits for J5', () => {
    expect(NOTE).toMatch(/Shuyin's freeze stays on, and its job \(J5\) is a gate before any deploy that includes Chapter V/);
    expect(NOTE).toMatch(/no deploy that includes Chapter V before the driver has seen this frame/);
    expect(NOTE).toMatch(/\*\*J5, the Chapter V gate, and J1, the Chapter II camera\*\*/);
  });
});
