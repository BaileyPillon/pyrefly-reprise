/**
 * The three things the SAVE FILE page asks of the browser (`savePortPage.ts`), each replaceable in a test: keep a file,
 * open the file chooser, read a chosen file. Kept out of the page so the page stays under the house line cap and its
 * tests can stand in for a browser that has no download folder and no chooser.
 *
 * Game case: both (shared pause chrome).
 */

/** The browser's way to keep a file: a Blob behind a link with a `download` name. */
export function browserDownload(filename: string, text: string): boolean {
  try {
    const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.rel = 'noopener';
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
    return true;
  } catch {
    return false;
  }
}

export function browserOpenPicker(input: HTMLInputElement): boolean {
  const activation = (globalThis.navigator as (Navigator & { userActivation?: { isActive: boolean } }) | undefined)?.userActivation;
  if (activation && !activation.isActive) return false;
  try {
    input.click();
    return true;
  } catch {
    return false;
  }
}

export function browserReadText(file: File): Promise<string> {
  if (typeof file.text === 'function') return file.text();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (): void => resolve(String(reader.result ?? ''));
    reader.onerror = (): void => reject(reader.error ?? new Error('read failed'));
    reader.readAsText(file);
  });
}
