import { clone } from './clone.ts';
import { sameContent } from './content.ts';
import { uniqueModuleId, withId } from './ids.ts';
import type { Module } from '../types.ts';
import type { GameState } from '../types.ts';
import type { StoredShape } from './storage.ts';

export type ModuleOrigin = 'bundled' | 'imported';

export type ResolvedModule = {
  current: Module;
  original: Module;
  origin: ModuleOrigin;
  edited: boolean;
};

export function emptyStoredShape(): StoredShape {
  return { overrides: {}, imported: {}, hiddenBundled: [], games: {} };
}

export function resolveModules(bundled: Module[], store: StoredShape): ResolvedModule[] {
  const visible: ResolvedModule[] = [];
  for (const original of bundled) {
    if (store.hiddenBundled.includes(original.id)) continue;
    const override = store.overrides[original.id];
    const current = override ?? original;
    visible.push({
      current,
      original,
      origin: 'bundled',
      edited: override ? !sameContent(override, original) : false,
    });
  }
  for (const entry of Object.values(store.imported)) {
    visible.push({
      current: entry.current,
      original: entry.original,
      origin: 'imported',
      edited: !sameContent(entry.current, entry.original),
    });
  }
  return visible;
}

export function hiddenBundledModules(bundled: Module[], store: StoredShape): Module[] {
  return bundled.filter((module) => store.hiddenBundled.includes(module.id));
}

export function isIdTaken(store: StoredShape, bundled: Module[], id: string): boolean {
  if (bundled.some((module) => module.id === id)) return true;
  if (store.imported[id]) return true;
  if (store.overrides[id]) return true;
  return false;
}

export function applyModuleEdit(store: StoredShape, bundled: Module[], module: Module): StoredShape {
  const original = bundled.find((item) => item.id === module.id);
  if (original) {
    const overrides = { ...store.overrides };
    if (sameContent(module, original)) delete overrides[module.id];
    else overrides[module.id] = module;
    return { ...store, overrides };
  }
  const existing = store.imported[module.id];
  if (!existing) {
    return {
      ...store,
      imported: {
        ...store.imported,
        [module.id]: { original: clone(module), current: module },
      },
    };
  }
  return {
    ...store,
    imported: {
      ...store.imported,
      [module.id]: { original: existing.original, current: module },
    },
  };
}

export function resetModuleState(store: StoredShape, bundled: Module[], id: string): StoredShape {
  if (bundled.some((module) => module.id === id)) {
    const overrides = { ...store.overrides };
    delete overrides[id];
    return { ...store, overrides };
  }
  const existing = store.imported[id];
  if (!existing) return store;
  return {
    ...store,
    imported: {
      ...store.imported,
      [id]: { ...existing, current: clone(existing.original) },
    },
  };
}

export function deleteModuleState(store: StoredShape, bundled: Module[], id: string): StoredShape {
  const games: Record<string, GameState> = { ...store.games };
  delete games[id];
  if (bundled.some((module) => module.id === id)) {
    const overrides = { ...store.overrides };
    delete overrides[id];
    const hiddenBundled = store.hiddenBundled.includes(id)
      ? store.hiddenBundled
      : [...store.hiddenBundled, id];
    return { ...store, overrides, hiddenBundled, games };
  }
  const imported = { ...store.imported };
  delete imported[id];
  return { ...store, imported, games };
}

export function restoreBundledState(store: StoredShape, id: string): StoredShape {
  return { ...store, hiddenBundled: store.hiddenBundled.filter((item) => item !== id) };
}

export function duplicateModuleState(
  store: StoredShape,
  bundled: Module[],
  source: Module,
): { store: StoredShape; id: string } {
  const id = uniqueModuleId(`${source.id}-copy`, (candidate) => isIdTaken(store, bundled, candidate));
  const copy = withId(clone(source), id);
  copy.title = `${source.title} copy`;
  copy.version = 1;
  return {
    id,
    store: {
      ...store,
      imported: {
        ...store.imported,
        [id]: { original: clone(copy), current: copy },
      },
    },
  };
}

export function importModuleList(
  store: StoredShape,
  bundled: Module[],
  modules: Module[],
  mode: 'replace' | 'copy',
): { store: StoredShape; ids: string[] } {
  let next = store;
  const ids: string[] = [];
  for (const incoming of modules) {
    let module = clone(incoming);
    const taken = isIdTaken(next, bundled, module.id);
    if (taken && mode === 'copy') {
      const id = uniqueModuleId(module.id, (candidate) => isIdTaken(next, bundled, candidate));
      module = withId(module, id);
    }
    if (bundled.some((item) => item.id === module.id)) {
      const original = bundled.find((item) => item.id === module.id);
      const overrides = { ...next.overrides };
      if (original && sameContent(module, original)) delete overrides[module.id];
      else overrides[module.id] = module;
      const hiddenBundled = next.hiddenBundled.filter((id) => id !== module.id);
      next = { ...next, overrides, hiddenBundled };
    } else {
      next = {
        ...next,
        imported: {
          ...next.imported,
          [module.id]: { original: clone(module), current: module },
        },
      };
    }
    ids.push(module.id);
  }
  return { store: next, ids };
}
