import { useState } from 'react';
import { findClue } from '../lib/content.ts';
import { deriveTheme, themeVars } from '../lib/theme.ts';
import { go } from '../router.ts';
import { useEscape } from '../hooks/use-keys.ts';
import { useApp } from '../state/app-state.tsx';
import { BackToGameboard } from '../components/back-to-board.tsx';
import { DocumentTitle } from '../components/document-title.tsx';
import { NewGameButton } from '../components/new-game-button.tsx';
import { Button } from '../components/ui/button.tsx';
import { Input } from '../components/ui/input.tsx';
import { MissingClue, MissingModule } from './missing.tsx';

export function PointsScreen({ moduleId, clueId }: { moduleId: string; clueId: string }) {
  const app = useApp();
  const resolved = app.getModule(moduleId);
  const found = resolved ? findClue(resolved.current, clueId) : null;
  const [editingNames, setEditingNames] = useState(false);
  const game = app.gameFor(moduleId);
  const alreadyUsed = game.used.includes(clueId);

  useEscape(() => go({ name: 'answer', moduleId, clueId }));

  if (!resolved) return <MissingModule />;
  if (!found) return <MissingClue moduleId={moduleId} />;
  const theme = deriveTheme(resolved.current.accentColor);

  function writePlayers(recipe: (players: typeof game.players) => typeof game.players) {
    app.patchGame(moduleId, (current) => ({ ...current, players: recipe(current.players) }));
  }

  function markPlayed() {
    app.patchGame(moduleId, (current) => ({
      ...current,
      used: current.used.includes(clueId) ? current.used : [...current.used, clueId],
    }));
  }

  return (
    <div className="page points-page" style={themeVars(theme)} data-screen="points">
      <DocumentTitle title={`${found.categoryName} for ${found.points} Points`} />
      <header className="points-head">
        <BackToGameboard moduleId={moduleId} onClick={markPlayed} />
        <p className="eyebrow">{resolved.current.title}</p>
        <h1>
          {found.categoryName} for {found.points} Points
        </h1>
        <p className="answer-reminder">{found.answers.filter(Boolean).join('  or  ')}</p>
        {alreadyUsed ? <p className="quiet">This clue is already marked played. Scoring again changes the totals a second time.</p> : null}
      </header>
      <div className={`player-grid ${game.players.length > 10 ? 'dense' : ''}`}>
        {game.players.map((player, index) => (
          <article key={index} className="player-card">
            {editingNames ? (
              <Input
                aria-label={`Name for player ${index + 1}`}
                value={player.name}
                maxLength={40}
                onChange={(event) => {
                  const name = event.target.value;
                  writePlayers((players) => players.map((item, itemIndex) => (itemIndex === index ? { ...item, name } : item)));
                }}
              />
            ) : (
              <h2>{player.name}</h2>
            )}
            <p className={`score-num ${player.score < 0 ? 'down' : ''} ${player.score > 0 ? 'up' : ''}`}>{player.score}</p>
            <div className="score-actions">
              <button
                type="button"
                className="score-btn minus"
                aria-label={`Subtract ${found.points} from ${player.name}`}
                onClick={() =>
                  writePlayers((players) =>
                    players.map((item, itemIndex) =>
                      itemIndex === index ? { ...item, score: item.score - found.points } : item,
                    ),
                  )
                }
              >
                −{found.points}
              </button>
              <button
                type="button"
                className="score-btn plus"
                aria-label={`Add ${found.points} to ${player.name}`}
                onClick={() =>
                  writePlayers((players) =>
                    players.map((item, itemIndex) =>
                      itemIndex === index ? { ...item, score: item.score + found.points } : item,
                    ),
                  )
                }
              >
                +{found.points}
              </button>
            </div>
            <label className="score-set">
              Score
              <input
                type="number"
                aria-label={`${player.name} score`}
                value={player.score}
                onChange={(event) => {
                  const value = event.target.valueAsNumber;
                  if (!Number.isFinite(value)) return;
                  writePlayers((players) =>
                    players.map((item, itemIndex) =>
                      itemIndex === index ? { ...item, score: Math.round(value) } : item,
                    ),
                  );
                }}
              />
            </label>
          </article>
        ))}
      </div>
      <footer className="points-foot">
        <BackToGameboard moduleId={moduleId} onClick={markPlayed} />
        <Button variant="outline" onClick={() => setEditingNames((value) => !value)}>
          {editingNames ? 'Done editing names' : 'Edit names'}
        </Button>
        <NewGameButton moduleId={moduleId} />
      </footer>
    </div>
  );
}
