export type ThemePreference = 'light' | 'dark' | 'system';

const THEME_VALUES: ThemePreference[] = ['light', 'dark', 'system'];

function isThemePreference(value: string | null): value is Exclude<ThemePreference, 'system'> {
  return value === 'light' || value === 'dark';
}

/** Read the stored theme preference from the document root. */
export function getTheme(): ThemePreference {
  const value = document.documentElement.getAttribute('data-theme');
  if (isThemePreference(value)) {
    return value;
  }
  return 'system';
}

/** Apply Light, Dark, or Match system (removes data-theme). */
export function setTheme(theme: ThemePreference): void {
  if (!THEME_VALUES.includes(theme)) {
    throw new RangeError(`Unknown theme: ${String(theme)}`);
  }
  if (theme === 'system') {
    document.documentElement.removeAttribute('data-theme');
    return;
  }
  document.documentElement.setAttribute('data-theme', theme);
}
