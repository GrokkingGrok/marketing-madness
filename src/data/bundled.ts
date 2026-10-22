import type { Module } from '../types.ts';

const loaded = import.meta.glob('../../modules/*.json', {
  eager: true,
  import: 'default',
}) as Record<string, Module>;

/** Every JSON file in /modules ships with the app. Adding one needs no other code change. */
export const bundledModules: Module[] = Object.entries(loaded)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([, module]) => module);
