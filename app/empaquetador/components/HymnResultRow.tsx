import { memo } from 'react';
import type { HymnSearchResult } from '@/app/interfaces/Hymn.interface';
import { Badge, Checkbox, TableRow, TableCell, Button } from '@/lib/shadcn/ui';
import { cn } from '@/app/lib/shadcn/utils';
import { Music, Eye } from 'lucide-react';

interface HymnResultRowProps {
  hymn: HymnSearchResult;
  isSelected: boolean;
  onToggle: (hymn: HymnSearchResult) => void;
  onViewDetails: (hymn: HymnSearchResult) => void;
}

/** Fila de himno en la tabla de resultados de busqueda */
const HymnResultRow = memo(function HymnResultRow({ hymn, isSelected, onToggle, onViewDetails }: HymnResultRowProps) {
  return (
    <TableRow
      className={cn(
        'transition-colors',
        isSelected && 'bg-primary/5',
      )}
      data-state={isSelected ? 'selected' : undefined}
    >
      {/* Checkbox */}
      <TableCell className="w-10 pr-0">
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onToggle(hymn)}
          aria-label={`Seleccionar ${hymn.name}`}
        />
      </TableCell>

      {/* Numero */}
      <TableCell className="w-16 font-mono text-slate-400 text-sm">
        {hymn.hymn_number !== null ? String(hymn.hymn_number).padStart(3, '0') : '—'}
      </TableCell>

      {/* Nombre */}
      <TableCell className="font-medium text-slate-800">{hymn.name}</TableCell>

      {/* Himnario */}
      <TableCell className="hidden sm:table-cell text-sm text-slate-500">
        {hymn.hymnal?.name ?? '—'}
      </TableCell>

      {/* Categorias */}
      <TableCell className="hidden md:table-cell">
        <div className="flex flex-wrap gap-1">
          {hymn.categories.slice(0, 2).map((cat) =>
            cat.hymn_categories_id ? (
              <Badge
                key={cat.hymn_categories_id.id}
                variant="secondary"
                className="text-[10px] font-normal"
              >
                {cat.hymn_categories_id.name}
              </Badge>
            ) : null,
          )}
          {hymn.categories.length > 2 && (
            <Badge variant="outline" className="text-[10px]">
              +{hymn.categories.length - 2}
            </Badge>
          )}
        </div>
      </TableCell>

      {/* Acciones */}
      <TableCell className="w-20 text-right">
        <div className="flex items-center justify-end gap-1">
          {hymn.hasAnyAudio && (
            <Music className="h-4 w-4 text-primary flex-shrink-0" />
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails(hymn);
            }}
            aria-label={`Ver detalles de ${hymn.name}`}
          >
            <Eye className="h-4 w-4 text-slate-400" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
});

export default HymnResultRow;
