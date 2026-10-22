import { describe, expect, it } from 'vitest';
import { contrastRatio, deriveTheme } from '../src/lib/theme.ts';

describe('deriveTheme', () => {
  it('turns the original green into a mint question screen and a green answer screen', () => {
    const theme = deriveTheme('#007300');
    expect(theme.accent).toBe('#007300');
    expect(theme.light).toBe('#ccffcc');
    expect(theme.questionBg).toBe('#ccffcc');
    expect(theme.answerBg).toBe('#007300');
    expect(theme.onAccent).toBe('#ccffcc');
    expect(contrastRatio(theme.onAccent, theme.answerBg)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(theme.onLight, theme.questionBg)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio('#ffffff', theme.dark)).toBeGreaterThanOrEqual(4.5);
  });

  it('darkens a pale accent so the answer screen stays readable', () => {
    const theme = deriveTheme('#d6ff4a');
    expect(contrastRatio(theme.onAccent, theme.answerBg)).toBeGreaterThanOrEqual(4.5);
  });
});
