import type { HymnSearchResult } from '@/app/interfaces/Hymn.interface';
import { Button } from '@/lib/shadcn/ui';
import { X } from 'lucide-react';

interface SelectedHymnChipProps {
  hymn: HymnSearchResult;
  onRemove: (hymnId: string) => void;
}

/** Fila de himno seleccionado en el sidebar "Mi Seleccion" */
export default function SelectedHymnChip({ hymn, onRemove }: SelectedHymnChipProps) {
  return (
    <div className="flex items-center gap-2 min-h-[44px] px-2 rounded-md hover:bg-slate-50 group">
      {/* Badge con numero */}
      {hymn.hymn_number !== null && (
        <span className="flex-shrink-0 w-8 h-8 rounded-md bg-slate-100 text-slate-600 text-xs font-semibold flex items-center justify-center">
          {hymn.hymn_number}
        </span>
      )}

      {/* Nombre */}
      <span className="text-sm truncate flex-1 text-slate-700">{hymn.name}</span>

      {/* Boton remover */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onRemove(hymn.id)}
        aria-label={`Quitar ${hymn.name}`}
        className="flex-shrink-0 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <X className="h-3.5 w-3.5 text-slate-400" />
      </Button>
    </div>
  );
}
