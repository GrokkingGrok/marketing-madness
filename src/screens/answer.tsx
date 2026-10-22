import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { findClue, updateClue } from '../lib/content.ts';
import { deriveTheme, themeVars } from '../lib/theme.ts';
import { go } from '../router.ts';
import { useEscape, useSpace } from '../hooks/use-keys.ts';
import { useApp } from '../state/app-state.tsx';
import { AnswerStack } from '../components/answer-stack.tsx';
import { BackToGameboard } from '../components/back-to-board.tsx';
import { DocumentTitle } from '../components/document-title.tsx';
import { Button } from '../components/ui/button.tsx';
import { Input } from '../components/ui/input.tsx';
import { MissingClue, MissingModule } from './missing.tsx';

export function AnswerScreen({ moduleId, clueId }: { moduleId: string; clueId: string }) {
  const app = useApp();
  const resolved = app.getModule(moduleId);
  const found = resolved ? findClue(resolved.current, clueId) : null;
  const [editing, setEditing] = useState(false);
  const [drafts, setDrafts] = useState<string[]>(found?.answers.length ? found.answers : ['']);

  function advance() {
    go({ name: 'points', moduleId, clueId });
  }
  function back() {
    go({ name: 'question', moduleId, clueId });
  }

  useEscape(() => {
    if (editing) {
      setDrafts(found?.answers.length ? found.answers : ['']);
      setEditing(false);
      return;
    }
    back();
  });
  useSpace(advance, !editing);

  if (!resolved) return <MissingModule />;
  if (!found) return <MissingClue moduleId={moduleId} />;
  const theme = deriveTheme(resolved.current.accentColor);

  return (
    <div className="stage stage-answer" style={themeVars(theme)} data-screen="answer" onClick={() => { if (!editing) advance(); }}>
      <DocumentTitle title={`${found.categoryName} answer`} />
      <header className="stage-bar">
        <div>
          <p className="eyebrow">{found.categoryName}</p>
          <h1>{found.points} points</h1>
        </div>
        <div className="stage-actions" onClick={(event) => event.stopPropagation()}>
          <BackToGameboard moduleId={moduleId} variant="outline" />
          <Button
            variant="onAccent"
            onClick={() => {
              setDrafts(found.answers.length ? found.answers : ['']);
              setEditing(true);
            }}
          >
            Edit
          </Button>
          <Button variant="onAccent" onClick={back}>
            Back
          </Button>
        </div>
      </header>
      <div className="stage-body">
        {editing ? (
          <form
            className="editor editor-on-accent"
            onClick={(event) => event.stopPropagation()}
            onSubmit={(event) => {
              event.preventDefault();
              const answers = drafts.map((answer) => answer.trim()).filter(Boolean);
              app.updateModule(
                updateClue(resolved.current, clueId, { answers: answers.length ? answers : [''] }),
                'Answers saved',
              );
              setEditing(false);
            }}
          >
            <p className="field-label">Accepted answers</p>
            <ul className="answer-editor">
              {drafts.map((answer, index) => (
                <li key={index}>
                  <Input
                    aria-label={index === 0 ? 'Primary answer' : `Alternate answer ${index + 1}`}
                    value={answer}
                    onChange={(event) =>
                      setDrafts((current) => current.map((item, itemIndex) => (itemIndex === index ? event.target.value : item)))
                    }
                    autoFocus={index === 0}
                  />
                  <button
                    type="button"
                    className="icon-btn"
                    aria-label="Remove this alternate"
                    disabled={drafts.length === 1}
                    onClick={() => setDrafts((current) => (current.length === 1 ? [''] : current.filter((_, itemIndex) => itemIndex !== index)))}
                  >
                    <X size={16} />
                  </button>
                </li>
              ))}
            </ul>
            <Button type="button" variant="outline" onClick={() => setDrafts((current) => [...current, ''])}>
              <Plus size={16} /> Add alternate
            </Button>
            <div className="dialog-actions">
              <Button
                variant="outline"
                onClick={() => {
                  setDrafts(found.answers.length ? found.answers : ['']);
                  setEditing(false);
                }}
              >
                Cancel
              </Button>
              <Button type="submit">Save</Button>
            </div>
          </form>
        ) : (
          <AnswerStack answers={found.answers} />
        )}
      </div>
      {editing ? null : (
        <footer className="stage-foot">
          <button type="button" className="advance advance-on-accent" onClick={(event) => { event.stopPropagation(); advance(); }}>
            Score this clue
          </button>
          <p>Click anywhere or press space</p>
        </footer>
      )}
    </div>
  );
}
