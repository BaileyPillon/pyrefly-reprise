/** A stable 0..1 from a name, so a party does not breathe in step (`RigActor`'s clock start; moved out of that file to keep it under 400 lines, motion pass step 2: unchanged). */
export function hashUnit(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return ((h >>> 0) % 10000) / 10000;
}
