import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  applyModuleEdit,
  deleteModuleState,
  duplicateModuleState,
  hiddenBundledModules,
  importModuleList,
  isIdTaken,
  resetModuleState,
  resolveModules,
  restoreBundledState,
  type ResolvedModule,
} from '../lib/catalog.ts';
import { sameContent } from '../lib/content.ts';
import { defaultGame, freshGame } from '../lib/game.ts';
import { loadStore, saveStore, type StoredShape } from '../lib/storage.ts';
import { bundledModules } from '../data/bundled.ts';
import type { GameState, Module } from '../types.ts';

type UndoState = { module: Module; label: string };

type AppState = {
  modules: ResolvedModule[];
  hiddenBundled: Module[];
  games: Record<string, GameState>;
  undo: UndoState | null;
  warning: string | null;
  getModule: (id: string) => ResolvedModule | undefined;
  gameFor: (id: string) => GameState;
  persistedGame: (id: string) => GameState | undefined;
  saveGame: (game: GameState) => void;
  patchGame: (moduleId: string, recipe: (game: GameState) => GameState) => void;
  updateModule: (module: Module, label: string) => void;
  resetModule: (id: string) => void;
  deleteModule: (id: string) => void;
  restoreBundled: (id: string) => void;
  duplicateModule: (id: string) => string | null;
  importModules: (modules: Module[], mode: 'replace' | 'copy') => string[];
  idTaken: (id: string) => boolean;
  newGame: (id: string) => void;
  performUndo: () => void;
  dismissUndo: () => void;
};

const AppContext = createContext<AppState | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const loaded = useState(() => loadStore())[0];
  const [store, setStore] = useState<StoredShape>(loaded.store);
  const [warning, setWarning] = useState<string | null>(loaded.warning);
  const [undo, setUndo] = useState<UndoState | null>(null);
  const storeRef = useRef(store);
  storeRef.current = store;
  const timer = useRef<number | null>(null);

  useEffect(() => {
    try {
      saveStore(store);
    } catch (error) {
      setWarning(error instanceof Error ? error.message : 'Could not save in this browser.');
    }
  }, [store]);

  useEffect(() => {
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, []);

  const modules = useMemo(() => resolveModules(bundledModules, store), [store]);
  const hiddenBundled = useMemo(() => hiddenBundledModules(bundledModules, store), [store]);

  function armUndo() {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setUndo(null), 6000);
  }

  const api = useMemo<AppState>(() => {
    const find = (id: string) => resolveModules(bundledModules, storeRef.current).find((item) => item.current.id === id);

    return {
      modules,
      hiddenBundled,
      games: store.games,
      undo,
      warning,
      getModule: (id) => modules.find((item) => item.current.id === id),
      gameFor: (id) => store.games[id] ?? defaultGame(id),
      persistedGame: (id) => store.games[id],
      saveGame: (game) => {
        setStore((prev) => ({ ...prev, games: { ...prev.games, [game.moduleId]: game } }));
      },
      patchGame: (moduleId, recipe) => {
        setStore((prev) => {
          const current = prev.games[moduleId] ?? defaultGame(moduleId);
          const next = recipe(current);
          return {
            ...prev,
            games: {
              ...prev.games,
              [moduleId]: { ...next, moduleId, updatedAt: new Date().toISOString() },
            },
          };
        });
      },
      updateModule: (module, label) => {
        const resolved = find(module.id);
        if (!resolved || sameContent(resolved.current, module)) return;
        const next = { ...module, version: resolved.current.version + 1 };
        setUndo({ module: resolved.current, label });
        setStore((prev) => applyModuleEdit(prev, bundledModules, next));
        armUndo();
      },
      resetModule: (id) => {
        setUndo(null);
        setStore((prev) => resetModuleState(prev, bundledModules, id));
      },
      deleteModule: (id) => {
        setUndo(null);
        setStore((prev) => deleteModuleState(prev, bundledModules, id));
      },
      restoreBundled: (id) => setStore((prev) => restoreBundledState(prev, id)),
      duplicateModule: (id) => {
        const resolved = find(id);
        if (!resolved) return null;
        const result = duplicateModuleState(storeRef.current, bundledModules, resolved.current);
        setStore(result.store);
        return result.id;
      },
      importModules: (list, mode) => {
        const result = importModuleList(storeRef.current, bundledModules, list, mode);
        setStore(result.store);
        return result.ids;
      },
      idTaken: (id) => isIdTaken(storeRef.current, bundledModules, id),
      newGame: (id) => {
        setStore((prev) => {
          const current = prev.games[id] ?? defaultGame(id);
          return { ...prev, games: { ...prev.games, [id]: freshGame(current) } };
        });
      },
      performUndo: () => {
        setUndo((current) => {
          if (!current) return null;
          setStore((prev) => applyModuleEdit(prev, bundledModules, current.module));
          return null;
        });
      },
      dismissUndo: () => setUndo(null),
    };
  }, [hiddenBundled, modules, store.games, undo, warning]);

  return <AppContext.Provider value={api}>{children}</AppContext.Provider>;
}

export function useApp(): AppState {
  const value = useContext(AppContext);
  if (!value) throw new Error('useApp must be used inside AppStateProvider');
  return value;
}
