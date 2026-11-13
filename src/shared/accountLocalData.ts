const ACCOUNT_LOCAL_KEY_PREFIX = 'otcp:account:';

/** Prefix for localStorage keys scoped to one signed-in user. */
export function accountLocalStoragePrefix(userId: string): string {
  return `${ACCOUNT_LOCAL_KEY_PREFIX}${userId}:`;
}

/** Removes browser keys for the given account id (preferences, drafts, caches). */
export function clearLocalAccountData(userId: string): void {
  const prefix = accountLocalStoragePrefix(userId);
  try {
    const keysToRemove: string[] = [];
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);
      if (key !== null && key.startsWith(prefix)) {
        keysToRemove.push(key);
      }
    }
    for (const key of keysToRemove) {
      localStorage.removeItem(key);
    }
  } catch {
    // private mode, disabled storage, or quota
  }
}
