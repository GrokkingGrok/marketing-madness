export type Route =
  | { name: 'home' }
  | { name: 'new'; mode: 'choose' | 'import' }
  | { name: 'board'; moduleId: string }
  | { name: 'question'; moduleId: string; clueId: string }
  | { name: 'answer'; moduleId: string; clueId: string }
  | { name: 'points'; moduleId: string; clueId: string }
  | { name: 'players'; moduleId: string }
  | { name: 'print'; moduleId: string }
  | { name: 'help'; moduleId: string };

function decodePart(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export function parseHash(hash: string): Route {
  const parts = hash.replace(/^#/, '').replace(/^\//, '').split('/').filter(Boolean).map(decodePart);
  if (parts.length === 0) return { name: 'home' };
  if (parts[0] === 'new') return { name: 'new', mode: parts[1] === 'import' ? 'import' : 'choose' };
  if (parts[0] === 'm' && parts[1]) {
    const moduleId = parts[1];
    const section = parts[2];
    if (!section) return { name: 'board', moduleId };
    if (section === 'q' && parts[3]) return { name: 'question', moduleId, clueId: parts[3] };
    if (section === 'a' && parts[3]) return { name: 'answer', moduleId, clueId: parts[3] };
    if (section === 'points' && parts[3]) return { name: 'points', moduleId, clueId: parts[3] };
    if (section === 'players') return { name: 'players', moduleId };
    if (section === 'print') return { name: 'print', moduleId };
    if (section === 'help') return { name: 'help', moduleId };
  }
  return { name: 'home' };
}

export function href(route: Route): string {
  switch (route.name) {
    case 'home':
      return '#/';
    case 'new':
      return route.mode === 'import' ? '#/new/import' : '#/new';
    case 'board':
      return `#/m/${encodeURIComponent(route.moduleId)}`;
    case 'question':
      return `#/m/${encodeURIComponent(route.moduleId)}/q/${encodeURIComponent(route.clueId)}`;
    case 'answer':
      return `#/m/${encodeURIComponent(route.moduleId)}/a/${encodeURIComponent(route.clueId)}`;
    case 'points':
      return `#/m/${encodeURIComponent(route.moduleId)}/points/${encodeURIComponent(route.clueId)}`;
    case 'players':
      return `#/m/${encodeURIComponent(route.moduleId)}/players`;
    case 'print':
      return `#/m/${encodeURIComponent(route.moduleId)}/print`;
    case 'help':
      return `#/m/${encodeURIComponent(route.moduleId)}/help`;
  }
}

export function go(route: Route): void {
  const next = href(route);
  if (window.location.hash !== next) window.location.hash = next;
}
