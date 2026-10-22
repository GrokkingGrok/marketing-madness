import { ChevronDown, ChevronUp, Plus, Trash } from 'lucide-react';
import { useState } from 'react';
import { movePlayer, resizePlayers } from '../lib/game.ts';
import { deriveTheme, themeVars } from '../lib/theme.ts';
import { go } from '../router.ts';
import { useEscape } from '../hooks/use-keys.ts';
import { useApp } from '../state/app-state.tsx';
import { ConfirmDialog } from '../components/confirm-dialog.tsx';
import { DocumentTitle } from '../components/document-title.tsx';
import { PlayHeader } from '../components/play-header.tsx';
import { Button } from '../components/ui/button.tsx';
import { Input } from '../components/ui/input.tsx';
import { MissingModule } from './missing.tsx';

export function PlayersScreen({ moduleId }: { moduleId: string }) {
  const app = useApp();
  const resolved = app.getModule(moduleId);
  const [confirmTrim, setConfirmTrim] = useState<number | null>(null);
  const [removeIndex, setRemoveIndex] = useState<number | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const game = app.gameFor(moduleId);

  useEscape(() => go({ name: 'board', moduleId }));

  if (!resolved) return <MissingModule />;
  const theme = deriveTheme(resolved.current.accentColor);

  function save(players: typeof game.players) {
    app.patchGame(moduleId, (current) => ({ ...current, players }));
  }

  function setCount(count: number) {
    const next = resizePlayers(game.players, count);
    if (next.length < game.players.length && game.players.slice(next.length).some((player) => player.score !== 0)) {
      setConfirmTrim(count);
      return;
    }
    save(next);
  }

  return (
    <div className="page" style={themeVars(theme)} data-screen="players">
      <DocumentTitle title={`Players · ${resolved.current.title}`} />
      <PlayHeader module={resolved.current} edited={resolved.edited} backToBoard />
      <div className="board-heading">
        <div>
          <h1>Players & Scores</h1>
          <p className="quiet">Up to 20 players or teams. Names and scores stay with this module until you start a new game.</p>
        </div>
      </div>
      <div className="player-tools">
        <label>
          How many
          <input
            type="number"
            min={1}
            max={20}
            value={game.players.length}
            onChange={(event) => {
              const count = event.target.valueAsNumber;
              if (Number.isFinite(count)) setCount(count);
            }}
          />
        </label>
        <Button variant="outline" disabled={game.players.length >= 20} onClick={() => setCount(game.players.length + 1)}>
          <Plus size={16} /> Add player
        </Button>
        <Button variant="outline" onClick={() => setCount(20)}>
          Use 20 players
        </Button>
        <Button variant="ghost" onClick={() => setConfirmReset(true)}>
          Reset scores
        </Button>
      </div>
      <ol className="roster">
        {game.players.map((player, index) => (
          <li key={index}>
            <span className="rank">{index + 1}</span>
            <Input
              aria-label={`Player ${index + 1} name`}
              value={player.name}
              maxLength={40}
              onChange={(event) =>
                save(game.players.map((item, itemIndex) => (itemIndex === index ? { ...item, name: event.target.value } : item)))
              }
            />
            <label className="score-set">
              Score
              <input
                type="number"
                aria-label={`${player.name} score`}
                value={player.score}
                onChange={(event) => {
                  const value = event.target.valueAsNumber;
                  if (!Number.isFinite(value)) return;
                  save(game.players.map((item, itemIndex) => (itemIndex === index ? { ...item, score: Math.round(value) } : item)));
                }}
              />
            </label>
            <button type="button" className="icon-btn" aria-label="Move up" disabled={index === 0} onClick={() => save(movePlayer(game.players, index, -1))}>
              <ChevronUp size={16} />
            </button>
            <button
              type="button"
              className="icon-btn"
              aria-label="Move down"
              disabled={index === game.players.length - 1}
              onClick={() => save(movePlayer(game.players, index, 1))}
            >
              <ChevronDown size={16} />
            </button>
            <button
              type="button"
              className="icon-btn"
              aria-label={`Remove ${player.name}`}
              disabled={game.players.length === 1}
              onClick={() => {
                if (player.score !== 0) setRemoveIndex(index);
                else save(game.players.filter((_, itemIndex) => itemIndex !== index));
              }}
            >
              <Trash size={16} />
            </button>
          </li>
        ))}
      </ol>
      <ConfirmDialog
        open={confirmTrim !== null}
        title="Remove players who have points?"
        description="Players at the end of the list will be removed, including any score they have."
        confirmLabel="Remove"
        tone="danger"
        onConfirm={() => {
          if (confirmTrim !== null) save(resizePlayers(game.players, confirmTrim));
          setConfirmTrim(null);
        }}
        onClose={() => setConfirmTrim(null)}
      />
      <ConfirmDialog
        open={removeIndex !== null}
        title="Remove this player?"
        description="Their score goes with them. This does not change the other teams."
        confirmLabel="Remove"
        tone="danger"
        onConfirm={() => {
          if (removeIndex !== null) save(game.players.filter((_, itemIndex) => itemIndex !== removeIndex));
          setRemoveIndex(null);
        }}
        onClose={() => setRemoveIndex(null)}
      />
      <ConfirmDialog
        open={confirmReset}
        title="Reset every score to zero?"
        description="Names and played tiles stay. New Game clears the tiles too."
        confirmLabel="Reset scores"
        onConfirm={() => {
          save(game.players.map((player) => ({ ...player, score: 0 })));
          setConfirmReset(false);
        }}
        onClose={() => setConfirmReset(false)}
      />
    </div>
  );
}
