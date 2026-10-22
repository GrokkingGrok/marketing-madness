import { href } from '../router.ts';
import { DocumentTitle } from '../components/document-title.tsx';
import { Button } from '../components/ui/button.tsx';

export function MissingModule() {
  return (
    <div className="page" data-screen="missing">
      <DocumentTitle title="Module not found" />
      <div className="empty-panel">
        <h1>That module isn’t on this browser</h1>
        <p>It may have been deleted, or this link is from another device. Modules stay in the browser that created them.</p>
        <Button asChild>
          <a href={href({ name: 'home' })}>Back to modules</a>
        </Button>
      </div>
    </div>
  );
}

export function MissingClue({ moduleId }: { moduleId: string }) {
  return (
    <div className="page" data-screen="missing">
      <DocumentTitle title="Clue not found" />
      <div className="empty-panel">
        <h1>That clue isn’t on the board</h1>
        <Button asChild>
          <a href={href({ name: 'board', moduleId })}>Back to the gameboard</a>
        </Button>
      </div>
    </div>
  );
}
