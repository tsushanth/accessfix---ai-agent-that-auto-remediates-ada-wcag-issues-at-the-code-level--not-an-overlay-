export interface RGB {
  r: number;
  g: number;
  b: number;
}

const NAMED_COLORS: Record<string, RGB> = {
  black: { r: 0, g: 0, b: 0 },
  white: { r: 255, g: 255, b: 255 },
  red: { r: 255, g: 0, b: 0 },
  green: { r: 0, g: 128, b: 0 },
  blue: { r: 0, g: 0, b: 255 },
  gray: { r: 128, g: 128, b: 128 },
  grey: { r: 128, g: 128, b: 128 },
  silver: { r: 192, g: 192, b: 192 },
  yellow: { r: 255, g: 255, b: 0 },
};

/** Parses #fff, #ffffff, rgb(...) and a small set of CSS named colors into RGB. Returns null if unparseable. */
export function parseColor(input: string): RGB | null {
  const value = input.trim().toLowerCase();

  if (value in NAMED_COLORS) {
    return NAMED_COLORS[value];
  }

  const hexMatch = /^#([0-9a-f]{3}|[0-9a-f]{6})$/.exec(value);
  if (hexMatch) {
    const hex = hexMatch[1];
    if (hex.length === 3) {
      const [r, g, b] = hex.split("");
      return {
        r: parseInt(r + r, 16),
        g: parseInt(g + g, 16),
        b: parseInt(b + b, 16),
      };
    }
    return {
      r: parseInt(hex.slice(0, 2), 16),
      g: parseInt(hex.slice(2, 4), 16),
      b: parseInt(hex.slice(4, 6), 16),
    };
  }

  const rgbMatch = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/.exec(value);
  if (rgbMatch) {
    return {
      r: Number(rgbMatch[1]),
      g: Number(rgbMatch[2]),
      b: Number(rgbMatch[3]),
    };
  }

  return null;
}

/** WCAG relative luminance formula: https://www.w3.org/TR/WCAG22/#dfn-relative-luminance */
function relativeLuminance({ r, g, b }: RGB): number {
  const channel = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  const rl = channel(r);
  const gl = channel(g);
  const bl = channel(b);
  return 0.2126 * rl + 0.7152 * gl + 0.0722 * bl;
}

/** WCAG contrast ratio formula: (L1 + 0.05) / (L2 + 0.05), lighter over darker. */
export function contrastRatio(a: RGB, b: RGB): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const lighter = Math.max(la, lb);
  const darker = Math.min(la, lb);
  return (lighter + 0.05) / (darker + 0.05);
}

/** WCAG 2.2 SC 1.4.3 (AA): 4.5:1 for normal text, 3:1 for large text. */
export function meetsAAContrast(ratio: number, isLargeText: boolean): boolean {
  return isLargeText ? ratio >= 3 : ratio >= 4.5;
}
