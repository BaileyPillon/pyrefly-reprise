/**
 * Add a NEW music entry's block right after the entry `after`, leaving every other byte as it was. Throws when `name` is already
 * there, when `after` is missing or when `after` is the last entry. For the two chapter-select alternates of release 39.5.
 */
export declare function insertMusicEntryText(
  text: string,
  after: string,
  name: string,
  entry: { file: string; [key: string]: string | number | undefined },
): string;
