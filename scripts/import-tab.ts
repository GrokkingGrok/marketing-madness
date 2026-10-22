import { readFileSync, writeFileSync } from 'node:fs';
import { moduleFromTab } from '../src/lib/import-tab.ts';

function readFlag(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  if (index < 0) return undefined;
  return process.argv[index + 1];
}

function readRepeated(name: string): string[] {
  const values: string[] = [];
  for (let i = 0; i < process.argv.length; i += 1) {
    if (process.argv[i] === name && process.argv[i + 1]) values.push(process.argv[i + 1] ?? '');
  }
  return values;
}

const file = process.argv[2];
if (!file || file.startsWith('--')) {
  console.error(
    'Usage: tsx scripts/import-tab.ts <file.tab> --title "Title" --id slug --color "#007300" --category "Name" --category "Name" --category "Name" --category "Name" --category "Name" --out modules/name.json',
  );
  process.exit(1);
}

const title = readFlag('--title');
const color = readFlag('--color') ?? '#007300';
const id = readFlag('--id');
const out = readFlag('--out');
const categories = readRepeated('--category');

if (!title || !out || categories.length !== 5) {
  console.error('Need --title, --out, and exactly five --category names.');
  process.exit(1);
}

try {
  const raw = readFileSync(file, 'utf8');
  const module = moduleFromTab(raw, { id, title, accentColor: color, categoryNames: categories });
  writeFileSync(out, `${JSON.stringify(module, null, 2)}\n`);
  console.log(`Wrote ${module.id} (${module.categories.length * 10} clues) to ${out}`);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
