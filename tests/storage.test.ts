import { describe, expect, it } from 'vitest';
import { applyModuleEdit, resolveModules } from '../src/lib/catalog.ts';
import { updateCategoryName, updateClue } from '../src/lib/content.ts';
import { freshGame, resizePlayers } from '../src/lib/game.ts';
import { moduleFromTab } from '../src/lib/import-tab.ts';
import { emptyStore, loadStore, saveStore, type StoredShape } from '../src/lib/storage.ts';
import { readFileSync } from 'node:fs';

const tab = readFileSync(new URL('../data/product-phenomenon.tab', import.meta.url), 'utf8');

function memory() {
  const data = new Map<string, string>();
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => {
      data.set(key, value);
    },
  };
}

describe('saved games and edits', () => {
  const original = moduleFromTab(tab, {
    id: 'product-phenomenon',
    title: 'Product Phenomenon',
    accentColor: '#007300',
    categoryNames: ['A', 'B', 'C', 'D', 'E'],
  });

  it('keeps twenty scores and used tiles across a reload', () => {
    const players = resizePlayers([], 20).map((player, index) =>
      index === 19 ? { ...player, score: -30 } : player,
    );
    expect(players).toHaveLength(20);
    const store: StoredShape = {
      ...emptyStore(),
      games: {
        'product-phenomenon': {
          moduleId: 'product-phenomenon',
          players,
          used: ['product-phenomenon:0:10', 'product-phenomenon:4:100'],
          updatedAt: '2026-10-22T00:00:00.000Z',
        },
      },
    };
    const box = memory();
    saveStore(store, box);
    const loaded = loadStore(box);
    const game = loaded.store.games['product-phenomenon'];
    expect(game?.players).toHaveLength(20);
    expect(game?.players[19]?.score).toBe(-30);
    expect(game?.used).toEqual(['product-phenomenon:0:10', 'product-phenomenon:4:100']);
    expect(freshGame(game!).used).toEqual([]);
    expect(freshGame(game!).players[19]?.score).toBe(0);
    expect(freshGame(game!).players[19]?.name).toBe('Team 20');
  });

  it('stores an edit and restores the bundled original', () => {
    const edited = updateClue(
      updateCategoryName(original, 0, 'Brand new name'),
      'product-phenomenon:0:10',
      { question: 'Rewritten _____', answers: ['Something else'] },
    );
    let store = applyModuleEdit(emptyStore(), [original], edited);
    const box = memory();
    saveStore(store, box);
    store = loadStore(box).store;
    const resolved = resolveModules([original], store)[0];
    expect(resolved?.edited).toBe(true);
    expect(resolved?.current.categories[0]?.name).toBe('Brand new name');
    expect(resolved?.current.categories[0]?.clues[0]?.answers).toEqual(['Something else']);
    store = applyModuleEdit(store, [original], original);
    const restored = resolveModules([original], store)[0];
    expect(restored?.edited).toBe(false);
    expect(restored?.current.categories[0]?.clues[0]?.answers).toEqual(original.categories[0]?.clues[0]?.answers);
  });
});
