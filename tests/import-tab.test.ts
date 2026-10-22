import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import bundled from '../modules/product-phenomenon.json' with { type: 'json' };
import { moduleFromTab, parseModuleJson, ImportError } from '../src/lib/import-tab.ts';
import { splitAnswers } from '../src/lib/text.ts';
import type { Module } from '../src/types.ts';

const tab = readFileSync(new URL('../data/product-phenomenon.tab', import.meta.url), 'utf8');

const NAMES = [
  'Branding is the Answer',
  'It\'s Pronounced "Product"',
  'Trading Steps',
  'We Guarantee It!',
  'Potluck Phenomenon',
] as const;

/** Board order 1–50. Snippet must appear in that clue's question. */
const SLOTS: { answers: string[]; question: string }[] = [
  { answers: ['Generic Brands', 'Generic'], question: 'carry no brand name' },
  { answers: ['Brands'], question: 'Names, designs, or symbols' },
  { answers: ['Brand Name'], question: 'actually read and/or say' },
  { answers: ['Brand Mark'], question: 'distinct part of a brand' },
  { answers: ['Brand Licensing'], question: 'legal authorization' },
  { answers: ['Co-branding Strategy'], question: 'customer loyalty and sales' },
  { answers: ['Private Distributor Brand', 'Dealer Brand', 'Store Brand'], question: 'wholesalers and retailers' },
  { answers: ['Manufacturer Brand'], question: 'promoted by the producer' },
  { answers: ['Mixed-Brand Strategy'], question: 'combination of manufacturer' },
  { answers: ['Brand Extension'], question: 'existing brand name for a new' },
  { answers: ['Product Life Cycle'], question: 'over and over' },
  { answers: ['Product Planning'], question: 'satisfaction of customer needs' },
  { answers: ['Product Mix'], question: 'manufacturers or distributes' },
  { answers: ['Product Positioning'], question: 'particular image' },
  { answers: ['Product Packaging'], question: 'protection, identification' },
  { answers: ['Product Item'], question: 'make, model, brand' },
  { answers: ['Product Line'], question: 'Campbell' },
  { answers: ['Product Depth'], question: 'available within a product line' },
  { answers: ['Product Width'], question: 'different kinds of closely related' },
  { answers: ['Product Modification'], question: 'change or alter' },
  { answers: ['Trade Characters'], question: 'human-like personalities' },
  { answers: ['One'], question: 'step number' },
  { answers: ['Screened'], question: 'accepted or eliminated' },
  { answers: ['Testing the Product'], question: 'sometimes bypassed' },
  { answers: ['Trademark'], question: 'legally protected' },
  { answers: ['Commercialization'], question: 'test markets successfully' },
  { answers: ['Developing the Product'], question: 'business proposal' },
  { answers: ['Trade Name'], question: 'legal name that a company' },
  { answers: ['Introduction Stage'], question: 'emphasis is on promotion' },
  { answers: ['Evaluating Customer Acceptance'], question: 'how the market responded' },
  { answers: ['Label'], question: 'Printed information' },
  { answers: ['Warranty'], question: 'durability or deterioration' },
  { answers: ['Limited Warranty'], question: 'does not cover full replacement' },
  { answers: ['Full Warranty'], question: 'repaired or replaced at no cost' },
  { answers: ['Express Warranty'], question: 'explicitly stated' },
  { answers: ['Disclaimer'], question: 'exceptions to and exclusions' },
  { answers: ['Implied Warranty'], question: 'exists automatically' },
  { answers: ['Warranty of Merchantability'], question: 'exactly what it says' },
  { answers: ['Category Management'], question: 'profits and losses' },
  { answers: ['Warranty of Fitness for a Particular Purpose'], question: 'action taken by the customer' },
  { answers: ['Obsolete'], question: 'no longer in demand' },
  { answers: ['Fair Packaging and Labeling Act'], question: 'Labeling Law' },
  { answers: ['Planograms'], question: 'both sides of an aisle' },
  { answers: ['Charge Account (Regular or Thirty-Day)'], question: 'within one month' },
  { answers: ['Revolving Accounts'], question: 'sets the credit limit' },
  { answers: ['Growth Stage'], question: 'Sales and profits increase' },
  { answers: ['Budget Accounts', 'Ninety-Day Accounts'], question: '90-day period' },
  { answers: ['Declining Stage'], question: 'fall below costs' },
  { answers: ['Maturity Stage'], question: 'level off or slow down' },
  { answers: ['Installment Account'], question: 'specified period of time' },
];

function productPhenomenon(): Module {
  return moduleFromTab(tab, {
    id: 'product-phenomenon',
    title: 'Product Phenomenon',
    accentColor: '#007300',
    categoryNames: [...NAMES],
  });
}

describe('product phenomenon tab import', () => {
  const module = productPhenomenon();

  it('puts every clue in the category and point slot from board order', () => {
    expect(module.categories).toHaveLength(5);
    expect(module.categories.map((category) => category.name)).toEqual([...NAMES]);
    expect(module.accentColor).toBe('#007300');
    expect(SLOTS).toHaveLength(50);

    for (let order = 1; order <= 50; order += 1) {
      const slot = SLOTS[order - 1];
      const catIndex = Math.floor((order - 1) / 10);
      const clueIndex = (order - 1) % 10;
      const clue = module.categories[catIndex]?.clues[clueIndex];
      expect(clue, `order ${order}`).toBeTruthy();
      expect(clue?.answers, `order ${order} answers`).toEqual(slot?.answers);
      expect(clue?.question, `order ${order} question`).toContain(slot?.question);
      expect(clue?.question, `order ${order} blank`).toMatch(/_{3,}/);
      expect(clue?.id).toBe(`product-phenomenon:${catIndex}:${(clueIndex + 1) * 10}`);
    }
  });

  it('matches the spec examples for Branding 10 and Branding 100', () => {
    const branding = module.categories[0];
    expect(branding?.name).toBe('Branding is the Answer');
    expect(branding?.clues[0]?.answers).toEqual(['Generic Brands', 'Generic']);
    expect(branding?.clues[9]?.answers).toEqual(['Brand Extension']);
  });

  it('keeps the trademark and straightens curly quotes', () => {
    const productLine = module.categories[1]?.clues[6];
    expect(productLine?.answers).toEqual(['Product Line']);
    expect(productLine?.question).toContain("Campbell's™");
    expect(productLine?.question).not.toMatch(/[\u2018\u2019\u201C\u201D]/);
    const labeling = module.categories[4]?.clues[1]?.question ?? '';
    expect(labeling).toContain('"Labeling Law"');
    for (const category of module.categories) {
      for (const clue of category.clues) {
        expect(clue.question).not.toMatch(/[\u2018\u2019\u201C\u201D\u000b]/);
        expect(clue.answers.join('\n')).not.toMatch(/[\u2018\u2019\u201C\u201D\u000b]/);
      }
    }
  });

  it('fixes the lost space after a comma without touching answer wording', () => {
    const categoryManagement = module.categories[3]?.clues[8];
    expect(categoryManagement?.answers).toEqual(['Category Management']);
    expect(categoryManagement?.question).toContain('product line, and hence');
  });

  it('builds a second module from the same file with a new color and no special case', () => {
    const other = moduleFromTab(tab, {
      id: 'pricing-party',
      title: 'Pricing Party',
      accentColor: '#7A1FA2',
      categoryNames: ['Prices', 'Places', 'Promos', 'People', 'Potluck'],
    });
    expect(other.id).toBe('pricing-party');
    expect(other.title).toBe('Pricing Party');
    expect(other.accentColor).toBe('#7a1fa2');
    expect(other.categories[0]?.name).toBe('Prices');
    expect(other.categories[0]?.clues[0]?.answers).toEqual(['Generic Brands', 'Generic']);
    expect(other.categories[0]?.clues[0]?.id).toBe('pricing-party:0:10');
    expect(other.categories[4]?.clues[9]?.answers).toEqual(['Installment Account']);
    expect(other.categories[4]?.name).toBe('Potluck');
  });

  it('round-trips through the app JSON format and matches the bundled file', () => {
    const again = parseModuleJson(JSON.stringify(module));
    expect(again).toEqual([module]);
    const wrapped = parseModuleJson(JSON.stringify({ format: 'marketing-madness-modules', modules: [module] }));
    expect(wrapped).toEqual([module]);
    expect(bundled).toEqual(module);
  });

  it('rejects a short file and a repeated board order', () => {
    expect(() => moduleFromTab('Only\t1\tWhat is _____?\t1\t.1', {
      title: 'Short',
      accentColor: '#007300',
      categoryNames: [...NAMES],
    })).toThrow(ImportError);

    const rows = Array.from({ length: 50 }, (_, index) => `Answer\t${index === 49 ? 1 : index + 1}\tWhat is _____?\t1\t.2`);
    expect(() => moduleFromTab(rows.join('\n'), {
      title: 'Dup',
      accentColor: '#007300',
      categoryNames: [...NAMES],
    })).toThrow(/more than once/);
  });
});

describe('splitAnswers', () => {
  it('splits alternates that ran together on export', () => {
    expect(splitAnswers('Generic Brandsor Generic')).toEqual(['Generic Brands', 'Generic']);
    expect(splitAnswers('Budget AccountsorNinety-Day Accounts')).toEqual(['Budget Accounts', 'Ninety-Day Accounts']);
    expect(splitAnswers('Private Distributor Brandalso known asDealer Brand or Store Brand')).toEqual([
      'Private Distributor Brand',
      'Dealer Brand',
      'Store Brand',
    ]);
  });

  it('splits the vertical-tab form from this export and keeps parenthetical or', () => {
    expect(splitAnswers('Generic Brands\u000bor \u000bGeneric')).toEqual(['Generic Brands', 'Generic']);
    expect(splitAnswers('Budget Accounts\u000bor\u000bNinety-Day Accounts')).toEqual([
      'Budget Accounts',
      'Ninety-Day Accounts',
    ]);
    expect(splitAnswers('Private Distributor Brand\u000balso known as\u000bDealer Brand or Store Brand\u000b')).toEqual([
      'Private Distributor Brand',
      'Dealer Brand',
      'Store Brand',
    ]);
    expect(splitAnswers('Charge Account\u000b(Regular or Thirty-Day)')).toEqual([
      'Charge Account (Regular or Thirty-Day)',
    ]);
    expect(splitAnswers('Charge Account (Regular or Thirty-Day)')).toEqual([
      'Charge Account (Regular or Thirty-Day)',
    ]);
  });

  it('leaves a single answer alone, including words that merely contain or', () => {
    expect(splitAnswers('Brand Extension')).toEqual(['Brand Extension']);
    expect(splitAnswers('Warranty of Fitness for a Particular Purpose')).toEqual([
      'Warranty of Fitness for a Particular Purpose',
    ]);
    expect(splitAnswers('Mixed-Brand Strategy')).toEqual(['Mixed-Brand Strategy']);
    expect(splitAnswers('Distributor Brand')).toEqual(['Distributor Brand']);
    expect(splitAnswers('Sponsor Event')).toEqual(['Sponsor Event']);
  });
});
