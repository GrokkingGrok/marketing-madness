import { withId } from './ids.ts';
import { slugify } from './ids.ts';
import { normalizeHex } from './theme.ts';
import { normalizeProse, splitAnswers } from './text.ts';
import {
  CATEGORY_COUNT,
  CLUE_TOTAL,
  CLUES_PER_CATEGORY,
  type Module,
  pointsForIndex,
} from '../types.ts';

export class ImportError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ImportError';
  }
}

export type TabRow = {
  answer: string;
  order: number;
  question: string;
};

export type TabImportOptions = {
  id?: string;
  title: string;
  accentColor: string;
  categoryNames: string[];
  version?: number;
};

export function parseTab(raw: string): TabRow[] {
  const text = raw.replace(/^\uFEFF/, '');
  const lines = text.split(/\r\n|\n|\r/).filter((line) => line.trim().length > 0);
  if (lines.length === 0) throw new ImportError('That file has no rows.');

  const rows: TabRow[] = [];
  for (const line of lines) {
    const parts = line.split('\t');
    if (parts.length < 3) {
      throw new ImportError('Each row needs an answer, a board order, and a question, separated by tabs.');
    }
    const order = Number(parts[1]?.trim());
    if (!Number.isInteger(order)) {
      throw new ImportError(`Board order "${parts[1] ?? ''}" is not a whole number.`);
    }
    rows.push({
      answer: parts[0] ?? '',
      order,
      question: parts[2] ?? '',
    });
  }
  return rows;
}

export function moduleFromTab(raw: string, options: TabImportOptions): Module {
  const title = options.title.trim();
  if (!title) throw new ImportError('Give the module a title.');
  if (options.categoryNames.length !== CATEGORY_COUNT) {
    throw new ImportError('A module needs exactly five category names.');
  }
  if (options.categoryNames.some((name) => !name.trim())) {
    throw new ImportError('Every category needs a name.');
  }

  const rows = parseTab(raw);
  if (rows.length !== CLUE_TOTAL) {
    throw new ImportError(
      `This file has ${rows.length} clues. A module needs exactly ${CLUE_TOTAL} (five categories of ten).`,
    );
  }

  const seen = new Map<number, number>();
  for (const row of rows) seen.set(row.order, (seen.get(row.order) ?? 0) + 1);
  for (const [order, count] of seen) {
    if (count > 1) throw new ImportError(`Board order ${order} appears more than once.`);
  }
  for (let order = 1; order <= CLUE_TOTAL; order += 1) {
    if (!seen.has(order)) throw new ImportError(`Board order ${order} is missing.`);
  }

  const id = slugify(options.id?.trim() || title);
  const sorted = [...rows].sort((a, b) => a.order - b.order);
  const categories = options.categoryNames.map((name, catIndex) => ({
    id: `${id}:cat:${catIndex}`,
    name: name.trim(),
    clues: sorted.slice(catIndex * CLUES_PER_CATEGORY, (catIndex + 1) * CLUES_PER_CATEGORY).map((row, clueIndex) => ({
      id: `${id}:${catIndex}:${pointsForIndex(clueIndex)}`,
      question: normalizeProse(row.question),
      answers: splitAnswers(row.answer),
    })),
  }));

  return {
    id,
    title,
    accentColor: normalizeHex(options.accentColor),
    categories,
    version: options.version ?? 1,
  };
}

export function parseModuleJson(raw: string): Module[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw) as unknown;
  } catch {
    throw new ImportError('That file is not valid JSON.');
  }
  const list = unwrapModules(parsed);
  if (list.length === 0) throw new ImportError('That JSON file has no modules.');
  return list.map((item, index) => coerceModule(item, index));
}

export function sniffImport(
  filename: string,
  text: string,
): { kind: 'json'; modules: Module[] } | { kind: 'tab'; text: string } {
  const name = filename.toLowerCase();
  const trimmed = text.trim();
  if (name.endsWith('.json') || trimmed.startsWith('{') || trimmed.startsWith('[')) {
    return { kind: 'json', modules: parseModuleJson(text) };
  }
  return { kind: 'tab', text };
}

function unwrapModules(parsed: unknown): unknown[] {
  if (Array.isArray(parsed)) return parsed;
  if (parsed && typeof parsed === 'object' && Array.isArray((parsed as { modules?: unknown }).modules)) {
    return (parsed as { modules: unknown[] }).modules;
  }
  return [parsed];
}

function coerceModule(input: unknown, index: number): Module {
  if (!input || typeof input !== 'object') {
    throw new ImportError(`Module ${index + 1} is not an object.`);
  }
  const source = input as Partial<Module>;
  const title = typeof source.title === 'string' ? source.title.trim() : '';
  if (!title) throw new ImportError(`Module ${index + 1} needs a title.`);
  if (!Array.isArray(source.categories) || source.categories.length !== CATEGORY_COUNT) {
    throw new ImportError(`"${title}" needs exactly five categories.`);
  }
  const id = slugify(typeof source.id === 'string' && source.id.trim() ? source.id : title);
  const draft: Module = {
    id,
    title,
    accentColor: normalizeHex(typeof source.accentColor === 'string' ? source.accentColor : '#007300'),
    version: typeof source.version === 'number' && Number.isFinite(source.version) ? source.version : 1,
    categories: source.categories.map((category, catIndex) => {
      if (!category || typeof category.name !== 'string' || !category.name.trim()) {
        throw new ImportError(`Category ${catIndex + 1} in "${title}" needs a name.`);
      }
      if (!Array.isArray(category.clues) || category.clues.length !== CLUES_PER_CATEGORY) {
        throw new ImportError(`"${category.name}" in "${title}" needs exactly ten clues.`);
      }
      return {
        id: `${id}:cat:${catIndex}`,
        name: category.name.trim(),
        clues: category.clues.map((clue, clueIndex) => {
          const answers = Array.isArray(clue?.answers)
            ? clue.answers.map((answer) => String(answer).trim()).filter(Boolean)
            : [];
          return {
            id: `${id}:${catIndex}:${pointsForIndex(clueIndex)}`,
            question: typeof clue?.question === 'string' ? clue.question : '',
            answers: answers.length > 0 ? answers : [''],
          };
        }),
      };
    }),
  };
  return withId(draft, id);
}
