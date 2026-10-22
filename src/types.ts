export type Clue = {
  id: string;
  question: string;
  answers: string[];
};

export type Category = {
  id: string;
  name: string;
  clues: Clue[];
};

export type Module = {
  id: string;
  title: string;
  accentColor: string;
  categories: Category[];
  version: number;
};

export type Player = {
  name: string;
  score: number;
};

export type GameState = {
  moduleId: string;
  players: Player[];
  used: string[];
  updatedAt: string;
};

export const CATEGORY_COUNT = 5;
export const CLUES_PER_CATEGORY = 10;
export const CLUE_TOTAL = CATEGORY_COUNT * CLUES_PER_CATEGORY;

export function pointsForIndex(index: number): number {
  return (index + 1) * 10;
}
