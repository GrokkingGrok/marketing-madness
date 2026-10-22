import type { Category, Clue, Module } from '../types.ts';
import { pointsForIndex } from '../types.ts';
import { normalizeSeed, seededShuffle } from './shuffle.ts';

export type PaperItem = {
  clue: Clue;
  category: string;
  points: number;
};

export type Paper = {
  seed: number;
  items: PaperItem[];
};

export function compareAnswers(a: string, b: string): number {
  return a.localeCompare(b, 'en', { sensitivity: 'base', numeric: true });
}

export function studyGuide(module: Module, categoryId: string | 'all'): PaperItem[] {
  const categories =
    categoryId === 'all' ? module.categories : module.categories.filter((category) => category.id === categoryId);
  const items = categories.flatMap((category) =>
    category.clues.map((clue, index) => ({
      clue,
      category: category.name,
      points: pointsForIndex(index),
    })),
  );
  return items.sort(
    (a, b) => compareAnswers(a.clue.answers[0] ?? '', b.clue.answers[0] ?? '') || a.points - b.points,
  );
}

export function buildQuiz(category: Category, seed: number): Paper {
  const normalized = normalizeSeed(seed);
  const items = category.clues.map((clue, index) => ({
    clue,
    category: category.name,
    points: pointsForIndex(index),
  }));
  return { seed: normalized, items: seededShuffle(items, normalized) };
}

export function buildTest(module: Module, count: number, seed: number): Paper {
  const normalized = normalizeSeed(seed);
  const items = module.categories.flatMap((category) =>
    category.clues.map((clue, index) => ({
      clue,
      category: category.name,
      points: pointsForIndex(index),
    })),
  );
  const n = Math.max(1, Math.min(items.length, Math.round(count) || 1));
  return { seed: normalized, items: seededShuffle(items, normalized).slice(0, n) };
}

export function wordBank(module: Module): string[] {
  const seen = new Set<string>();
  const answers: string[] = [];
  for (const category of module.categories) {
    for (const clue of category.clues) {
      for (const answer of clue.answers) {
        const trimmed = answer.trim();
        if (!trimmed) continue;
        const key = trimmed.toLocaleLowerCase('en');
        if (seen.has(key)) continue;
        seen.add(key);
        answers.push(trimmed);
      }
    }
  }
  answers.sort(compareAnswers);
  return answers;
}
