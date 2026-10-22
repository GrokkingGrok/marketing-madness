/** Straighten quotes, keep ™, and tidy spacing left over from the FileMaker export. */
export function normalizeQuotes(input: string): string {
  return input
    .replace(/[\u2018\u2019\u2032\u0060]/g, "'")
    .replace(/[\u201C\u201D\u2033]/g, '"')
    .replace(/\u00A0/g, ' ');
}

export function normalizeProse(input: string): string {
  return normalizeQuotes(input)
    .replace(/\u000b/g, ' ')
    .replace(/\r\n|\r|\n/g, ' ')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\s+,/g, ',')
    .replace(/,(\S)/g, ', $1')
    .trim();
}

/**
 * Split a FileMaker answer field into accepted wordings.
 * Line breaks inside the original field were exported as vertical tabs, or
 * lost entirely so alternates ran together (`Generic Brandsor Generic`).
 * Separators are a line that is just "or", the phrase "also known as",
 * and "or" used as its own word. "or" inside parentheses stays put
 * (`Charge Account (Regular or Thirty-Day)` is one answer).
 */
export function splitAnswers(raw: string): string[] {
  let text = normalizeQuotes(raw).replace(/\u000b/g, '\n').replace(/\r\n|\r/g, '\n');

  const saved: string[] = [];
  text = text.replace(/\([^()\n]*\)/g, (match) => {
    saved.push(match);
    return `\u0002${saved.length - 1}\u0002`;
  });

  text = text.replace(/[ \t]{2,}/g, ' ');
  text = text.replace(/[ \t]*\n[ \t]*/g, '\n');
  text = text.replace(/\s*also known as\s*/gi, '\n');
  text = text.replace(/^\s*or\s*$/gim, '\n');
  text = text.replace(/\s+or\s+/gi, '\n');
  // "AccountsorNinety" — "or" glued to the next capital with no space.
  text = text.replace(/(?<=\p{L})or(?=\p{Lu})/gu, '\n');
  // "Brandsor Generic" — "or" glued to the previous word, then a space.
  // Real words that end in "or" (Distributor Brand) stay intact.
  text = splitGluedOr(text);

  text = text.replace(/\u0002(\d+)\u0002/g, (_match, index: string) => saved[Number(index)] ?? '');

  const parts = text
    .split('\n')
    .map((part) => part.replace(/[ \t]{2,}/g, ' ').trim())
    .filter((part) => part.length > 0 && !/^or$/i.test(part) && !/^also known as$/i.test(part));

  const merged: string[] = [];
  for (const part of parts) {
    if (merged.length > 0 && /^\(.*\)$/.test(part)) {
      merged[merged.length - 1] = `${merged[merged.length - 1]} ${part}`.replace(/[ \t]{2,}/g, ' ').trim();
    } else {
      merged.push(part);
    }
  }

  if (merged.length > 0) return merged;
  const fallback = normalizeProse(raw);
  return fallback ? [fallback] : [''];
}

export function formatAnswerList(answers: string[]): string {
  return answers.map((answer) => answer.trim()).filter(Boolean).join(' or ');
}

/** Words that really end in "or", so "Distributor Brand" is not an alternate split. */
const OR_WORDS = new Set([
  'advisor', 'ambassador', 'author', 'bachelor', 'behavior', 'behaviour', 'calculator',
  'collaborator', 'color', 'colour', 'commentator', 'competitor', 'contractor',
  'coordinator', 'counselor', 'counsellor', 'creditor', 'curator', 'debtor', 'decorator',
  'dictator', 'director', 'distributor', 'doctor', 'donor', 'editor', 'educator', 'error',
  'exterior', 'facilitator', 'factor', 'favor', 'flavor', 'flavour', 'for', 'generator',
  'governor', 'harbor', 'harbour', 'honor', 'honour', 'horror', 'indicator', 'inferior',
  'innovator', 'inspector', 'instructor', 'interior', 'inventor', 'investigator', 'junior',
  'major', 'mayor', 'minor', 'mirror', 'moderator', 'monitor', 'motor', 'navigator',
  'neighbor', 'neighbour', 'nor', 'operator', 'originator', 'predecessor', 'prior',
  'professor', 'regulator', 'sailor', 'sector', 'senator', 'senior', 'sensor', 'spectator',
  'sponsor', 'successor', 'superior', 'supervisor', 'tailor', 'terror', 'vector', 'vendor',
  'visitor', 'warrior',
]);

function splitGluedOr(text: string): string {
  return text.replace(/(?<=\p{L})or(?=\s+\p{Lu})/gu, (match, offset: number, whole: string) => {
    let start = offset;
    while (start > 0 && /\p{L}/u.test(whole.charAt(start - 1))) start -= 1;
    const word = whole.slice(start, offset + match.length).toLowerCase();
    return OR_WORDS.has(word) ? match : '\n';
  });
}
