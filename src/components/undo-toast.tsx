import { Undo2, X } from 'lucide-react';
import { useApp } from '../state/app-state.tsx';

export function UndoToast() {
  const { undo, performUndo, dismissUndo } = useApp();
  if (!undo) return null;
  return (
    <div className="toast no-print" role="status">
      <span>{undo.label}</span>
      <button type="button" className="toast-undo" onClick={performUndo}>
        <Undo2 size={16} /> Undo
      </button>
      <button type="button" className="icon-btn" aria-label="Dismiss" onClick={dismissUndo}>
        <X size={16} />
      </button>
    </div>
  );
}
