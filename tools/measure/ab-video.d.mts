/** Types for `tools/measure/ab-video.mjs`. */
export declare function probeVideo(file: string, bin?: string): { width: number; height: number; fps: number; seconds: number };
export declare function panelDifference(file: string, o: { crop: { y: number; h: number }; panelW: number }, bin?: string): { at: number; max: number; curve: number[] };
export declare function composeFromVideo(o: { src: string; outDir: string; id: string; title: string; chapter: string; move: string; root: string; crop?: { y: number; h: number }; variants?: Array<{ id: string; name: string }>; questions?: string[]; bin?: string }): Promise<{ out: string; bytes: number; crf: number; still: string; key: Record<string, { id: string; name?: string }>; largestDifference: { at: number; max: number; curve: number[] } }>;
