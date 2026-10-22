import { Button } from './ui/button.tsx';
import { Dialog, DialogActions } from './ui/dialog.tsx';

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  tone = 'default',
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  tone?: 'default' | 'danger';
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) onClose(); }} title={title} description={description}>
      <DialogActions>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button variant={tone === 'danger' ? 'danger' : 'default'} onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
