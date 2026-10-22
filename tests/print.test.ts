import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { moduleFromTab } from '../src/lib/import-tab.ts';
import { buildQuiz, buildTest, studyGuide, wordBank } from '../src/lib/print-model.ts';

const tab = readFileSync(new URL('../data/product-phenomenon.tab', import.meta.url), 'utf8');
const module = moduleFromTab(tab, {
  id: 'product-phenomenon',
  title: 'Product Phenomenon',
  accentColor: '#007300',
  categoryNames: [
    'Branding is the Answer',
    'It\'s Pronounced "Product"',
    'Trading Steps',
    'We Guarantee It!',
    'Potluck Phenomenon',
  ],
});

describe('print models', () => {
  it('prints a quiz and its key from the same seed', () => {
    const branding = module.categories[0];
    expect(branding).toBeTruthy();
    if (!branding) return;
    const first = buildQuiz(branding, 184223);
    const again = buildQuiz(branding, 184223);
    expect(first.seed).toBe(184223);
    expect(first.items.map((item) => item.clue.id)).toEqual(again.items.map((item) => item.clue.id));
    expect(first.items).toHaveLength(10);
    const other = buildQuiz(branding, 99);
    expect(other.items.map((item) => item.clue.id)).not.toEqual(first.items.map((item) => item.clue.id));
  });

  it('builds a test of N questions with a matching order for the key', () => {
    const paper = buildTest(module, 12, 42);
    expect(paper.items).toHaveLength(12);
    expect(buildTest(module, 12, 42).items.map((item) => item.clue.id)).toEqual(
      paper.items.map((item) => item.clue.id),
    );
    expect(buildTest(module, 50, 7).items).toHaveLength(50);
    expect(new Set(buildTest(module, 50, 7).items.map((item) => item.clue.id)).size).toBe(50);
    expect(buildTest(module, 1, 7).items).toHaveLength(1);
  });

  it('sorts the study guide alphabetically by the primary answer', () => {
    const branding = module.categories[0];
    expect(branding).toBeTruthy();
    if (!branding) return;
    const guide = studyGuide(module, branding.id);
    const names = guide.map((item) => item.clue.answers[0]);
    const sorted = [...names].sort((a, b) => (a ?? '').localeCompare(b ?? '', 'en', { sensitivity: 'base' }));
    expect(names).toEqual(sorted);
    expect(names[0]).toBe('Brand Extension');
    expect(studyGuide(module, 'all')).toHaveLength(50);
  });

  it('lists every accepted wording in the word bank', () => {
    const bank = wordBank(module);
    expect(bank).toContain('Generic Brands');
    expect(bank).toContain('Generic');
    expect(bank).toContain('Store Brand');
    expect(bank).toContain('Brand Extension');
    const sorted = [...bank].sort((a, b) => a.localeCompare(b, 'en', { sensitivity: 'base' }));
    expect(bank).toEqual(sorted);
  });
});
