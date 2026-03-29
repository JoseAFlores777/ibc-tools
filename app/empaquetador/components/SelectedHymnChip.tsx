import type { HymnSearchResult } from '@/app/interfaces/Hymn.interface';
import { Button } from '@/lib/shadcn/ui';
import { X } from 'lucide-react';

interface SelectedHymnChipProps {
  hymn: HymnSearchResult;
  onRemove: (hymnId: string) => void;
}

export default function SelectedHymnChip({ hymn, onRemove }: SelectedHymnChipProps) {
  return (
    <div className="flex items-center justify-between min-h-[44px] px-2">
      <div className="flex items-center gap-2 min-w-0 flex-1">
        {hymn.hymn_number !== null && (
          <span className="text-sm font-semibold flex-shrink-0">{hymn.hymn_number}</span>
        )}
        <span className="text-sm truncate">{hymn.name}</span>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onRemove(hymn.id)}
        aria-label="Quitar"
        className="flex-shrink-0"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
