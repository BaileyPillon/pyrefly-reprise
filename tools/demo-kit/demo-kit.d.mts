export function commandLineOf(pid: number): string | null;
export function stopPid(pid: number, marker: string): 'gone' | 'not-ours' | 'stopped';
