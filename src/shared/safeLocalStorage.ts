/** Read a string from localStorage; returns null when missing or unavailable. */
export function readLocalStorageString(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

/** Write a string to localStorage; fails silently when storage is unavailable. */
export function writeLocalStorageString(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // private mode, quota, or disabled storage
  }
}
