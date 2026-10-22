import type { GameState, Module } from '../types.ts';
import { CATEGORY_COUNT, CLUES_PER_CATEGORY } from '../types.ts';

export type StoredShape = {
  overrides: Record<string, Module>;
  imported: Record<string, { original: Module; current: Module }>;
  hiddenBundled: string[];
  games: Record<string, GameState>;
};

export const STORAGE_KEY = 'marketing-madness.v1';

type StorageLike = Pick<Storage, 'getItem' | 'setItem'>;

export function emptyStore(): StoredShape {
  return { overrides: {}, imported: {}, hiddenBundled: [], games: {} };
}

export type LoadResult = { store: StoredShape; warning: string | null };

export function loadStore(storage: StorageLike = localStorage): LoadResult {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return { store: emptyStore(), warning: null };
    const parsed = JSON.parse(raw) as unknown;
    return { store: sanitizeStore(parsed), warning: null };
  } catch {
    return {
      store: emptyStore(),
      warning: 'Saved data on this browser could not be read, so Marketing Madness started fresh.',
    };
  }
}

export function saveStore(store: StoredShape, storage: StorageLike = localStorage): void {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    throw new Error('This browser could not save the game. Free a little storage and try again.');
  }
}

export function sanitizeStore(parsed: unknown): StoredShape {
  if (!parsed || typeof parsed !== 'object') return emptyStore();
  const source = parsed as Partial<StoredShape>;
  const overrides: Record<string, Module> = {};
  if (source.overrides && typeof source.overrides === 'object') {
    for (const [id, value] of Object.entries(source.overrides)) {
      const module = sanitizeModule(value);
      if (module && module.id === id) overrides[id] = module;
    }
  }
  const imported: StoredShape['imported'] = {};
  if (source.imported && typeof source.imported === 'object') {
    for (const [id, value] of Object.entries(source.imported)) {
      if (!value || typeof value !== 'object') continue;
      const entry = value as { original?: unknown; current?: unknown };
      const original = sanitizeModule(entry.original);
      const current = sanitizeModule(entry.current);
      if (original && current && original.id === id && current.id === id) {
        imported[id] = { original, current };
      }
    }
  }
  const hiddenBundled = Array.isArray(source.hiddenBundled)
    ? source.hiddenBundled.filter((id): id is string => typeof id === 'string')
    : [];
  const games: Record<string, GameState> = {};
  if (source.games && typeof source.games === 'object') {
    for (const [id, value] of Object.entries(source.games)) {
      const game = sanitizeGame(value, id);
      if (game) games[id] = game;
    }
  }
  return { overrides, imported, hiddenBundled, games };
}

function sanitizeModule(value: unknown): Module | null {
  if (!value || typeof value !== 'object') return null;
  const module = value as Module;
  if (typeof module.id !== 'string' || typeof module.title !== 'string') return null;
  if (typeof module.accentColor !== 'string' || !Array.isArray(module.categories)) return null;
  if (module.categories.length !== CATEGORY_COUNT) return null;
  for (const category of module.categories) {
    if (!category || typeof category.id !== 'string' || typeof category.name !== 'string') return null;
    if (!Array.isArray(category.clues) || category.clues.length !== CLUES_PER_CATEGORY) return null;
    for (const clue of category.clues) {
      if (!clue || typeof clue.id !== 'string' || typeof clue.question !== 'string') return null;
      if (!Array.isArray(clue.answers) || clue.answers.some((answer) => typeof answer !== 'string')) return null;
    }
  }
  return module;
}

function sanitizeGame(value: unknown, moduleId: string): GameState | null {
  if (!value || typeof value !== 'object') return null;
  const game = value as GameState;
  if (!Array.isArray(game.players) || game.players.length < 1 || game.players.length > 20) return null;
  const players = game.players.map((player, index) => {
    const name = player && typeof player.name === 'string' && player.name.trim() ? player.name.trim().slice(0, 40) : `Player ${index + 1}`;
    const score = player && typeof player.score === 'number' && Number.isFinite(player.score) ? Math.round(player.score) : 0;
    return { name, score };
  });
  const used = Array.isArray(game.used) ? game.used.filter((id): id is string => typeof id === 'string') : [];
  return {
    moduleId,
    players,
    used,
    updatedAt: typeof game.updatedAt === 'string' ? game.updatedAt : new Date(0).toISOString(),
  };
}
