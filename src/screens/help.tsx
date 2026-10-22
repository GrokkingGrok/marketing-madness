import { deriveTheme, themeVars } from '../lib/theme.ts';
import { go } from '../router.ts';
import { useEscape } from '../hooks/use-keys.ts';
import { useApp } from '../state/app-state.tsx';
import { DocumentTitle } from '../components/document-title.tsx';
import { PlayHeader } from '../components/play-header.tsx';
import { MissingModule } from './missing.tsx';

export function HelpScreen({ moduleId }: { moduleId: string }) {
  const app = useApp();
  const resolved = app.getModule(moduleId);
  useEscape(() => go({ name: 'board', moduleId }));
  if (!resolved) return <MissingModule />;
  const theme = deriveTheme(resolved.current.accentColor);

  return (
    <div className="page" style={themeVars(theme)} data-screen="help">
      <DocumentTitle title={`How to play · ${resolved.current.title}`} />
      <PlayHeader module={resolved.current} edited={resolved.edited} />
      <article className="help-copy">
        <h1>How to play</h1>
        <p>
          Marketing Madness is a review game for one shared screen. An emcee runs the board. Teams answer out loud.
          Nothing is saved to an account. This browser keeps the game.
        </p>
        <h2>Setup</h2>
        <ol>
          <li>Open a module. Product Phenomenon ships with the app.</li>
          <li>Choose Players & Scores and name the teams. You can score up to 20.</li>
          <li>Leave this tab on the projector. If you close it, the scores and played tiles are still here next time.</li>
        </ol>
        <h2>A turn</h2>
        <ol>
          <li>A team picks a category and a point value. Higher numbers are meant to be harder.</li>
          <li>Read the question. The blanks are the answer.</li>
          <li>Click the question, or press space, to show the answer. Wordings under “or” all count.</li>
          <li>On the points screen, add or subtract that clue’s value. You can also type a score.</li>
          <li>Back to Gameboard marks the tile played. A dimmed tile can be opened again.</li>
        </ol>
        <h2>Keys</h2>
        <ul>
          <li>Arrow keys move around the board. Enter opens a tile.</li>
          <li>Space reveals the answer, then continues to the points screen.</li>
          <li>Escape goes back one screen.</li>
        </ul>
        <h2>Printouts</h2>
        <p>
          Print / Study makes an emcee key, a study guide, a one-category quiz, a mixed test, and a student word bank.
          Each quiz and test shows a seed. The answer key on the next page uses that same seed, so the numbers match.
        </p>
        <h2>Editing</h2>
        <p>
          Use the pencil by a category, or Edit on a question or answer. Changes stay in this browser. Undo shows for a
          few seconds. Reset to original puts a module back. Export downloads JSON you can share or commit for everyone else.
        </p>
        <h2>New game</h2>
        <p>New Game clears scores and used tiles and keeps the team names. It asks first.</p>
      </article>
    </div>
  );
}
