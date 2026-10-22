import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Ellipsis } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '../../lib/cn.ts';

export function Menu({ label, children }: { label: string; children: ReactNode }) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button type="button" className="icon-btn" aria-label={label}>
          <Ellipsis size={18} />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content className="menu-content" align="end" sideOffset={6}>
          {children}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

export function MenuItem({
  children,
  onSelect,
  disabled,
  tone = 'default',
}: {
  children: ReactNode;
  onSelect: () => void;
  disabled?: boolean;
  tone?: 'default' | 'danger';
}) {
  return (
    <DropdownMenu.Item
      className={cn('menu-item', tone === 'danger' && 'danger')}
      disabled={disabled}
      onSelect={onSelect}
    >
      {children}
    </DropdownMenu.Item>
  );
}
