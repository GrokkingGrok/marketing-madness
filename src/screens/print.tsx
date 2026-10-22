import { useMemo, useState } from 'react';
import { buildQuiz, buildTest, studyGuide, wordBank, type Paper, type PaperItem } from '../lib/print-model.ts';
import { deriveTheme, themeVars } from '../lib/theme.ts';
import { go } from '../router.ts';
import { useEscape } from '../hooks/use-keys.ts';
import { useApp } from '../state/app-state.tsx';
import { formatAnswerList } from '../lib/text.ts';
import { DocumentTitle } from '../components/document-title.tsx';
import { PlayHeader } from '../components/play-header.tsx';
import { QuestionText } from '../components/question-text.tsx';
import { Button } from '../components/ui/button.tsx';
import { MissingModule } from './missing.tsx';

type DocKind = 'emcee' | 'study' | 'quiz' | 'test' | 'bank';

const DOCS: { id: DocKind; label: string }[] = [
  { id: 'emcee', label: 'Emcee answer key' },
  { id: 'study', label: 'Study guide' },
  { id: 'quiz', label: 'Quiz' },
  { id: 'test', label: 'Test' },
  { id: 'bank', label: 'Answer choice sheet' },
];

function freshSeed(): number {
  return Math.floor(Math.random() * 900000) + 100000;
}

export function PrintScreen({ moduleId }: { moduleId: string }) {
  const app = useApp();
  const resolved = app.getModule(moduleId);
  const module = resolved?.current;
  const [kind, setKind] = useState<DocKind>('emcee');
  const [categoryId, setCategoryId] = useState<string>('all');
  const [quizCategory, setQuizCategory] = useState<string>(module?.categories[0]?.id ?? '');
  const [quizSeed, setQuizSeed] = useState(freshSeed);
  const [testCount, setTestCount] = useState(20);
  const [testSeed, setTestSeed] = useState(freshSeed);
  const quizCat = module?.categories.find((category) => category.id === quizCategory) ?? module?.categories[0];

  useEscape(() => go({ name: 'board', moduleId }));

  const quiz = useMemo(() => (quizCat ? buildQuiz(quizCat, quizSeed) : null), [quizCat, quizSeed]);
  const test = useMemo(() => (module ? buildTest(module, testCount, testSeed) : null), [module, testCount, testSeed]);
  const guide = useMemo(() => (module ? studyGuide(module, categoryId) : []), [module, categoryId]);
  const bank = useMemo(() => (module ? wordBank(module) : []), [module]);

  if (!resolved || !module || !test) return <MissingModule />;
  const theme = deriveTheme(module.accentColor);

  const title =
    kind === 'emcee'
      ? 'Emcee answer key'
      : kind === 'study'
        ? 'Study guide'
        : kind === 'quiz'
          ? 'Quiz'
          : kind === 'test'
            ? 'Test'
            : 'Answer choice sheet';

  return (
    <div className="page" style={themeVars(theme)} data-screen="print">
      <DocumentTitle title={`${title} · ${module.title}`} />
      <div className="no-print">
        <PlayHeader module={module} edited={resolved.edited} backToBoard />
      </div>
      <div className="print-layout">
        <aside className="print-options no-print">
          <h1>Print / Study</h1>
          <p className="quiet">These use the browser’s print dialog. Turn off headers and footers there if you want a cleaner handout.</p>
          <div className="doc-picks" role="tablist">
            {DOCS.map((doc) => (
              <button key={doc.id} type="button" role="tab" aria-selected={kind === doc.id} className={kind === doc.id ? 'on' : ''} onClick={() => setKind(doc.id)}>
                {doc.label}
              </button>
            ))}
          </div>
          {kind === 'study' ? (
            <label>
              Categories
              <select value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>
                <option value="all">Whole board</option>
                {module.categories.map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            </label>
          ) : null}
          {kind === 'quiz' && quizCat ? (
            <>
              <label>
                Category
                <select value={quizCat.id} onChange={(event) => setQuizCategory(event.target.value)}>
                  {module.categories.map((category) => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
              </label>
              <SeedField seed={quizSeed} onChange={setQuizSeed} onRefresh={() => setQuizSeed(freshSeed())} />
            </>
          ) : null}
          {kind === 'test' ? (
            <>
              <label>
                How many questions
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={testCount}
                  onChange={(event) => {
                    const value = event.target.valueAsNumber;
                    if (Number.isFinite(value)) setTestCount(Math.max(1, Math.min(50, Math.round(value))));
                  }}
                />
              </label>
              <SeedField seed={testSeed} onChange={setTestSeed} onRefresh={() => setTestSeed(freshSeed())} />
            </>
          ) : null}
          <Button onClick={() => window.print()}>Print</Button>
        </aside>
        <article className="sheet">
          {kind === 'emcee' ? <EmceeKey title={module.title} categories={module.categories} /> : null}
          {kind === 'study' ? (
            <StudySheet
              title={module.title}
              heading={categoryId === 'all' ? 'All categories' : module.categories.find((category) => category.id === categoryId)?.name ?? 'Study guide'}
              items={guide}
            />
          ) : null}
          {kind === 'quiz' && quiz && quizCat ? (
            <QuestionPaper
              title={module.title}
              kicker={`Quiz · ${quizCat.name}`}
              paper={quiz}
            />
          ) : null}
          {kind === 'test' ? <QuestionPaper title={module.title} kicker={`Test · ${test.items.length} questions`} paper={test} showCategory /> : null}
          {kind === 'bank' ? <WordBank title={module.title} answers={bank} /> : null}
        </article>
      </div>
    </div>
  );
}

function SeedField({ seed, onChange, onRefresh }: { seed: number; onChange: (seed: number) => void; onRefresh: () => void }) {
  return (
    <label>
      Seed
      <span className="seed-row">
        <input
          type="number"
          value={seed}
          onChange={(event) => {
            const value = event.target.valueAsNumber;
            if (Number.isFinite(value)) onChange(value);
          }}
        />
        <Button variant="outline" size="sm" onClick={onRefresh}>New seed</Button>
      </span>
      <span className="quiet">The answer key on the next page uses this same seed.</span>
    </label>
  );
}

function EmceeKey({ title, categories }: { title: string; categories: { name: string; clues: { answers: string[] }[] }[] }) {
  return (
    <>
      <p className="sheet-kicker">Emcee answer key</p>
      <h1>{title}</h1>
      <p className="quiet">For the emcee. Don’t leave this on the projector.</p>
      {categories.map((category) => (
        <section key={category.name} className="sheet-block">
          <h2>{category.name}</h2>
          <dl className="emcee-grid">
            {category.clues.map((clue, index) => (
              <div key={index}>
                <dt>{(index + 1) * 10}</dt>
                <dd>{formatAnswerList(clue.answers) || '—'}</dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
    </>
  );
}

function StudySheet({ title, heading, items }: { title: string; heading: string; items: PaperItem[] }) {
  return (
    <>
      <p className="sheet-kicker">Study guide</p>
      <h1>{title}</h1>
      <p>{heading}, alphabetical by answer.</p>
      {items.map((item) => (
        <article key={item.clue.id} className="study-item">
          <h2>{formatAnswerList(item.clue.answers) || 'No answer yet'}</h2>
          <QuestionText text={item.clue.question} />
          <p className="quiet">{item.category} · {item.points} points</p>
        </article>
      ))}
    </>
  );
}

function QuestionPaper({
  title,
  kicker,
  paper,
  showCategory = false,
}: {
  title: string;
  kicker: string;
  paper: Paper;
  showCategory?: boolean;
}) {
  const seedLabel = `Seed ${paper.seed}`;
  return (
    <>
      <p className="sheet-kicker">{kicker}</p>
      <h1>{title}</h1>
      <p className="seed-line">{seedLabel}</p>
      <p className="name-line">Name ________________________________</p>
      <ol className="paper-questions">
        {paper.items.map((item, index) => (
          <li key={item.clue.id}>
            {showCategory ? <p className="quiet">{item.category}</p> : null}
            <QuestionText text={item.clue.question || 'No question yet.'} />
            <p className="write-line">Answer ________________________________</p>
            <span className="sr-only">Question {index + 1}</span>
          </li>
        ))}
      </ol>
      <section className="page-break">
        <p className="sheet-kicker">Answer key</p>
        <h1>{kicker}</h1>
        <p className="seed-line">{seedLabel}</p>
        <ol>
          {paper.items.map((item) => (
            <li key={`key-${item.clue.id}`}>
              {item.clue.answers.filter(Boolean).map((answer, index) => (
                <span key={answer}>
                  {index > 0 ? <span className="or-inline"> or </span> : null}
                  {answer}
                </span>
              ))}
              {showCategory ? <span className="quiet"> · {item.category}</span> : null}
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}

function WordBank({ title, answers }: { title: string; answers: string[] }) {
  return (
    <>
      <p className="sheet-kicker">Answer choice sheet</p>
      <h1>{title}</h1>
      <p>Every accepted wording, A to Z.</p>
      <ul className="bank">
        {answers.map((answer) => (
          <li key={answer}>{answer}</li>
        ))}
      </ul>
    </>
  );
}
