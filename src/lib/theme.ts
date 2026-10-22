import type { CSSProperties } from 'react';

export type Theme = {
  accent: string;
  dark: string;
  light: string;
  onAccent: string;
  onLight: string;
  answerBg: string;
  questionBg: string;
};

export function normalizeHex(input: string): string {
  const parsed = parseHex(input);
  return parsed ?? '#007300';
}

export function parseHex(input: string): string | null {
  let hex = input.trim();
  if (!hex.startsWith('#')) hex = `#${hex}`;
  if (/^#[0-9a-fA-F]{3}$/.test(hex)) {
    hex = `#${[...hex.slice(1)].map((char) => char + char).join('')}`;
  }
  if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return null;
  return hex.toLowerCase();
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const value = normalizeHex(hex).slice(1);
  return {
    r: Number.parseInt(value.slice(0, 2), 16),
    g: Number.parseInt(value.slice(2, 4), 16),
    b: Number.parseInt(value.slice(4, 6), 16),
  };
}

export function rgbToHex(r: number, g: number, b: number): string {
  const channel = (n: number) =>
    Math.max(0, Math.min(255, Math.round(n)))
      .toString(16)
      .padStart(2, '0');
  return `#${channel(r)}${channel(g)}${channel(b)}`;
}

export function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  const red = r / 255;
  const green = g / 255;
  const blue = b / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const l = (max + min) / 2;
  const delta = max - min;
  if (delta === 0) return { h: 0, s: 0, l };
  const s = delta / (1 - Math.abs(2 * l - 1));
  let h = 0;
  if (max === red) h = ((green - blue) / delta) % 6;
  else if (max === green) h = (blue - red) / delta + 2;
  else h = (red - green) / delta + 4;
  h *= 60;
  if (h < 0) h += 360;
  return { h, s, l };
}

export function hslToHex(h: number, s: number, l: number): string {
  const hue = ((h % 360) + 360) % 360;
  const sat = clamp01(s);
  const light = clamp01(l);
  const a = sat * Math.min(light, 1 - light);
  const f = (n: number) => {
    const k = (n + hue / 30) % 12;
    return light - a * Math.max(-1, Math.min(k - 3, Math.min(9 - k, 1)));
  };
  return rgbToHex(f(0) * 255, f(8) * 255, f(4) * 255);
}

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n));
}

function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const { r, g, b } = hexToRgb(hex);
  return rgbToHsl(r, g, b);
}

function channel(c: number): number {
  const value = c / 255;
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

export function contrastRatio(a: string, b: string): number {
  const lum = (hex: string) => {
    const { r, g, b: blue } = hexToRgb(hex);
    return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(blue);
  };
  const left = lum(a);
  const right = lum(b);
  const [hi, lo] = left > right ? [left, right] : [right, left];
  return (hi + 0.05) / (lo + 0.05);
}

/** Dark header color, mint question tint, and a readable answer-screen pair. */
export function deriveTheme(input: string): Theme {
  const accent = normalizeHex(input);
  const { h, s, l } = hexToHsl(accent);
  const light = hslToHex(h, Math.max(s, 0.72), 0.9);
  const dark = hslToHex(h, Math.max(s, 0.55), Math.min(0.22, Math.max(0.14, l * 0.72)));
  const onLight = hslToHex(h, Math.max(s, 0.45), 0.14);
  let answerBg = l <= 0.45 ? accent : dark;
  let onAccent = light;
  if (contrastRatio(onAccent, answerBg) < 4.5) onAccent = '#f4fff6';
  if (contrastRatio(onAccent, answerBg) < 4.5) {
    answerBg = dark;
    onAccent = contrastRatio(light, dark) >= 4.5 ? light : '#f4fff6';
  }
  const questionBg = light;
  const questionInk = contrastRatio(onLight, questionBg) >= 4.5 ? onLight : '#10240f';
  return {
    accent,
    dark,
    light,
    onAccent,
    onLight: questionInk,
    answerBg,
    questionBg,
  };
}

export function themeVars(theme: Theme): CSSProperties {
  return {
    '--accent': theme.accent,
    '--accent-dark': theme.dark,
    '--accent-light': theme.light,
    '--on-accent': theme.onAccent,
    '--on-light': theme.onLight,
    '--answer-bg': theme.answerBg,
    '--question-bg': theme.questionBg,
  } as CSSProperties;
}

export const brandTheme = deriveTheme('#007300');
