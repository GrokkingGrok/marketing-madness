import { useMemo, useState } from 'react';
import { ImportError, moduleFromTab, sniffImport } from '../lib/import-tab.ts';
import { blankModule, slugify, uniqueModuleId, withId } from '../lib/ids.ts';
import { parseHex } from '../lib/theme.ts';
import { go, href } from '../router.ts';
import { useApp } from '../state/app-state.tsx';
import { CATEGORY_COUNT, pointsForIndex, type Module } from '../types.ts';
import { DocumentTitle } from '../components/document-title.tsx';
import { Button } from '../components/ui/button.tsx';
import { Input, Label } from '../components/ui/input.tsx';

const EMPTY_NAMES = ['', '', '', '', ''];

export function WizardScreen({ mode }: { mode: 'choose' | 'import' }) {
  const app = useApp();
  const [step, setStep] = useState<'choose' | 'blank' | 'file' | 'tab-meta' | 'tab-review' | 'json-review'>(
    mode === 'import' ? 'file' : 'choose',
  );
  const [title, setTitle] = useState('');
  const [color, setColor] = useState('#007300');
  const [names, setNames] = useState<string[]>(EMPTY_NAMES);
  const [blankNames, setBlankNames] = useState(['Category 1', 'Category 2', 'Category 3', 'Category 4', 'Category 5']);
  const [tabText, setTabText] = useState('');
  const [fileLabel, setFileLabel] = useState('');
  const [draft, setDraft] = useState<Module | null>(null);
  const [jsonModules, setJsonModules] = useState<Module[]>([]);
  const [error, setError] = useState<string | null>(null);

  const colorOk = parseHex(color) !== null;
  const namesReady = names.every((name) => name.trim().length > 0);
  const alternates = useMemo(
    () => draft?.categories.reduce((sum, category) => sum + category.clues.filter((clue) => clue.answers.length > 1).length, 0) ?? 0,
    [draft],
  );

  async function takeFile(file: File) {
    setError(null);
    const text = await file.text();
    setFileLabel(file.name);
    try {
      const sniffed = sniffImport(file.name, text);
      if (sniffed.kind === 'json') {
        setJsonModules(sniffed.modules);
        setStep('json-review');
        return;
      }
      setTabText(sniffed.text);
      setStep('tab-meta');
    } catch (err) {
      setError(err instanceof ImportError ? err.message : 'That file could not be read.');
    }
  }

  function buildDraft() {
    setError(null);
    try {
      const id = uniqueModuleId(slugify(title), (candidate) => app.idTaken(candidate));
      const module = moduleFromTab(tabText, { id, title, accentColor: color, categoryNames: names });
      setDraft(module);
      setStep('tab-review');
    } catch (err) {
      setError(err instanceof ImportError ? err.message : 'That .tab file could not be imported.');
    }
  }

  function updateDraftAnswer(catIndex: number, clueIndex: number, answerIndex: number, value: string) {
    setDraft((current) => {
      if (!current) return current;
      return {
        ...current,
        categories: current.categories.map((category, ci) =>
          ci === catIndex
            ? {
                ...category,
                clues: category.clues.map((clue, qi) => {
                  if (qi !== clueIndex) return clue;
                  const answers = clue.answers.slice();
                  answers[answerIndex] = value;
                  return { ...clue, answers };
                }),
              }
            : category,
        ),
      };
    });
  }

  function changeAnswerCount(catIndex: number, clueIndex: number, next: string[]) {
    setDraft((current) => {
      if (!current) return current;
      return {
        ...current,
        categories: current.categories.map((category, ci) =>
          ci === catIndex
            ? {
                ...category,
                clues: category.clues.map((clue, qi) => (qi === clueIndex ? { ...clue, answers: next } : clue)),
              }
            : category,
        ),
      };
    });
  }

  function saveDraft() {
    if (!draft) return;
    const cleaned: Module = {
      ...draft,
      accentColor: parseHex(color) ?? draft.accentColor,
      categories: draft.categories.map((category) => ({
        ...category,
        clues: category.clues.map((clue) => {
          const answers = clue.answers.map((answer) => answer.trim()).filter(Boolean);
          return { ...clue, answers: answers.length ? answers : [''] };
        }),
      })),
    };
    const ids = app.importModules([cleaned], 'replace');
    const id = ids[0];
    if (id) go({ name: 'board', moduleId: id });
  }

  function saveBlank() {
    setError(null);
    if (!title.trim()) {
      setError('Give the module a title.');
      return;
    }
    if (!colorOk) {
      setError('Use a hex color like #007300.');
      return;
    }
    let module = blankModule(title, color, blankNames);
    if (app.idTaken(module.id)) module = withId(module, uniqueModuleId(module.id, (candidate) => app.idTaken(candidate)));
    const ids = app.importModules([module], 'replace');
    const id = ids[0];
    if (id) go({ name: 'board', moduleId: id });
  }

  function saveJson(copy: boolean) {
    const ids = app.importModules(jsonModules, copy ? 'copy' : 'replace');
    const id = ids[0];
    if (id) go({ name: 'board', moduleId: id });
  }

  const collisions = jsonModules.filter((module) => app.idTaken(module.id));

  return (
    <div className="page" data-screen="wizard">
      <DocumentTitle title="New module" />
      <header className="home-bar">
        <a className="wordmark" href={href({ name: 'home' })}>Marketing Madness</a>
        <Button variant="ghost" asChild>
          <a href={href({ name: 'home' })}>Home</a>
        </Button>
      </header>
      <div className="wizard">
        <p className="eyebrow">New module</p>
        <h1>{step === 'choose' ? 'How do you want to start?' : 'Add a module'}</h1>
        {error ? <p className="form-error" role="alert">{error}</p> : null}

        {step === 'choose' ? (
          <div className="choice-grid">
            <button type="button" className="choice" onClick={() => setStep('blank')}>
              <h2>Start a blank board</h2>
              <p>Five categories, ten empty clues each. Fill them in on the board.</p>
            </button>
            <button type="button" className="choice" onClick={() => setStep('file')}>
              <h2>Import a .tab or JSON file</h2>
              <p>A FileMaker export, or a module you already saved from this app.</p>
            </button>
          </div>
        ) : null}

        {step === 'blank' ? (
          <form
            className="stack-form"
            onSubmit={(event) => {
              event.preventDefault();
              saveBlank();
            }}
          >
            <Label htmlFor="blank-title">Title</Label>
            <Input id="blank-title" value={title} onChange={(event) => setTitle(event.target.value)} required autoFocus />
            <ColorField color={color} onChange={setColor} />
            <p className="field-label">Category names</p>
            {blankNames.map((name, index) => (
              <Input
                key={index}
                aria-label={`Category ${index + 1}`}
                value={name}
                onChange={(event) => setBlankNames((current) => current.map((item, i) => (i === index ? event.target.value : item)))}
              />
            ))}
            <div className="dialog-actions">
              <Button variant="outline" onClick={() => setStep('choose')}>Back</Button>
              <Button type="submit">Create module</Button>
            </div>
          </form>
        ) : null}

        {step === 'file' ? (
          <div className="stack-form">
            <label
              className="dropzone"
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                const file = event.dataTransfer.files[0];
                if (file) void takeFile(file);
              }}
            >
              <input
                type="file"
                accept=".tab,.json,.txt,text/tab-separated-values,application/json"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void takeFile(file);
                }}
              />
              <strong>Choose a .tab or .json file</strong>
              <span>or drop it here</span>
            </label>
            <Button variant="outline" onClick={() => setStep('choose')}>Back</Button>
          </div>
        ) : null}

        {step === 'tab-meta' ? (
          <form
            className="stack-form"
            onSubmit={(event) => {
              event.preventDefault();
              buildDraft();
            }}
          >
            <p className="quiet">File: {fileLabel}. Category names are not in the export, so type all five.</p>
            <Label htmlFor="tab-title">Title</Label>
            <Input id="tab-title" value={title} onChange={(event) => setTitle(event.target.value)} required autoFocus />
            <ColorField color={color} onChange={setColor} />
            {names.map((name, index) => (
              <div key={index}>
                <Label htmlFor={`cat-${index}`}>Category {index + 1}</Label>
                <Input
                  id={`cat-${index}`}
                  value={name}
                  onChange={(event) => setNames((current) => current.map((item, i) => (i === index ? event.target.value : item)))}
                  required
                />
              </div>
            ))}
            <div className="dialog-actions">
              <Button variant="outline" onClick={() => setStep('file')}>Back</Button>
              <Button type="submit" disabled={!namesReady || !title.trim() || !colorOk}>Review answers</Button>
            </div>
          </form>
        ) : null}

        {step === 'tab-review' && draft ? (
          <div className="stack-form">
            <p>
              {alternates === 0
                ? 'No alternate answers were split out. You can still add some before saving.'
                : `${alternates} ${alternates === 1 ? 'clue has' : 'clues have'} more than one answer. Check that “or” landed in the right place.`}
            </p>
            {draft.categories.map((category, catIndex) => (
              <section key={category.id} className="review-cat">
                <h2>{category.name}</h2>
                {category.clues.map((clue, clueIndex) => (
                  <article key={clue.id} className={clue.answers.length > 1 ? 'review-clue split' : 'review-clue'}>
                    <p className="points-label">{pointsForIndex(clueIndex)} points</p>
                    <p>{clue.question}</p>
                    {clue.answers.map((answer, answerIndex) => (
                      <div className="answer-edit-row" key={answerIndex}>
                        <Input
                          aria-label={`${category.name} ${pointsForIndex(clueIndex)} answer ${answerIndex + 1}`}
                          value={answer}
                          onChange={(event) => updateDraftAnswer(catIndex, clueIndex, answerIndex, event.target.value)}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={clue.answers.length === 1}
                          onClick={() =>
                            changeAnswerCount(
                              catIndex,
                              clueIndex,
                              clue.answers.filter((_, index) => index !== answerIndex),
                            )
                          }
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                    <Button variant="outline" size="sm" onClick={() => changeAnswerCount(catIndex, clueIndex, [...clue.answers, ''])}>
                      Add alternate
                    </Button>
                  </article>
                ))}
              </section>
            ))}
            <div className="dialog-actions sticky-actions">
              <Button variant="outline" onClick={() => setStep('tab-meta')}>Back</Button>
              <Button onClick={saveDraft}>Add module</Button>
            </div>
          </div>
        ) : null}

        {step === 'json-review' ? (
          <div className="stack-form">
            {jsonModules.map((module) => (
              <article key={module.id} className="review-clue">
                <h2>{module.title}</h2>
                <p className="quiet">
                  {module.categories.length === CATEGORY_COUNT ? '5 categories · 50 clues' : 'Check the shape'} · {module.accentColor}
                  {app.idTaken(module.id) ? ` · id “${module.id}” is already on this browser` : ''}
                </p>
                <ul className="cat-pills">
                  {module.categories.map((category) => (
                    <li key={category.id}>{category.name}</li>
                  ))}
                </ul>
              </article>
            ))}
            <div className="dialog-actions">
              <Button variant="outline" onClick={() => setStep('file')}>Back</Button>
              {collisions.length > 0 ? (
                <Button variant="outline" onClick={() => saveJson(true)}>Save as new copies</Button>
              ) : null}
              <Button onClick={() => saveJson(false)}>{collisions.length > 0 ? 'Replace existing' : 'Add module'}</Button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function ColorField({ color, onChange }: { color: string; onChange: (value: string) => void }) {
  return (
    <div>
      <Label htmlFor="accent">Accent color</Label>
      <div className="color-row">
        <input id="accent-picker" aria-label="Pick accent color" type="color" value={parseHex(color) ?? '#007300'} onChange={(event) => onChange(event.target.value)} />
        <Input id="accent" value={color} onChange={(event) => onChange(event.target.value)} spellCheck={false} />
        <span className="swatch lg" style={{ background: parseHex(color) ?? '#ccc' }} />
      </div>
    </div>
  );
}
