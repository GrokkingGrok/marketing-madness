import type { GameState, Player } from '../types.ts';

export function defaultPlayers(): Player[] {
  return [1, 2, 3, 4].map((n) => ({ name: `Team ${n}`, score: 0 }));
}

export function defaultGame(moduleId: string): GameState {
  return {
    moduleId,
    players: defaultPlayers(),
    used: [],
    updatedAt: new Date().toISOString(),
  };
}

export function inProgress(game: GameState | undefined): boolean {
  if (!game) return false;
  return game.used.length > 0 || game.players.some((player) => player.score !== 0);
}

export function resizePlayers(players: Player[], count: number): Player[] {
  const nextCount = Math.max(1, Math.min(20, Math.round(count)));
  if (nextCount === players.length) return players;
  if (nextCount < players.length) return players.slice(0, nextCount);
  const next = players.slice();
  for (let i = players.length; i < nextCount; i += 1) {
    next.push({ name: `Team ${i + 1}`, score: 0 });
  }
  return next;
}

export function movePlayer(players: Player[], index: number, direction: -1 | 1): Player[] {
  const target = index + direction;
  if (index < 0 || target < 0 || index >= players.length || target >= players.length) return players;
  const next = players.slice();
  const current = next[index];
  const swap = next[target];
  if (!current || !swap) return players;
  next[index] = swap;
  next[target] = current;
  return next;
}

export function freshGame(game: GameState): GameState {
  return {
    ...game,
    players: game.players.map((player) => ({ name: player.name, score: 0 })),
    used: [],
    updatedAt: new Date().toISOString(),
  };
}
