import { useEffect, useRef, useState } from 'react';
import { Pencil } from 'lucide-react';
import { updateCategoryName } from '../lib/content.ts';
import { inProgress } from '../lib/game.ts';
import { themeVars, deriveTheme } from '../lib/theme.ts';
import { go, href } from '../router.ts';
import { useApp } from '../state/app-state.tsx';
import { pointsForIndex, type Module } from '../types.ts';
import { DocumentTitle } from '../components/document-title.tsx';
import { PlayHeader } from '../components/play-header.tsx';
import { MissingModule } from './missing.tsx';

export function BoardScreen({ moduleId }: { moduleId: string }) {
  const app = useApp();
  const resolved = app.getModule(moduleId);
  if (!resolved) return <MissingModule />;
  return <Board key={moduleId} module={resolved.current} edited={resolved.edited} />;
}

function Board({ module, edited }: { module: Module; edited: boolean }) {
  const app = useApp();
  const game = app.gameFor(module.id);
  const theme = deriveTheme(module.accentColor);
  const [cursor, setCursor] = useState({ row: 0, col: 0 });
  const [editing, setEditing] = useState<number | null>(null);
  const [draft, setDraft] = useState('');
  const keyboard = useRef(false);
  const cancelEdit = useRef(false);
  const tiles = useRef(new Map<string, HTMLButtonElement>());
  const cursorRef = useRef(cursor);
  const moduleRef = useRef(module);
  cursorRef.current = cursor;
  moduleRef.current = module;

  function openAt(row: number, col: number) {
    const current = moduleRef.current;
    const clue = current.categories[row]?.clues[col];
    if (!clue) return;
    go({ name: 'question', moduleId: current.id, clueId: clue.id });
  }

  useEffect(() => {
    if (!keyboard.current) return;
    tiles.current.get(`${cursor.row}:${cursor.col}`)?.focus();
  }, [cursor]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (editing !== null) return;
      const target = event.target;
      if (target instanceof HTMLElement) {
        const tag = target.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || target.isContentEditable) return;
        if (target.closest('[role="menu"], [role="dialog"]')) return;
      }
      if (document.querySelector('[role="dialog"]')) return;
      if (event.key === 'Escape') {
        go({ name: 'home' });
        return;
      }
      if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter'].includes(event.key)) return;
      event.preventDefault();
      keyboard.current = true;
      const current = cursorRef.current;
      if (event.key === 'Enter') {
        openAt(current.row, current.col);
        return;
      }
      setCursor((pos) => {
        if (event.key === 'ArrowUp') return { row: Math.max(0, pos.row - 1), col: pos.col };
        if (event.key === 'ArrowDown') return { row: Math.min(module.categories.length - 1, pos.row + 1), col: pos.col };
        if (event.key === 'ArrowLeft') return { row: pos.row, col: Math.max(0, pos.col - 1) };
        return { row: pos.row, col: Math.min(9, pos.col + 1) };
      });
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [editing]);

  function commitName(index: number) {
    if (cancelEdit.current) {
      cancelEdit.current = false;
      return;
    }
    const name = draft.trim();
    const category = module.categories[index];
    if (category && name && name !== category.name) {
      app.updateModule(updateCategoryName(module, index, name), 'Category name saved');
    }
    setEditing(null);
  }

  const ranked = game.players
    .map((player, index) => ({ ...player, index }))
    .sort((a, b) => b.score - a.score || a.index - b.index);
  const leaders = ranked.slice(0, game.players.length > 5 ? 4 : game.players.length);
  const played = module.categories.reduce(
    (sum, category) => sum + category.clues.filter((clue) => game.used.includes(clue.id)).length,
    0,
  );

  return (
    <div className="page" style={themeVars(theme)} data-screen="board">
      <DocumentTitle title={module.title} />
      <PlayHeader module={module} edited={edited} />
      <div className="board-heading">
        <div>
          <h1>
            {module.title}
            {edited ? <span className="badge">Edited</span> : null}
          </h1>
          <p className="quiet">
            {played} of 50 played
            {inProgress(app.persistedGame(module.id)) ? ' · game in progress' : ''}
            {' · '}
            Arrows move, Enter opens, Esc goes home
          </p>
        </div>
      </div>
      <ol className="score-strip">
        {leaders.map((player, rank) => (
          <li key={`${player.name}-${player.index}`}>
            <span className="rank">{rank + 1}</span>
            <span className="who">{player.name}</span>
            <strong>{player.score}</strong>
          </li>
        ))}
        {game.players.length > leaders.length ? (
          <li>
            <a href={href({ name: 'players', moduleId: module.id })}>All {game.players.length} scores</a>
          </li>
        ) : null}
      </ol>
      <div className="board" role="grid" aria-label={`${module.title} board`}>
        {module.categories.map((category, row) => (
          <div className="board-row" role="row" key={category.id}>
            <div className="cat-cell" role="rowheader">
              {editing === row ? (
                <input
                  className="field"
                  value={draft}
                  autoFocus
                  aria-label={`Category ${row + 1} name`}
                  onChange={(event) => setDraft(event.target.value)}
                  onBlur={() => commitName(row)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      event.currentTarget.blur();
                    }
                    if (event.key === 'Escape') {
                      event.preventDefault();
                      cancelEdit.current = true;
                      setEditing(null);
                    }
                  }}
                />
              ) : (
                <button
                  type="button"
                  className="cat-name"
                  onDoubleClick={() => {
                    setDraft(category.name);
                    setEditing(row);
                  }}
                >
                  {category.name}
                </button>
              )}
              <button
                type="button"
                className="icon-btn"
                aria-label={`Edit ${category.name}`}
                onClick={() => {
                  setDraft(category.name);
                  setEditing(row);
                }}
              >
                <Pencil size={16} />
              </button>
            </div>
            <div className="tile-row">
              {category.clues.map((clue, col) => {
                const points = pointsForIndex(col);
                const used = game.used.includes(clue.id);
                const active = cursor.row === row && cursor.col === col;
                return (
                  <button
                    key={clue.id}
                    type="button"
                    role="gridcell"
                    className="tile"
                    data-used={used ? 'true' : 'false'}
                    tabIndex={active ? 0 : -1}
                    aria-label={`${category.name}, ${points} points${used ? ', already played' : ''}`}
                    ref={(node) => {
                      if (node) tiles.current.set(`${row}:${col}`, node);
                      else tiles.current.delete(`${row}:${col}`);
                    }}
                    onClick={() => {
                      setCursor({ row, col });
                      openAt(row, col);
                    }}
                  >
                    {points}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <p className="quiet board-foot">Dimmed tiles can be opened again. Double-click a category, or use the pencil, to rename it.</p>
    </div>
  );
}
