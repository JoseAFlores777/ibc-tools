import type { HymnSearchResult } from '@/app/interfaces/Hymn.interface';
import { Button, Badge, Card } from '@/lib/shadcn/ui';
import { cn } from '@/app/lib/shadcn/utils';

interface HymnResultRowProps {
  hymn: HymnSearchResult;
  isSelected: boolean;
  onAdd: (hymn: HymnSearchResult) => void;
}

export default function HymnResultRow({ hymn, isSelected, onAdd }: HymnResultRowProps) {
  return (
    <Card
      className={cn(
        'p-3 flex items-center justify-between min-h-[44px]',
        isSelected && 'bg-muted/50',
      )}
    >
      <div className="flex items-center gap-2 min-w-0 flex-1">
        {hymn.hymn_number !== null && (
          <span className="text-sm font-semibold w-12 flex-shrink-0">{hymn.hymn_number}</span>
        )}
        <span className="text-sm truncate flex-1">{hymn.name}</span>
        {hymn.hymnal && (
          <Badge variant="secondary" className="text-xs flex-shrink-0">
            {hymn.hymnal.name}
          </Badge>
        )}
      </div>

      <div className="ml-2 flex-shrink-0">
        {isSelected ? (
          <Badge variant="outline">Seleccionado</Badge>
        ) : (
          <Button variant="default" size="sm" onClick={() => onAdd(hymn)}>
            Agregar
          </Button>
        )}
      </div>
    </Card>
  );
}
