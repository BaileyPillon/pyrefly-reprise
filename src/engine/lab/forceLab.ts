/** CAMERA LAB bundle only (`src/lab-entry.ts`): mark this page load as the lab before the game boots. */
import { FORCE_KEY } from './LabSession.ts';

(globalThis as Record<string, unknown>)[FORCE_KEY] = true;
