'use client';

import { LayoutGrid, List, Table2 } from 'lucide-react';
import { cn } from '@/lib/cn';

export type ViewMode = 'grid' | 'list' | 'table';

interface ViewModeToggleProps {
  mode: ViewMode;
  onChange: (mode: ViewMode) => void;
}

const modes: { value: ViewMode; icon: typeof LayoutGrid; label: string }[] = [
  { value: 'grid', icon: LayoutGrid, label: 'Grid view' },
  { value: 'list', icon: List, label: 'List view' },
  { value: 'table', icon: Table2, label: 'Table view' },
];

export function ViewModeToggle({ mode, onChange }: ViewModeToggleProps) {
  return (
    <div className="flex items-center rounded-lg border border-border overflow-hidden">
      {modes.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          onClick={() => onChange(value)}
          aria-label={label}
          className={cn(
            'flex h-8 w-9 items-center justify-center transition-colors',
            mode === value
              ? 'bg-foreground text-background'
              : 'bg-surface text-muted hover:text-foreground hover:bg-surface-elevated'
          )}
        >
          <Icon className="h-3.5 w-3.5" />
        </button>
      ))}
    </div>
  );
}
