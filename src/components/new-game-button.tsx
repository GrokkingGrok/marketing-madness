import { useState } from 'react';
import { go } from '../router.ts';
import { useApp } from '../state/app-state.tsx';
import { ConfirmDialog } from './confirm-dialog.tsx';
import { Button } from './ui/button.tsx';

export function NewGameButton({ moduleId, variant = 'outline' }: { moduleId: string; variant?: 'outline' | 'ghost' | 'default' }) {
  const { newGame } = useApp();
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant={variant} onClick={() => setOpen(true)}>
        New Game
      </Button>
      <ConfirmDialog
        open={open}
        title="Start a new game?"
        description="Scores go back to zero and every tile is playable again. Team names stay."
        confirmLabel="New Game"
        onConfirm={() => {
          newGame(moduleId);
          setOpen(false);
          go({ name: 'board', moduleId });
        }}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
