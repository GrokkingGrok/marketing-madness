import type { ReactNode } from 'react';
import { href } from '../router.ts';
import type { Module } from '../types.ts';
import { BackToGameboard } from './back-to-board.tsx';
import { Mark } from './mark.tsx';
import { NewGameButton } from './new-game-button.tsx';
import { Button } from './ui/button.tsx';

export function PlayHeader({
  module,
  edited,
  backToBoard = false,
  children,
}: {
  module: Module;
  edited: boolean;
  backToBoard?: boolean;
  children?: ReactNode;
}) {
  return (
    <header className="play-header no-print">
      <div className="play-lead">
        {backToBoard ? <BackToGameboard moduleId={module.id} /> : null}
        <a className="wordmark" href={href({ name: 'home' })}>
          <Mark size={26} />
          <span>Marketing Madness</span>
        </a>
      </div>
      <nav className="play-actions" aria-label="Module">
        {children}
        <NewGameButton moduleId={module.id} />
        <Button variant="outline" asChild>
          <a href={href({ name: 'players', moduleId: module.id })}>Players & Scores</a>
        </Button>
        <Button variant="outline" asChild>
          <a href={href({ name: 'print', moduleId: module.id })}>Print / Study</a>
        </Button>
        <Button variant="ghost" asChild>
          <a href={href({ name: 'help', moduleId: module.id })}>How to play</a>
        </Button>
        <Button variant="ghost" asChild>
          <a href={href({ name: 'home' })}>Home</a>
        </Button>
      </nav>
      <span className="sr-only">{edited ? `${module.title} has edits` : module.title}</span>
    </header>
  );
}
