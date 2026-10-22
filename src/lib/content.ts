import type { Module } from '../types.ts';
import { pointsForIndex } from '../types.ts';

export type FoundClue = {
  categoryName: string;
  categoryId: string;
  catIndex: number;
  clueIndex: number;
  points: number;
  question: string;
  answers: string[];
  clueId: string;
};

export function findClue(module: Module, clueId: string): FoundClue | null {
  for (let catIndex = 0; catIndex < module.categories.length; catIndex += 1) {
    const category = module.categories[catIndex];
    if (!category) continue;
    for (let clueIndex = 0; clueIndex < category.clues.length; clueIndex += 1) {
      const clue = category.clues[clueIndex];
      if (!clue || clue.id !== clueId) continue;
      return {
        categoryName: category.name,
        categoryId: category.id,
        catIndex,
        clueIndex,
        points: pointsForIndex(clueIndex),
        question: clue.question,
        answers: clue.answers,
        clueId: clue.id,
      };
    }
  }
  return null;
}

export function contentKey(module: Module): string {
  return JSON.stringify({
    title: module.title.trim(),
    accentColor: module.accentColor.toLowerCase(),
    categories: module.categories.map((category) => ({
      name: category.name.trim(),
      clues: category.clues.map((clue) => ({
        question: clue.question,
        answers: clue.answers,
      })),
    })),
  });
}

export function sameContent(a: Module, b: Module): boolean {
  return contentKey(a) === contentKey(b);
}

export function updateCategoryName(module: Module, catIndex: number, name: string): Module {
  return {
    ...module,
    categories: module.categories.map((category, index) =>
      index === catIndex ? { ...category, name } : category,
    ),
  };
}

export function updateClue(
  module: Module,
  clueId: string,
  patch: { question?: string; answers?: string[] },
): Module {
  return {
    ...module,
    categories: module.categories.map((category) => ({
      ...category,
      clues: category.clues.map((clue) => (clue.id === clueId ? { ...clue, ...patch } : clue)),
    })),
  };
}
