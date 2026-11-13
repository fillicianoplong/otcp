import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../..');

type ContrastPair = {
  theme: 'light' | 'dark';
  foreground: string;
  background: string;
  minimum: number;
};

function parseContrastFile(contents: string): ContrastPair[] {
  const pairs: ContrastPair[] = [];
  for (const line of contents.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }
    const parts = trimmed.split(/\s+/);
    if (parts.length !== 4) {
      throw new Error(`Invalid contrast line: ${trimmed}`);
    }
    const [theme, foreground, background, minimumText] = parts;
    if (theme !== 'light' && theme !== 'dark') {
      throw new Error(`Unknown theme in contrast line: ${trimmed}`);
    }
    pairs.push({
      theme,
      foreground,
      background,
      minimum: Number(minimumText),
    });
  }
  return pairs;
}

function parseCssBlock(css: string, selectorPattern: RegExp): Record<string, string> {
  const match = css.match(selectorPattern);
  if (!match) {
    throw new Error(`Selector not found: ${selectorPattern}`);
  }
  const block = match[1];
  const vars: Record<string, string> = {};
  const decl = /--([a-z0-9-]+)\s*:\s*([^;]+);/gi;
  let declMatch: RegExpExecArray | null;
  while ((declMatch = decl.exec(block)) !== null) {
    vars[`--${declMatch[1]}`] = declMatch[2].trim();
  }
  return vars;
}

function tokenValuesForTheme(css: string, theme: 'light' | 'dark'): Record<string, string> {
  if (theme === 'light') {
    return parseCssBlock(css, /:root\s*\{([^}]*)\}/);
  }
  return parseCssBlock(css, /\[data-theme=['"]dark['"]\]\s*\{([^}]*)\}/);
}

function hexToRgb(hex: string): [number, number, number] {
  const normalized = hex.trim().toLowerCase();
  const match = /^#([0-9a-f]{6})$/.exec(normalized);
  if (!match) {
    throw new Error(`Expected #RRGGBB, got ${hex}`);
  }
  const value = match[1];
  return [
    Number.parseInt(value.slice(0, 2), 16),
    Number.parseInt(value.slice(2, 4), 16),
    Number.parseInt(value.slice(4, 6), 16),
  ];
}

function relativeLuminance([r, g, b]: [number, number, number]): number {
  const channel = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function contrastRatio(foreground: string, background: string): number {
  const l1 = relativeLuminance(hexToRgb(foreground));
  const l2 = relativeLuminance(hexToRgb(background));
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

describe('Ink token contrast', () => {
  const contrastText = readFileSync(join(repoRoot, 'docs/ui/contrast.txt'), 'utf8');
  const tokensCss = readFileSync(join(repoRoot, 'src/styles/tokens.css'), 'utf8');
  const pairs = parseContrastFile(contrastText);

  it('parses contrast.txt into theme pairs', () => {
    expect(pairs.length).toBeGreaterThan(0);
    expect(pairs.every((pair) => pair.minimum > 0)).toBe(true);
  });

  it('meets WCAG ratios declared in contrast.txt for app token values', () => {
    for (const pair of pairs) {
      const vars = tokenValuesForTheme(tokensCss, pair.theme);
      const fg = vars[pair.foreground];
      const bg = vars[pair.background];
      expect(fg, `${pair.theme} missing ${pair.foreground}`).toBeDefined();
      expect(bg, `${pair.theme} missing ${pair.background}`).toBeDefined();
      const ratio = contrastRatio(fg!, bg!);
      expect(ratio).toBeGreaterThanOrEqual(pair.minimum);
    }
  });
});
