import { useState } from 'react';
import { findClue, updateClue } from '../lib/content.ts';
import { deriveTheme, themeVars } from '../lib/theme.ts';
import { go } from '../router.ts';
import { useEscape, useSpace } from '../hooks/use-keys.ts';
import { useApp } from '../state/app-state.tsx';
import { DocumentTitle } from '../components/document-title.tsx';
import { QuestionText } from '../components/question-text.tsx';
import { Button } from '../components/ui/button.tsx';
import { Textarea } from '../components/ui/input.tsx';
import { MissingClue, MissingModule } from './missing.tsx';

export function QuestionScreen({ moduleId, clueId }: { moduleId: string; clueId: string }) {
  const app = useApp();
  const resolved = app.getModule(moduleId);
  const found = resolved ? findClue(resolved.current, clueId) : null;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(found?.question ?? '');

  function advance() {
    go({ name: 'answer', moduleId, clueId });
  }
  function back() {
    go({ name: 'board', moduleId });
  }

  useEscape(() => {
    if (editing) {
      setDraft(found?.question ?? '');
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
    <div className="stage stage-question" style={themeVars(theme)} data-screen="question" onClick={() => { if (!editing) advance(); }}>
      <DocumentTitle title={`${found.categoryName} for ${found.points}`} />
      <header className="stage-bar">
        <div>
          <p className="eyebrow">{resolved.current.title}</p>
          <h1>{found.categoryName}</h1>
        </div>
        <p className="points-pill">{found.points}</p>
        <div className="stage-actions" onClick={(event) => event.stopPropagation()}>
          <Button variant="outline" onClick={() => { setDraft(found.question); setEditing(true); }}>
            Edit
          </Button>
          <Button variant="ghost" onClick={back}>
            Back
          </Button>
        </div>
      </header>
      <div className="stage-body">
        {editing ? (
          <form
            className="editor"
            onClick={(event) => event.stopPropagation()}
            onSubmit={(event) => {
              event.preventDefault();
              app.updateModule(updateClue(resolved.current, clueId, { question: draft }), 'Question saved');
              setEditing(false);
            }}
          >
            <label className="field-label" htmlFor="question-edit">Question</label>
            <Textarea id="question-edit" value={draft} onChange={(event) => setDraft(event.target.value)} rows={6} autoFocus />
            <div className="dialog-actions">
              <Button variant="outline" onClick={() => { setDraft(found.question); setEditing(false); }}>Cancel</Button>
              <Button type="submit">Save</Button>
            </div>
          </form>
        ) : (
          <QuestionText text={found.question} />
        )}
      </div>
      {editing ? null : (
        <footer className="stage-foot">
          <button type="button" className="advance" onClick={(event) => { event.stopPropagation(); advance(); }}>
            Reveal the answer
          </button>
          <p>Click anywhere or press space</p>
        </footer>
      )}
    </div>
  );
}
