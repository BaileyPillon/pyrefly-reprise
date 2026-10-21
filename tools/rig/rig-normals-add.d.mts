export function mapFileFor(raw: Record<string, any>, mapsDir: string): { subject: string; pose: string; map: string; scale: number } | null;
export function isWindowOf(masterRaw: Buffer, masterW: number, partFile: string, box: number[]): Promise<{ ok: boolean; why?: string }>;
export function addNormals(o: { from: string; to: string; maps: string; art: string; scale?: number }): Promise<{ subject: string; map: string; done: Array<[string, string]>; skipped: Array<[string, string]>; to: string }>;
