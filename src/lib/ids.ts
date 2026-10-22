import { clone } from './clone.ts';
import { normalizeHex } from './theme.ts';
import {
  CATEGORY_COUNT,
  CLUES_PER_CATEGORY,
  type Module,
  pointsForIndex,
} from '../types.ts';

export function slugify(value: string): string {
  const slug = value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/['’]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || 'module';
}

export function withId(module: Module, id: string): Module {
  const copy = clone(module);
  copy.id = id;
  copy.categories = copy.categories.map((category, catIndex) => ({
    ...category,
    id: `${id}:cat:${catIndex}`,
    clues: category.clues.map((clue, clueIndex) => ({
      ...clue,
      id: `${id}:${catIndex}:${pointsForIndex(clueIndex)}`,
    })),
  }));
  return copy;
}

export function uniqueModuleId(base: string, taken: (id: string) => boolean): string {
  const root = slugify(base);
  if (!taken(root)) return root;
  let n = 2;
  while (taken(`${root}-${n}`)) n += 1;
  return `${root}-${n}`;
}

export function blankModule(title: string, accentColor: string, names: string[]): Module {
  const trimmed = title.trim() || 'Untitled module';
  const id = slugify(trimmed);
  const categoryNames =
    names.length === CATEGORY_COUNT ? names : Array.from({ length: CATEGORY_COUNT }, (_, i) => names[i] ?? `Category ${i + 1}`);
  return {
    id,
    title: trimmed,
    accentColor: normalizeHex(accentColor),
    version: 1,
    categories: categoryNames.map((name, catIndex) => ({
      id: `${id}:cat:${catIndex}`,
      name: name.trim() || `Category ${catIndex + 1}`,
      clues: Array.from({ length: CLUES_PER_CATEGORY }, (_, clueIndex) => ({
        id: `${id}:${catIndex}:${pointsForIndex(clueIndex)}`,
        question: '',
        answers: [''],
      })),
    })),
  };
}
