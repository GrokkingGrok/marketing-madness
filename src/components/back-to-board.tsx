import { ArrowLeft } from 'lucide-react';
import type { MouseEvent } from 'react';
import { href } from '../router.ts';
import { Button } from './ui/button.tsx';

export function BackToGameboard({
  moduleId,
  onClick,
  variant = 'default',
}: {
  moduleId: string;
  onClick?: () => void;
  variant?: 'default' | 'outline' | 'onAccent';
}) {
  function click(event: MouseEvent<HTMLAnchorElement>) {
    event.stopPropagation();
    onClick?.();
  }

  return (
    <Button asChild variant={variant} className="back-board">
      <a href={href({ name: 'board', moduleId })} onClick={click}>
        <ArrowLeft size={16} aria-hidden="true" />
        Back to Gameboard
      </a>
    </Button>
  );
}
